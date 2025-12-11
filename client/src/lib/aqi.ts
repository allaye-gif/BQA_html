export interface AQIData {
  aqi: number;
  category: string;
  colorClass: string;
  colorCode: string; // hex
  recommendation: string;
  criticalPollutant: string;
  concentration: number;
  station: string;
  date: string;
}

export const AQI_CATEGORIES = [
  { min: 0, max: 50, name: "Bonne", colorClass: "aqi-good", colorCode: "#2ecc71", shortName: "Bonne", recommendation: "Excellente, aucun risque pour la santé. Profitez de l'air frais." },
  { min: 51, max: 100, name: "Modérée", colorClass: "aqi-moderate", colorCode: "#f1c40f", shortName: "Modérée", recommendation: "Peu de risques, mais les personnes sensibles devraient limiter les efforts prolongés en extérieur." },
  { min: 101, max: 150, name: "Peu Saine pour les Groupes Sensibles", colorClass: "aqi-unhealthy-sensitive", colorCode: "#e67e22", shortName: "Peu Saine GS", recommendation: "Les groupes sensibles (enfants, personnes âgées, malades respiratoires) devraient éviter les activités intenses en extérieur." },
  { min: 151, max: 200, name: "Peu Saine", colorClass: "aqi-unhealthy", colorCode: "#e74c3c", shortName: "Peu Saine", recommendation: "Tout le monde peut commencer à ressentir des effets sur la santé. Les groupes sensibles sont fortement affectés. Limitez les sorties." },
  { min: 201, max: 300, name: "Très Peu Saine", colorClass: "aqi-very-unhealthy", colorCode: "#9b59b6", shortName: "Très Peu Saine", recommendation: "Alerte sanitaire, risque élevé de maladie pour tous. Éviter tout effort en extérieur et rester à l'intérieur." },
  { min: 301, max: 500, name: "Dangereuse", colorClass: "aqi-hazardous", colorCode: "#795548", shortName: "Dangereuse", recommendation: "Urgence sanitaire: Évitez tout effort physique et restez à l'intérieur. Masques FFP2 fortement recommandés si vous devez sortir." },
];

// US EPA PM2.5 Breakpoints (24-hour)
// C_low, C_high, I_low, I_high
const PM25_BREAKPOINTS = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.0, 301, 400],
  [500.1, 99999.9, 401, 500]
];

export const STATION_NAMES_MAP: Record<string, string> = {
  'ML_BKO_Qualité_Air_1': 'BKO_Qualité_Air_1',
  'ML_QA_LASSA': 'Lassa',
  'ML_QA_SOTUBA': 'Sotuba',
  'ML_QA_BAMAKO-UNIVERSITE': 'Hamdallaye ACI'
};

/**
 * Optimized AQI calculation.
 * Handles exact range matching and interpolation.
 */
export function calculatePM25AQI(concentration: number): number {
  // Truncate to 1 decimal place to match EPA standard lookup tables
  const c = Math.floor(concentration * 10) / 10;

  for (const bp of PM25_BREAKPOINTS) {
    const [C_low, C_high, I_low, I_high] = bp;
    if (c >= C_low && c <= C_high) {
      const aqi = ((I_high - I_low) / (C_high - C_low)) * (c - C_low) + I_low;
      return Math.round(aqi);
    }
  }
  // Fallback for extreme values
  return 500;
}

export function getAQICategory(aqi: number) {
  for (const cat of AQI_CATEGORIES) {
    if (aqi >= cat.min && aqi <= cat.max) {
      return cat;
    }
  }
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleanDateStr = dateStr.trim();
  const datePart = cleanDateStr.split(' ')[0];
  const normalizedDatePart = datePart.replace(/[\/\-\.]/g, '/');
  const dateParts = normalizedDatePart.split('/');
  
  if (dateParts.length !== 3) return null;

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const d = String(day).padStart(2, '0');
  const m = String(month + 1).padStart(2, '0');
  const y = String(year);

  return `${d}/${m}/${y}`;
}
