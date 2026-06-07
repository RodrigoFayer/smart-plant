# ESP — Firmware NodeMCU ESP12 Amica

## Contexto

Firmware em C++ para Arduino IDE / PlatformIO. Lê todos os sensores a cada 5 segundos, publica via MQTT, controla LEDs/buzzer/OLED com base no estado recebido do backend.

## Ambiente

- **Placa**: NodeMCU ESP12 Amica (ESP8266)
- **IDE**: PlatformIO (preferível) ou Arduino IDE 2.x
- **Framework**: Arduino
- **Linguagem**: C++

## Dependências (platformio.ini)

```ini
[env:nodemcuv2]
platform = espressif8266
board = nodemcuv2
framework = arduino
lib_deps =
    knolleary/PubSubClient        ; MQTT
    adafruit/DHT sensor library   ; DHT11
    adafruit/Adafruit BMP085 Unified ; BMP180
    adafruit/Adafruit Unified Sensor
    adafruit/Adafruit SSD1306     ; OLED
    adafruit/Adafruit GFX Library
    arduino-libraries/NTPClient   ; horário para modo noturno
```

## Pinagem

| Pino ESP | Componente | Observação |
|---|---|---|
| D1 (GPIO5) | SCL | I2C — BMP180 e OLED compartilham |
| D2 (GPIO4) | SDA | I2C — BMP180 e OLED compartilham |
| D3 (GPIO0) | DHT11 | Data |
| D4 (GPIO2) | Buzzer | Ativo — HIGH = liga |
| D5 (GPIO14) | Sensor chuva | Digital OUT do módulo |
| D6 (GPIO12) | BTN1 | Pull-down 10kΩ para GND |
| D7 (GPIO13) | BTN2 | Pull-down 10kΩ para GND |
| A0 | HL-69 (AO) | Leitura analógica de umidade do solo |
| D8 (GPIO15) | LDR esquerda | Divisor com 10kΩ |
| D0 (GPIO16) | LDR direita | Divisor com 10kΩ |
| D4–D9 (via shift register 74HC595) | LEDs barra solo | 5 LEDs — DATA/LATCH/CLK |

> Os LEDs RGB usam 3 pinos cada (R, G, B) com resistor 220Ω em série.
> Se os pinos acabarem, use o shift register 74HC595 para expandir saídas digitais.

## Estrutura de arquivos

```
esp/
├── CLAUDE.md
├── platformio.ini
├── src/
│   ├── main.cpp          ← setup() e loop() principais
│   ├── config.h          ← credenciais Wi-Fi, IP do broker, pinos
│   ├── sensors.h / .cpp  ← leitura de todos os sensores
│   ├── mqtt.h / .cpp     ← conexão e publicação MQTT
│   ├── display.h / .cpp  ← lógica do OLED e Tamagotchi
│   └── leds.h / .cpp     ← controle dos LEDs RGB e barra
└── test/
```

## config.h — variáveis obrigatórias

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi
const char* WIFI_SSID     = "SUA_REDE";
const char* WIFI_PASSWORD = "SUA_SENHA";

// MQTT
const char* MQTT_HOST     = "192.168.1.100"; // IP do backend na rede local
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT   = "smart-plant-esp";

// Intervalo de leitura (ms)
const int LEITURA_INTERVALO = 5000;

#endif
```

> Nunca commitar config.h — adicionar ao .gitignore. Fornecer config.example.h no repositório.

## Comportamento dos botões

### BTN1 — Modo / Silenciar
- **Pressão curta** (< 1s): alterna modo de exibição do OLED (Normal → Noturno → Econômico)
- **Pressão longa** (> 2s): silencia o buzzer e publica `planta/comandos {"acao": "silenciar"}`
- Implementar com debounce de 50ms e millis() — nunca usar delay()

### BTN2 — Rega manual
- **Qualquer pressão**: registra rega manual, publica `planta/comandos {"acao": "rega_manual", "timestamp": <epoch>}`
- Alternativa sem botão: detectar subida rápida do HL-69 (> 20 pontos em < 30s) e publicar automaticamente

## Leitura do HL-69

O ESP8266 tem apenas 1 pino analógico (A0) com resolução de 10 bits (0–1023). O HL-69 entrega tensão inversamente proporcional à umidade — solo seco = valor alto, solo úmido = valor baixo. Inverter e mapear na leitura:

```cpp
int raw = analogRead(A0);           // 0–1023
int umidade = map(raw, 1023, 0, 0, 100); // inverte e converte para %
umidade = constrain(umidade, 0, 100);
```

> O potenciômetro 10k permanece disponível no kit para uso geral (ajuste de brilho, threshold local, etc).

## Comportamento dos LEDs

### LED RGB 1 — Status geral
| Cor | Significado |
|---|---|
| Verde | Todos os parâmetros normais |
| Amarelo | 1 parâmetro em atenção |
| Vermelho | 1 ou mais parâmetros críticos |

### LED RGB 2 — Alertas específicos
| Cor | Trigger |
|---|---|
| Azul | Chuva detectada |
| Vermelho | Temperatura crítica (> 38°C) |
| Amarelo | Solo seco (< 20%) |
| Roxo | Ar poluído (> 700 ppm) |
| Apagado | Sem alertas ativos |

### Barra de 5 LEDs — Umidade do solo
- 0% → todos apagados
- 1–20% → 1 LED vermelho
- 21–40% → 2 LEDs amarelos
- 41–60% → 3 LEDs amarelos
- 61–80% → 4 LEDs verdes
- 81–100% → 5 LEDs verdes

## Display OLED — Modos

### Modo Normal
- Lado esquerdo: personagem Tamagotchi animado (estado da planta)
- Lado direito: barras de umidade do solo, temperatura e luz (3 barras verticais)
- Rodapé: mensagem de status ("Estou ótima!" / "Preciso de água...")

### Modo Noturno
- Brilho reduzido ao mínimo
- Apenas hora atual (NTPClient)
- Personagem dormindo, sem animações

### Modo Econômico
- Display apaga após 30s sem eventos
- Acende com qualquer pressão de botão ou novo alerta

## Tamagotchi — estados e expressões no OLED

| Estado | Expressão | Animação |
|---|---|---|
| Feliz | Sorriso, bochechas | Pisca + gotinhas ao redor |
| Com sede | Triste, suor | Gota descendo |
| Com calor | Cansado, língua | Ondas de calor subindo |
| Sem luz | Sonolento | ZZZ piscando |
| Doente | Rosto verde | ! piscando |
| Dormindo | Olhos fechados | ZZZ suave |

## Regras de implementação

- Nunca usar `delay()` — usar `millis()` para temporização não-bloqueante
- Reconectar Wi-Fi e MQTT automaticamente se a conexão cair
- Watchdog ativo — se o loop travar por mais de 8s, reiniciar
- Serial.begin(115200) ativo em debug — remover prints verbosos na versão final
- Sensor MQ135 precisa de 30s de aquecimento após ligar — não publicar leituras antes disso