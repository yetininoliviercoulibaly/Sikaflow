export const WEBHOOK_MESSAGES = {
  PROCESSING_AUDIO: "🎤 Traitement de l'audio en cours...",
  AUDIO_UNINTELLIGIBLE: "⚠️ Audio incompréhensible. Merci de répéter.",
  PROCESSING_ERROR: "❌ Une erreur s'est produite lors du traitement.",
  // Add other messages as needed
};

export const DATE_KEYWORDS = {
  RELATIVE: ["aujourd'hui", "demain", "après-demain", "ce soir", "ce jour"],
  PREFIXES: ["le ", "la date est ", "c'est le ", "pour le "],
  MONTHS: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  OFFSETS: {
    "aujourd'hui": 0,
    "ce jour": 0,
    "ce soir": 0,
    "demain": 1,
    "après-demain": 2
  } as Record<string, number>
};

export const PERIOD_KEYWORDS: [string[], string][] = [
  [["aujourd'hui", "ce jour"], 'today'],
  [["hier"], 'yesterday'],
  [["cette semaine"], 'this_week'],
  [["mois dernier"], 'last_month'],
  [["ce mois"], 'this_month'],
  [["cette année"], 'this_year'],
  [["ce semestre"], 'this_semester'],
  [["semestre dernier"], 'last_semester'],
  [["ce trimestre"], 'this_quarter'],
  [["trimestre dernier"], 'last_quarter'],
];

export const METRIC_KEYWORDS: [string[], string][] = [
  [["bénéfice", "profit", "bénéfices"], 'NET_PROFIT'],
  [["chiffre d'affaire", "revenus", "recettes", "ventes"], 'REVENUE'],
  [["dépenses", "charges", "frais", "coûts"], 'EXPENSES'],
  [["pourboire", "tips"], 'TIPS'],
  [["trésorerie", "cash flow", "flux de trésorerie"], 'CASH_FLOW'],
];

export const NAME_PREFIXES = [
  "le nom est ",
  "le nom de l'organisation est ",
  "le nom de l'événement est ",
  "l'événement s'appelle ",
  "l'organisation s'appelle ",
  "c'est ",
  "il s'appelle ",
  "c'est l'",
  "le nom c'est "
];

export const STOP_KEYWORDS = [
    'STOP', 'ANNULER', 'CANCEL', 'EXIT', 'NON', 'RIEN',
    "J'AI CHANGÉ D'AVIS", "JE CHANGE D'AVIS", "LAISSE TOMBER", "ABANDONNER"
];
export const HELP_KEYWORDS = ['AIDE', 'HELP', 'MENU'];
