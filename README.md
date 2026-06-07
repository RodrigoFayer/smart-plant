# Smart Plant — Vaso de Planta Inteligente 🌱

Sistema de monitoramento de planta com ESP12 (NodeMCU Amica), backend Node.js com broker MQTT embutido e app React Native. A planta tem uma "personalidade" estilo Tamagotchi exibida em display OLED.

## Estrutura do repositório

```
smart-plant/
├── CLAUDE.md          ← contexto geral do projeto
├── esp/               ← firmware Arduino/C++ para o NodeMCU ESP12
├── backend/           ← servidor Node.js (MQTT broker + API + WebSocket)
└── frontend/          ← app React Native
```

Cada diretório possui seu próprio `CLAUDE.md` com detalhes específicos.

## Hardware

| Componente | Qtd | Uso |
|---|---|---|
| NodeMCU ESP12 Amica | 1 | Microcontrolador principal |
| Display OLED 0.96" I2C (SSD1306) | 1 | Tamagotchi + leituras |
| DHT11 | 1 | Temperatura e umidade do ar |
| BMP180 | 1 | Pressão atmosférica (I2C) |
| MQ135 | 1 | Qualidade do ar (ppm) |
| Sensor de chuva | 1 | Detecção de precipitação |
| LDR | 2 | Luminosidade (esquerda e direita) |
| Sensor de umidade do solo HL-69 | 1 | Umidade do solo (AO + DO) |
| Potenciômetro 10k | 1 | Ajuste fino / uso geral |
| Buzzer ativo | 1 | Alertas sonoros |
| LED RGB | 2 | Status geral e alertas |
| LED diversas cores | 15 | Barra de nível de umidade do solo |
| Push Button | 2 | BTN1: modo/silenciar — BTN2: rega manual |

## Fluxo de dados

```
ESP12
  └─ Wi-Fi / MQTT (porta 1883)
        └─ Backend Node.js
              ├─ Aedes (broker MQTT embutido)
              ├─ Processa e persiste no banco
              └─ Socket.IO → App React Native
```

## Tópicos MQTT

| Tópico | Direção | Payload |
|---|---|---|
| `planta/sensores/dht11` | ESP → Backend | `{"temp": 24, "umidade": 62}` |
| `planta/sensores/bmp180` | ESP → Backend | `{"pressao": 1013, "altitude": 0}` |
| `planta/sensores/mq135` | ESP → Backend | `{"ppm": 320}` |
| `planta/sensores/chuva` | ESP → Backend | `{"detectado": true}` |
| `planta/sensores/ldr` | ESP → Backend | `{"esquerda": 680, "direita": 540}` |
| `planta/sensores/solo` | ESP → Backend | `{"umidade": 45}` |
| `planta/alertas` | Backend → ESP | `{"tipo": "critico", "msg": "Solo seco!"}` |
| `planta/comandos` | App → ESP | `{"acao": "silenciar"}` |

## Lógica de saúde da planta (Tamagotchi)

O estado da planta é calculado pelo backend cruzando todos os sensores:

- **Feliz**: solo 40–80%, temp 18–28°C, lux > 300, ppm < 400
- **Com sede**: solo < 30% por mais de 30 min
- **Com calor**: temp > 35°C
- **Sem luz**: lux < 100 por mais de 2h
- **Doente**: 2 ou mais parâmetros críticos simultaneamente
- **Dormindo**: entre 22h–7h ou modo noturno ativo (BTN1)

O estado é publicado via Socket.IO para o app e exibido no OLED do ESP.

## Convenções gerais

- Português para variáveis de domínio (`umidadeSolo`, `estadoPlanta`)
- Inglês para infraestrutura e nomes de função (`connectMQTT`, `publishSensor`)
- Nunca commitar credenciais — usar `.env` em todos os projetos
- Intervalo padrão de leitura dos sensores: **5 segundos**

## Componentes

- [esp/](esp/) — Firmware do NodeMCU ESP12 (Arduino/C++)
- [backend/](backend/) — Servidor Node.js (broker MQTT + API + WebSocket)
- [frontend/](frontend/) — App React Native
