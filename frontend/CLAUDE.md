# Frontend — App React Native

## Contexto

App mobile que exibe o estado da planta em tempo real, histórico de leituras e o personagem Tamagotchi. Conecta ao backend via Socket.IO para dados ao vivo e via REST para histórico.

## Stack

- **Framework**: React Native (Expo — managed workflow)
- **Linguagem**: TypeScript
- **Tempo real**: socket.io-client
- **Estado global**: Zustand
- **Navegação**: Expo Router (file-based routing)
- **Gráficos**: Victory Native
- **Requisições REST**: fetch nativo com React Query (TanStack Query)

## Estrutura de arquivos

```
frontend/
├── CLAUDE.md
├── app.json
├── package.json
├── .env.example
├── .env                      ← nunca commitar
├── app/
│   ├── _layout.tsx           ← layout raiz, provider do Socket.IO
│   ├── index.tsx             ← tela principal (dashboard + Tamagotchi)
│   ├── historico.tsx         ← gráficos históricos por sensor
│   └── config.tsx            ← configurações (IP do servidor, alertas)
├── components/
│   ├── Tamagotchi.tsx        ← personagem animado (Canvas/SVG)
│   ├── SensorCard.tsx        ← card individual de sensor
│   ├── BarraUmidade.tsx      ← barra visual de umidade do solo
│   ├── GraficoSensor.tsx     ← gráfico de linha (Victory Native)
│   └── AlertaBanner.tsx      ← banner de alerta no topo
├── store/
│   └── plantaStore.ts        ← Zustand — estado global dos sensores
├── hooks/
│   ├── useSocket.ts          ← conecta Socket.IO e atualiza o store
│   └── useHistorico.ts       ← React Query para dados históricos
├── services/
│   └── api.ts                ← base URL + funções fetch
└── constants/
    └── thresholds.ts         ← limites de cada sensor (igual ao backend)
```

## .env.example

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

> Usar o IP local do backend na rede Wi-Fi. Em produção, substituir por URL pública.

## plantaStore.ts — shape do estado Zustand

```typescript
interface SensoresState {
  dht11:  { temp: number; umidade: number; em: number } | null
  solo:   { umidade: number; em: number } | null
  ldr:    { esquerda: number; direita: number; em: number } | null
  mq135:  { ppm: number; em: number } | null
  bmp180: { pressao: number; em: number } | null
  chuva:  { detectado: boolean; em: number } | null
  planta: { estado: EstadoPlanta; motivo: string | null; cor: string } | null
  ultimaRega: { origem: string; em: number } | null
  alertas: Alerta[]
}

type EstadoPlanta = 'feliz' | 'com_sede' | 'com_calor' | 'sem_luz' | 'doente' | 'dormindo'
```

## useSocket.ts — estrutura esperada

```typescript
// Conecta ao Socket.IO e popula o store automaticamente
// Reconecta se a conexão cair (socket.io-client faz isso nativamente)
// Expõe: { conectado: boolean }

export function useSocket() {
  const set = usePlantaStore(s => s.set)

  useEffect(() => {
    const socket = io(BACKEND_URL)

    socket.on('sensor:update', ({ sensor, dados }) => {
      set(state => ({ ...state, [sensor]: dados }))
    })

    socket.on('planta:estado', (estado) => {
      set(state => ({ ...state, planta: estado }))
    })

    socket.on('planta:alerta', (alerta) => {
      set(state => ({ ...state, alertas: [alerta, ...state.alertas].slice(0, 10) }))
    })

    return () => socket.disconnect()
  }, [])
}
```

## Tela principal (index.tsx)

Layout em scroll vertical:

1. **Header**: nome da planta + indicador de conexão (bolinha verde/vermelha)
2. **Tamagotchi**: personagem animado centralizado, estado embaixo ("Estou ótima! 🌱")
3. **Cards de sensores**: grid 2 colunas
   - Temperatura + Umidade do ar (DHT11)
   - Umidade do solo (barra visual)
   - Luminosidade (ícone sol com intensidade)
   - Qualidade do ar (ppm com badge colorido)
   - Pressão atmosférica (BMP180)
   - Chuva (ícone com status)
4. **Última rega**: "Há 2 dias — manual" com botão "Registrar rega agora"
5. **Alertas recentes**: lista dos últimos alertas com timestamp

## Componente Tamagotchi.tsx

Usar `react-native-svg` para desenhar o personagem. O componente recebe `estado: EstadoPlanta` e anima com `react-native-reanimated`:

- Animação de piscar dos olhos a cada 3–5s (aleatório)
- Animação de balanço suave (loop, usando `useSharedValue` + `withRepeat`)
- Partículas específicas por estado (gotas, calor, ZZZ) com `withTiming`
- Expressão facial muda conforme o estado recebido

## SensorCard.tsx — props

```typescript
interface SensorCardProps {
  titulo: string
  valor: string | number
  unidade: string
  status: 'ok' | 'atencao' | 'critico'
  icone: string  // nome do ícone Ionicons
  ultimaAtualizacao: number  // epoch
}
```

O badge de status usa cores semânticas: verde para ok, amarelo para atenção, vermelho para crítico. A cor é calculada em `constants/thresholds.ts` com base no valor recebido.

## thresholds.ts — limites dos sensores

```typescript
// Deve ser idêntico ao plantaLogic.js do backend
export const THRESHOLDS = {
  temp:        { ok: [18, 30],  atencao: [10, 35],  unidade: '°C' },
  umidadeAr:   { ok: [40, 70],  atencao: [30, 80],  unidade: '%'  },
  umidadeSolo: { ok: [40, 80],  atencao: [30, 90],  unidade: '%'  },
  lux:         { ok: [300, Infinity], atencao: [100, Infinity], unidade: 'lux' },
  ppm:         { ok: [0, 400],  atencao: [0, 600],  unidade: 'ppm' },
}

export function calcularStatus(sensor: keyof typeof THRESHOLDS, valor: number): 'ok' | 'atencao' | 'critico' {
  const t = THRESHOLDS[sensor]
  if (valor >= t.ok[0] && valor <= t.ok[1]) return 'ok'
  if (valor >= t.atencao[0] && valor <= t.atencao[1]) return 'atencao'
  return 'critico'
}
```

## Tela de histórico (historico.tsx)

- Seletor de sensor (picker) + seletor de período (1h / 24h / 7d / 30d)
- Gráfico de linha (Victory Native) com os dados do período
- Linha de referência horizontal nos limites ok/atenção
- Loading skeleton enquanto carrega

## Regras de implementação

- Nunca fazer fetch direto nos componentes — usar hooks ou o store
- Todos os timestamps chegam como epoch Unix — formatar com `Intl.DateTimeFormat` ou `date-fns`
- Mostrar estado de "sem conexão" claramente quando Socket.IO desconectar
- Suportar tema claro e escuro nativamente (useColorScheme do React Native)
- O IP do backend fica em `.env` e pode ser alterado na tela de configurações sem recompilar (salvar em AsyncStorage)
- Notificações push para alertas críticos usando `expo-notifications` — pedir permissão na primeira abertura
