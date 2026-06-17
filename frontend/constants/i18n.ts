import { getLocales } from 'expo-localization';

export type Language = 'en' | 'pt-BR';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (BR)' },
];

const en = {
  'app.title': 'Smart Plant',

  'state.happy': "I'm doing great! 🌱",
  'state.thirsty': "I'm thirsty... 💧",
  'state.hot': "It's too hot! 🥵",
  'state.noLight': 'I need more light ☀️',
  'state.sick': "I'm not feeling well 😟",
  'state.sleeping': 'Zzz... 😴',

  'sensor.temperature': 'Temperature',
  'sensor.airHumidity': 'Air Humidity',
  'sensor.soilMoisture': 'Soil Moisture',
  'sensor.light': 'Light',
  'sensor.airQuality': 'Air Quality',
  'sensor.rain': 'Rain',

  'common.yes': 'Yes',
  'common.no': 'No',

  'home.lastWatering': 'Last watering',
  'home.noWatering': 'No watering recorded yet',
  'home.logWatering': 'Log watering now',
  'home.recentAlerts': 'Recent alerts',
  'home.noAlerts': 'No recent alerts',

  'watering.manual_btn': 'button',
  'watering.app': 'app',

  'history.title': 'History',
  'history.noData': 'No data available',
  'chart.now': 'Now',
  'chart.min': 'Min',
  'chart.max': 'Max',

  'settings.title': 'Settings',
  'settings.notifications': 'Critical alert notifications',
  'settings.language': 'Language',
};

export type TranslationKey = keyof typeof en;

const ptBR: Record<TranslationKey, string> = {
  'app.title': 'Smart Plant',

  'state.happy': 'Estou ótima! 🌱',
  'state.thirsty': 'Estou com sede... 💧',
  'state.hot': 'Está quente demais! 🥵',
  'state.noLight': 'Preciso de mais luz ☀️',
  'state.sick': 'Não estou bem 😟',
  'state.sleeping': 'Zzz... 😴',

  'sensor.temperature': 'Temperatura',
  'sensor.airHumidity': 'Umidade do ar',
  'sensor.soilMoisture': 'Umidade do solo',
  'sensor.light': 'Luz',
  'sensor.airQuality': 'Qualidade do ar',
  'sensor.rain': 'Chuva',

  'common.yes': 'Sim',
  'common.no': 'Não',

  'home.lastWatering': 'Última rega',
  'home.noWatering': 'Nenhuma rega registrada ainda',
  'home.logWatering': 'Registrar rega agora',
  'home.recentAlerts': 'Alertas recentes',
  'home.noAlerts': 'Nenhum alerta recente',

  'watering.manual_btn': 'botão',
  'watering.app': 'app',

  'history.title': 'Histórico',
  'history.noData': 'Sem dados disponíveis',
  'chart.now': 'Agora',
  'chart.min': 'Mín',
  'chart.max': 'Máx',

  'settings.title': 'Configurações',
  'settings.notifications': 'Notificações de alertas críticos',
  'settings.language': 'Idioma',
};

export const translations: Record<Language, Record<TranslationKey, string>> = { en, 'pt-BR': ptBR };

export function defaultLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'pt' ? 'pt-BR' : 'en';
}

export function translate(language: Language, key: TranslationKey): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}

// ── Relative-time formatting (Intl.RelativeTimeFormat is missing in Hermes) ───

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

const TIME_DIVISIONS: { amount: number; unit: TimeUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Infinity, unit: 'years' },
];

// [singular, plural] per unit.
const TIME_WORDS: Record<Language, Record<TimeUnit, [string, string]>> = {
  en: {
    seconds: ['second', 'seconds'],
    minutes: ['minute', 'minutes'],
    hours: ['hour', 'hours'],
    days: ['day', 'days'],
    weeks: ['week', 'weeks'],
    months: ['month', 'months'],
    years: ['year', 'years'],
  },
  'pt-BR': {
    seconds: ['segundo', 'segundos'],
    minutes: ['minuto', 'minutos'],
    hours: ['hora', 'horas'],
    days: ['dia', 'dias'],
    weeks: ['semana', 'semanas'],
    months: ['mês', 'meses'],
    years: ['ano', 'anos'],
  },
};

function formatRelativeUnit(value: number, unit: TimeUnit, language: Language): string {
  const abs = Math.abs(value);
  const [singular, plural] = TIME_WORDS[language][unit];
  const word = abs === 1 ? singular : plural;
  if (language === 'pt-BR') {
    return value > 0 ? `em ${abs} ${word}` : `há ${abs} ${word}`;
  }
  return value > 0 ? `in ${abs} ${word}` : `${abs} ${word} ago`;
}

export function formatRelativeTime(at: number, now: number = Date.now(), language: Language = 'en'): string {
  let duration = (at - now) / 1000;
  for (const { amount, unit } of TIME_DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return formatRelativeUnit(Math.round(duration), unit, language);
    }
    duration /= amount;
  }
  return formatRelativeUnit(Math.round(duration), 'years', language);
}
