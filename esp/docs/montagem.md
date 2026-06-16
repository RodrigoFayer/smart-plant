# Montagem & layout na protoboard

Referência de ligação física do ESP12 (NodeMCU Amica) + ADS1115, descrita em
[environment-and-pinout.md](environment-and-pinout.md) e [sensors.md](sensors.md).
Versão em português de [wiring.md](wiring.md) para execução rápida.

Protoboard usada: tamanho cheio, colunas **1–30**, linhas **A–J** (A–E acima do canal
central, F–J abaixo), com um par de trilhos de alimentação na borda de cima e outro na
borda de baixo.

## 1. Mapa final de pinos (NodeMCU)

| Pino NodeMCU | Função | Vai para | Jumper |
|---|---|---|---|
| 3V3 | Alimentação | Trilho `+` da protoboard | F-M |
| GND | Alimentação | Trilho `-` da protoboard | F-M |
| D1 (GPIO5) | I2C SCL | Linha do barramento I2C SCL na protoboard | F-M |
| D2 (GPIO4) | I2C SDA | Linha do barramento I2C SDA na protoboard | F-M |
| D3 (GPIO0) | Dado DHT11 | Linha de sinal na protoboard (→ DHT11) | F-M |
| D5 (GPIO14) | DO sensor de chuva | Linha de sinal na protoboard (→ chuva) | F-M |
| D6 (GPIO12) | Sinal BTN1 | Linha de sinal na protoboard (→ BTN1) | F-M |
| D7 (GPIO13) | Sinal BTN2 | Linha de sinal na protoboard (→ BTN2) | F-M |
| A0, D0, D4, D8 | Livres | — | — |

> O NodeMCU fica com os pinos macho expostos (não encaixado na protoboard). Todo jumper
> que sai dele tem ponta **fêmea** no NodeMCU e ponta **macho** na protoboard → **F-M**.
> Cada pino do NodeMCU é levado a uma linha da protoboard; de lá, os módulos seguem
> conforme a seção 3.

> A0, D0, D4 e D8 ficam livres: o MQ135 e o LDR foram para o ADS1115 (veja abaixo) e o
> buzzer não é usado nesta montagem.

## 2. ADS1115 (ADC I2C, mesmo barramento I2C do OLED)

| Pino ADS1115 | Conecta em | Jumper |
|---|---|---|
| VDD | Trilho `+` (3,3V) | M-M |
| GND | Trilho `-` | M-M |
| SCL | Linha do D1 (compartilhada com SCL do OLED) | M-M |
| SDA | Linha do D2 (compartilhada com SDA do OLED) | M-M |
| ADDR | Trilho `-` (GND → endereço I2C fixo `0x48`) | M-M |
| A0 | AO do HL-69 (solo) | M-F |
| A1 | AO do MQ135 | M-F |
| A2 | — (não usado) | — |
| A3 | Ponto médio do divisor do LDR (luz) | M-M (na placa) |

> Alimente o ADS1115 e os divisores do MQ135/HL-69/LDR todos pelo **trilho de 3,3V**,
> nunca pelo 5V/VIN. Isso mantém cada sinal analógico dentro da faixa segura de entrada
> do ADS1115 (≤ VDD). O aquecedor do MQ135 fica um pouco mais frio que a especificação
> de 5V do datasheet, o que é aceitável para tendências relativas de ppm num projeto
> hobby.

## 3. Ligação sensor por sensor

| Componente | Pino | Conecta em | Jumper |
|---|---|---|---|
| OLED SSD1306 | VCC | Trilho `+` | M-F |
| | GND | Trilho `-` | M-F |
| | SCL | Linha do D1 / SCL do ADS1115 | M-F |
| | SDA | Linha do D2 / SDA do ADS1115 | M-F |
| DHT11 | VCC | Trilho `+` | M-F |
| | GND | Trilho `-` | M-F |
| | DATA | D3 | M-F |
| Módulo sensor de chuva | VCC | Trilho `+` | M-F |
| | GND | Trilho `-` | M-F |
| | DO | D5 | M-F |
| HL-69 (solo) | VCC | Trilho `+` | M-F |
| | GND | Trilho `-` | M-F |
| | AO | ADS1115 A0 | M-F |
| MQ135 | VCC | Trilho `+` | M-F |
| | GND | Trilho `-` | M-F |
| | AO | ADS1115 A1 | M-F |
| LDR (luz) + 1kΩ | perna 1 do LDR | Trilho `+` | na placa, sem jumper |
| | perna 2 do LDR / perna 1 do R (ponto médio) | ADS1115 A3 | M-M |
| | perna 2 do R | Trilho `-` | na placa, sem jumper |
| BTN1 (wake/modo) | sinal | D6 | M-F |
| | VCC / GND | trilhos | M-F |
| BTN2 (rega manual) | sinal | D7 | M-F |
| | VCC / GND | trilhos | M-F |

> O buzzer **não é usado** nesta montagem (D4 fica livre). Só **um LDR** é instalado, no A3 —
> o A2 fica livre.

**Legenda dos jumpers**
- **F-M** (fêmea–macho): ponta fêmea encaixa no pino macho do **NodeMCU**, ponta macho
  no furo da protoboard — usado para tudo que sai do NodeMCU (ele não está encaixado na
  protoboard, fica com os pinos para cima).
- **M-M** (macho–macho): as duas pontas encaixam em furos da protoboard — usado para
  ligar trilhos, linhas e peças encaixadas na placa (ADS1115, divisores de LDR).
- **M-F** (macho–fêmea): ponta macho no furo da protoboard, ponta fêmea encaixa no
  header de pinos do módulo — usado para todo sensor que fica fora da placa (perto do
  vaso, no ar livre, no solo, etc.).

## 4. Layout na protoboard

A protoboard acomoda o ESP, o ADS1115 e o divisor de tensão do LDR (tudo que
se beneficia de ficar perto do barramento I2C / ADC). Os módulos de sensor que precisam
ficar em outro lugar (sonda de solo no vaso, DHT11 no ar livre, sensor de chuva exposto,
OLED na face do gabinete, botões na caixa) voltam por jumpers M-F até os trilhos
e linhas de sinal descritos acima.

| Colunas | Linhas | Ocupante |
|---|---|---|
| 1–15 | A e J (atravessa o canal) | NodeMCU ESP12 (Amica) |
| 16 | — | espaço vazio |
| 17–26 | F (header único em linha) | Módulo ADS1115 |
| 27–28 | A–E | LDR + resistor 1kΩ — divisor (→ A3) |
| trilho de cima | `+` / `-` | 3,3V / GND, alimentado pelo 3V3 / GND do NodeMCU |
| trilho de baixo | `+` / `-` | 3,3V / GND espelhado, em jumper do trilho de cima |

> **Qual trilho é `+` e qual é `-`:** cada trilho de força tem duas linhas paralelas,
> uma com listra **vermelha** e outra com listra **azul**. Use sempre a linha da listra
> **vermelha = `+` (3,3V)** e a da listra **azul = `-` (GND)**. Eletricamente tanto faz
> qual linha você escolhe — o que importa é manter o mesmo padrão nos trilhos de cima e
> de baixo. Ligue o 3V3 do NodeMCU na linha vermelha e o GND na linha azul.

### Matriz da protoboard

```
        1-5    6-10   11-15  16   17-21  22-26  27-28
 (+) ─────────────────────────────────────────────────  trilho 3,3V
 (-) ─────────────────────────────────────────────────  trilho GND
  A  [ NodeMCU linha de pinos 1     ][ ADS────────][LDR ]
  B  [                              ][   1115     ][ +  ]
  C  [        ESP12 / NodeMCU       ][  módulo    ][1kΩ ]
  D  [          (encaixado)         ][  (10 pinos ][div ]
  E  [                              ][  em linha) ][    ]
  ── canal ───────────────────────────────────────────────────
  F  [                              ][pinos ADS1115]
  G  [                              ]
  H  [        ESP12 / NodeMCU       ]
  I  [        (encaixado)           ]
  J  [ NodeMCU linha de pinos 2     ]
 (+) ───────────────────────────────────────────────────────  trilho 3,3V
 (-) ───────────────────────────────────────────────────────  trilho GND
```

Os módulos fora da placa (OLED, DHT11, chuva, HL-69, MQ135, BTN1, BTN2) não
aparecem na grade — eles ficam pendurados nos trilhos e linhas de sinal via jumpers M-F,
conforme as tabelas acima.

### Diagrama de pinos do ESP12 / NodeMCU

```
              ┌───────────────────────┐
        A0 ───┤ 1                   30 ├─── D0  (livre)
       GND ───┤ 2                   29 ├─── D1  (I2C SCL)
       VIN ───┤ 3                   28 ├─── D2  (I2C SDA)
        D3 ───┤ 4   (dado DHT11)    27 ├─── GND
        D4 ───┤ 5   (livre)        26 ├─── 3V3
       3V3 ───┤ 6                   25 ├─── D5  (chuva DO)
       GND ───┤ 7                   24 ├─── D6  (BTN1)
        RX ───┤ 8                   23 ├─── D7  (BTN2)
        TX ───┤ 9                   22 ├─── D8  (livre)
       GND ───┤ 10                  21 ├─── 3V3
              └───────────[ USB ]──────┘
```

> A ordem dos pinos/silk pode variar um pouco entre revisões do NodeMCU Amica — confira
> contra o rótulo impresso na sua placa antes de ligar.
