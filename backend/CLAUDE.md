# Backend — Node.js + Aedes + Socket.IO

## Contexto

Servidor Node.js que centraliza tudo: broker MQTT embutido (Aedes), processamento dos dados dos sensores, persistência, cálculo do estado da planta (Tamagotchi) e distribuição em tempo real para o app via Socket.IO.

## Stack

- **Runtime**: Node.js 20+
- **MQTT Broker**: Aedes
- **API REST**: Express
- **Tempo real**: Socket.IO
- **Banco de dados**: SQLite (via better-sqlite3) — simples para protótipo
- **ORM / Query builder**: nativo (better-sqlite3 é síncrono, sem ORM necessário)
- **Linguagem**: JavaScript (ESModules)

## Estrutura de arquivos

```
backend/
├── CLAUDE.md
├── package.json
├── .env.example
├── .env                  ← nunca commitar
├── src/
│   ├── index.js          ← entry point — sobe tudo
│   ├── broker.js         ← Aedes MQTT broker
│   ├── database.js       ← conexão SQLite e migrations
│   ├── plantaLogic.js    ← calcula estado do Tamagotchi
│   ├── handlers/
│   │   ├── dht11.js      ← processa planta/sensores/dht11
│   │   ├── bmp180.js
│   │   ├── mq135.js
│   │   ├── chuva.js
│   │   ├── ldr.js
│   │   └── solo.js
│   ├── routes/
│   │   ├── historico.js  ← GET /historico?sensor=dht11&periodo=24h
│   │   └── status.js     ← GET /status (último estado de tudo)
│   └── socket.js         ← Socket.IO setup e emissão de eventos
└── db/
    └── smart-plant.db    ← gerado automaticamente, não commitar
```

## .env.example

```env
PORT_HTTP=3000
PORT_MQTT=1883
DB_PATH=./db/smart-plant.db
```

## Banco de dados — schema SQLite

```sql
-- Leituras brutas de cada sensor
CREATE TABLE leituras (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor    TEXT NOT NULL,          -- 'dht11', 'bmp180', etc.
  payload   TEXT NOT NULL,          -- JSON stringificado
  criado_em INTEGER NOT NULL        -- epoch Unix (Date.now())
);

-- Estado calculado da planta (histórico)
CREATE TABLE estados (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  estado    TEXT NOT NULL,          -- 'feliz', 'com_sede', etc.
  motivo    TEXT,                   -- 'solo abaixo de 20%'
  criado_em INTEGER NOT NULL
);

-- Eventos de rega (manual ou detectada)
CREATE TABLE regas (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  origem    TEXT NOT NULL,          -- 'manual_btn', 'manual_inferido', 'chuva'
  criado_em INTEGER NOT NULL
);

-- Índices
CREATE INDEX idx_leituras_sensor ON leituras(sensor, criado_em);
CREATE INDEX idx_estados_criado  ON estados(criado_em);
```

## broker.js — estrutura esperada

```javascript
import aedes from 'aedes'
import { createServer } from 'net'
import { despacharMensagem } from './handlers/index.js'

export function iniciarBroker(porta) {
  const broker = aedes()
  const server = createServer(broker.handle)

  broker.on('publish', (packet, client) => {
    if (!client) return // ignorar mensagens internas do broker
    const topico = packet.topic
    const payload = JSON.parse(packet.payload.toString())
    despacharMensagem(topico, payload)
  })

  server.listen(porta, () => {
    console.log(`Broker MQTT rodando na porta ${porta}`)
  })

  return broker
}
```

## plantaLogic.js — lógica do Tamagotchi

A função `calcularEstado(leituras)` recebe o último snapshot de todos os sensores e retorna o estado atual:

```javascript
// leituras = { temp, umidadeAr, umidadeSolo, lux, ppm, chuva, pressao }
// retorna = { estado, motivo, cor }

export function calcularEstado(leituras) {
  const { temp, umidadeSolo, lux, ppm } = leituras
  const criticos = []

  if (umidadeSolo < 20) criticos.push('solo seco')
  if (temp > 38)        criticos.push('temperatura crítica')
  if (ppm > 700)        criticos.push('ar poluído')
  if (lux < 50)         criticos.push('sem luz')

  if (criticos.length >= 2) return { estado: 'doente',    motivo: criticos.join(', '), cor: 'vermelho' }
  if (umidadeSolo < 30)     return { estado: 'com_sede',  motivo: 'solo abaixo de 30%', cor: 'amarelo' }
  if (temp > 35)            return { estado: 'com_calor', motivo: 'temp acima de 35°C', cor: 'laranja' }
  if (lux < 100)            return { estado: 'sem_luz',   motivo: 'luminosidade baixa', cor: 'roxo' }

  return { estado: 'feliz', motivo: null, cor: 'verde' }
}
```

## Rotas REST

### GET /status
Retorna o último valor de cada sensor e o estado atual da planta.

```json
{
  "planta": { "estado": "feliz", "motivo": null },
  "sensores": {
    "dht11":  { "temp": 24, "umidade": 62, "em": 1720000000 },
    "solo":   { "umidade": 65, "em": 1720000000 },
    "ldr":    { "esquerda": 680, "direita": 540, "em": 1720000000 },
    "mq135":  { "ppm": 320, "em": 1720000000 },
    "bmp180": { "pressao": 1013, "em": 1720000000 },
    "chuva":  { "detectado": false, "em": 1720000000 }
  },
  "ultimaRega": { "origem": "manual_btn", "em": 1719900000 }
}
```

### GET /historico
Query params: `sensor` (obrigatório), `periodo` (padrão: `24h`, aceita `1h`, `7d`, `30d`)

Retorna array de leituras no período, ordenadas por `criado_em` ASC.

## Socket.IO — eventos emitidos

| Evento | Quando | Payload |
|---|---|---|
| `sensor:update` | A cada nova leitura do ESP | `{ sensor, dados, em }` |
| `planta:estado` | Quando o estado muda | `{ estado, motivo, cor }` |
| `planta:alerta` | Quando parâmetro entra em zona crítica | `{ tipo, mensagem }` |
| `rega:registrada` | Rega detectada ou manual | `{ origem, em }` |

## Regras de implementação

- Manter em memória o último valor de cada sensor (`Map` ou objeto global) — não bater no banco a cada cálculo de estado
- Recalcular o estado da planta a cada nova leitura recebida
- Persistir leituras no banco de forma assíncrona — não bloquear o handler MQTT
- Rotina de limpeza: deletar leituras com mais de 30 dias (rodar 1x por dia com `setInterval`)
- Tratar JSON.parse com try/catch em todo payload MQTT — ESP pode enviar dado malformado
- Porta 1883 (MQTT) e 3000 (HTTP+Socket.IO) podem ser configuradas via `.env`
