import Papa from 'papaparse';

// AQI Data Interfaces
export interface AirQualityRecord {
  timestamp: string;
  date: Date;
  stations: {
    [stationName: string]: {
      NO2: number;
      SO2: number;
      CO: number;
      O3: number;
      PM25: number;
      PM10: number;
    };
  };
}

export interface DailySummary {
  date: string;
  stations: StationSummary[];
  cityAverageAQI: number;
  cityMaxAQI: number;
  mainPollutant: string;
  healthAdvice: {
    general: string;
    sensitive: string;
  };
  colorCode: string;
  aqiLabel: string;
}

export interface StationSummary {
  name: string;
  maxNO2: number;
  maxSO2: number;
  maxCO: number;
  maxO3: number;
  maxPM25: number;
  maxPM10: number;
  mainPollutant: string;
  aqi: number;
}

// AQI Breakpoints (Approximated US EPA)
const BREAKPOINTS = {
  NO2: [ // ppb
    { max: 53, aqiMax: 50 },
    { max: 100, aqiMax: 100 },
    { max: 360, aqiMax: 150 },
    { max: 649, aqiMax: 200 },
    { max: 1249, aqiMax: 300 },
    { max: 2049, aqiMax: 500 },
  ],
  SO2: [ // ppb
    { max: 75, aqiMax: 50 },
    { max: 185, aqiMax: 100 },
    { max: 304, aqiMax: 150 },
    { max: 604, aqiMax: 200 },
    { max: 804, aqiMax: 300 },
    { max: 1004, aqiMax: 500 },
  ],
  CO: [ // ppm
    { max: 4.4, aqiMax: 50 },
    { max: 9.4, aqiMax: 100 },
    { max: 12.4, aqiMax: 150 },
    { max: 15.4, aqiMax: 200 },
    { max: 30.4, aqiMax: 300 },
    { max: 50.4, aqiMax: 500 },
  ],
  O3: [ // ppb (8-hour)
    { max: 54, aqiMax: 50 },
    { max: 70, aqiMax: 100 },
    { max: 85, aqiMax: 150 },
    { max: 105, aqiMax: 200 },
    { max: 200, aqiMax: 300 },
    { max: 400, aqiMax: 500 },
  ],
  PM25: [ // µg/m3 (24-hour)
    { max: 12.0, aqiMax: 50 },
    { max: 35.4, aqiMax: 100 },
    { max: 55.4, aqiMax: 150 },
    { max: 150.4, aqiMax: 200 },
    { max: 250.4, aqiMax: 300 },
    { max: 500.4, aqiMax: 500 },
  ],
  PM10: [ // µg/m3 (24-hour)
    { max: 54, aqiMax: 50 },
    { max: 154, aqiMax: 100 },
    { max: 254, aqiMax: 150 },
    { max: 354, aqiMax: 200 },
    { max: 424, aqiMax: 300 },
    { max: 604, aqiMax: 500 },
  ]
};

export function calculateSubIndex(conc: number, pollutant: keyof typeof BREAKPOINTS): number {
  if (conc < 0) conc = 0;
  
  // CO Unit handling:
  // If we receive a CO value > 50, it is extremely likely to be in ppb or µg/m³, not ppm.
  // Standard EPA breakpoints for CO are in ppm (range 0-50).
  // 1 ppm = 1000 ppb. 
  // If value > 50, we assume it's ppb and divide by 1000 to get ppm.
  if (pollutant === 'CO' && conc > 50) {
      conc = conc / 1000;
  }
  
  const breakpoints = BREAKPOINTS[pollutant];
  let i = 0;
  let bpLow = 0;
  let aqiLow = 0;
  
  while (i < breakpoints.length) {
    const bp = breakpoints[i];
    if (conc <= bp.max) {
      const aqiRange = bp.aqiMax - aqiLow;
      const concRange = bp.max - bpLow;
      return Math.round(((aqiRange * (conc - bpLow)) / concRange) + aqiLow);
    }
    bpLow = bp.max + 0.001;
    aqiLow = bp.aqiMax + 1;
    i++;
  }
  return 500;
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return "Bonne";
  if (aqi <= 100) return "Modérée";
  if (aqi <= 150) return "Médiocre"; // "Peu Saine pour les Groupes Sensibles" shortened for UI
  if (aqi <= 200) return "Mauvaise"; // "Peu Saine"
  if (aqi <= 300) return "Très Mauvaise"; // "Très Peu Saine"
  return "Dangereuse";
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "#2ecc71"; // Green
  if (aqi <= 100) return "#f1c40f"; // Yellow
  if (aqi <= 150) return "#e67e22"; // Orange
  if (aqi <= 200) return "#e74c3c"; // Red
  if (aqi <= 300) return "#9b59b6"; // Purple
  return "#795548"; // Maroon
}

export function getHealthAdvice(aqi: number) {
  if (aqi <= 50) {
    return {
      general: "La qualité de l'air est satisfaisante.",
      sensitive: "Aucune mesure particulière."
    };
  }
  if (aqi <= 100) {
    return {
      general: "Qualité acceptable.",
      sensitive: "Réduire les efforts prolongés en cas de symptômes."
    };
  }
  if (aqi <= 150) {
    return {
      general: "Peu de risques pour le grand public.",
      sensitive: "Réduire les activités intenses en plein air."
    };
  }
  if (aqi <= 200) {
    return {
      general: "Réduisez l'intensité des efforts. Le système respiratoire est sollicité.",
      sensitive: "Conduite Modérée : Mettez en pause les activités physiques intensives extérieures."
    };
  }
  if (aqi <= 300) {
    return {
      general: "Évitez tout effort physique en extérieur.",
      sensitive: "Restez à l'intérieur et limitez l'activité physique."
    };
  }
  return {
    general: "Alerte Rouge : Suspension de tout effort physique en extérieur.",
    sensitive: "Confinement Sanitaire : Isolement intérieur strict exigé."
  };
}

// Function to determine the critical station (station with highest AQI)
export function getCriticalStation(stations: StationSummary[]): StationSummary | null {
  if (!stations.length) return null;
  return stations.reduce((prev, current) => (prev.aqi > current.aqi) ? prev : current);
}

export const parseCSV = (file: File): Promise<DailySummary | null> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[];
          
          if (!data || data.length === 0) {
            resolve(null);
            return;
          }

          const stationsMap = new Map<string, {
            no2: number[]; so2: number[]; co: number[];
            o3: number[]; pm25: number[]; pm10: number[];
          }>();

          const headers = Object.keys(data[0]);
          const stationRegex = /\((.*?)\)/;

          data.forEach(row => {
            // Check for date property case-insensitively
            const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'date');
            if (!dateKey || !row[dateKey]) return;

            headers.forEach(header => {
              const match = header.match(stationRegex);
              if (match) {
                const stationName = match[1];
                let value = row[header];
                
                if (typeof value === 'string') value = parseFloat(value);
                if (isNaN(value)) return;
                if (value < 0) value = 0;

                if (!stationsMap.has(stationName)) {
                  stationsMap.set(stationName, { 
                    no2: [], so2: [], co: [], o3: [], pm25: [], pm10: [] 
                  });
                }
                
                const stationData = stationsMap.get(stationName)!;

                if (header.includes("NO2")) stationData.no2.push(value);
                else if (header.includes("SO2")) stationData.so2.push(value);
                else if (header.includes("CO")) stationData.co.push(value);
                else if (header.includes("O3")) stationData.o3.push(value);
                else if (header.includes("PM2.5")) stationData.pm25.push(value);
                else if (header.includes("PM10")) stationData.pm10.push(value);
              }
            });
          });

          const stationSummaries = Array.from(stationsMap.entries()).map(([name, values]) => {
            const maxNO2 = values.no2.length ? Math.max(...values.no2) : 0;
            const maxSO2 = values.so2.length ? Math.max(...values.so2) : 0;
            const maxCO = values.co.length ? Math.max(...values.co) : 0;
            const maxO3 = values.o3.length ? Math.max(...values.o3) : 0;
            const maxPM25 = values.pm25.length ? Math.max(...values.pm25) : 0;
            const maxPM10 = values.pm10.length ? Math.max(...values.pm10) : 0;

            const aqiNO2 = calculateSubIndex(maxNO2, 'NO2');
            const aqiSO2 = calculateSubIndex(maxSO2, 'SO2');
            const aqiCO = calculateSubIndex(maxCO, 'CO');
            const aqiO3 = calculateSubIndex(maxO3, 'O3');
            const aqiPM25 = calculateSubIndex(maxPM25, 'PM25');
            const aqiPM10 = calculateSubIndex(maxPM10, 'PM10');

            const aqi = Math.max(aqiNO2, aqiSO2, aqiCO, aqiO3, aqiPM25, aqiPM10);
            
            let mainPollutant = 'NO2';
            let maxIndex = aqiNO2;
            
            if (aqiSO2 > maxIndex) { maxIndex = aqiSO2; mainPollutant = 'SO2'; }
            if (aqiCO > maxIndex) { maxIndex = aqiCO; mainPollutant = 'CO'; }
            if (aqiO3 > maxIndex) { maxIndex = aqiO3; mainPollutant = 'O3'; }
            if (aqiPM25 > maxIndex) { maxIndex = aqiPM25; mainPollutant = 'PM2.5'; }
            if (aqiPM10 > maxIndex) { maxIndex = aqiPM10; mainPollutant = 'PM10'; }

            return {
              name,
              maxNO2, maxSO2, maxCO, maxO3, maxPM25, maxPM10,
              mainPollutant,
              aqi
            };
          });

          const cityAvgAQI = Math.round(
            stationSummaries.reduce((acc, s) => acc + s.aqi, 0) / (stationSummaries.length || 1)
          );

          const cityMaxAQI = Math.max(...stationSummaries.map(s => s.aqi));
          
          // Try to get date from first row
          const dateKey = Object.keys(data[0]).find(k => k.toLowerCase() === 'date');
          const dateStr = (dateKey && data[0][dateKey]) ? String(data[0][dateKey]).split(' ')[0] : new Date().toLocaleDateString();

          resolve({
            date: dateStr,
            stations: stationSummaries,
            cityAverageAQI: cityAvgAQI,
            cityMaxAQI,
            mainPollutant: stationSummaries.find(s => s.aqi === cityMaxAQI)?.mainPollutant || 'Inconnu',
            healthAdvice: getHealthAdvice(cityMaxAQI), // Placeholder, will be enriched in component
            colorCode: getAQIColor(cityMaxAQI), // Placeholder
            aqiLabel: getAQILabel(cityMaxAQI) // Placeholder
          });

        } catch (err) {
          console.error("Error processing data", err);
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};
