import { useRef } from 'react';
import { DailySummary, StationSummary, getAQIColor, getCriticalStation } from '@/lib/aqi';
import logoMaliMeteo from '@assets/Logo_Mali_Meteo_1765449131851.png';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { FileDown, Wind, MapPin, Activity, HeartPulse, AlertTriangle, Info } from 'lucide-react';

interface BulletinProps {
  data: DailySummary;
  onExportStart?: () => void;
  onExportEnd?: () => void;
}

export function Bulletin({ data, onExportStart, onExportEnd }: BulletinProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const criticalStation = getCriticalStation(data.stations);

  const handleExport = () => {
    if (!contentRef.current) return;
    
    if (onExportStart) onExportStart();

    const element = contentRef.current;
    
    // Configure PDF options specifically to avoid layout shifts or cutting off content
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number], // Small consistent margins
      filename: `bulletin_qualite_air_${data.date.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, // High resolution
        useCORS: true, // Allow loading images
        scrollY: 0,
        windowWidth: 800 // Fix width to ensure layout consistency
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        if (onExportEnd) onExportEnd();
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 font-sans">
      <Button 
        onClick={handleExport}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
      >
        <FileDown className="w-5 h-5" />
        Télécharger le Bulletin Officiel
      </Button>

      <div className="w-full max-w-[800px] bg-white rounded-none shadow-2xl overflow-hidden print:shadow-none">
        {/* PDF Content Area - Fixed width for consistent PDF generation */}
        <div id="pdf-content" ref={contentRef} className="w-full bg-white text-slate-800 pb-8">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-white p-1.5 rounded-full shadow-md">
                  <img src={logoMaliMeteo} alt="Mali Météo" className="w-[72px] h-[72px] object-contain rounded-full" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-1">MALI MÉTÉO</h1>
                  <p className="text-blue-100 text-sm font-medium tracking-wider uppercase opacity-90 border-l-2 border-blue-400 pl-2">
                    Surveillance de la Qualité de l'Air
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">Bulletin du</p>
                <div className="text-4xl font-bold font-mono tracking-tighter leading-none">{data.date}</div>
                <div className="mt-2 inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-white/20 shadow-sm">
                  <Activity className="w-3 h-3 mr-1.5" />
                  Validité: 24 Heures
                </div>
              </div>
            </div>
          </div>

          {/* Main Status Bar */}
          <div 
            className="w-full py-4 px-6 text-white text-center font-bold text-xl uppercase tracking-widest shadow-md flex items-center justify-center gap-3"
            style={{ backgroundColor: data.colorCode }}
          >
            <AlertTriangle className="w-6 h-6" />
            <span>Niveau : {data.aqiLabel} (AQI {data.cityMaxAQI})</span>
          </div>

          <div className="p-8">
            {/* Top Grid: Main Metrics & Advice */}
            <div className="grid grid-cols-12 gap-8 mb-8">
              
              {/* Left Column: AQI Circle & Critical Info */}
              <div className="col-span-7 flex flex-col gap-6">
                
                {/* AQI Big Display */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none transform translate-x-10 -translate-y-10"></div>
                  
                  <div className="relative z-10">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Indice AQI Max</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-bold tracking-tighter text-slate-800" style={{ color: data.colorCode }}>
                        {data.cityMaxAQI}
                      </span>
                      <span className="text-lg font-medium text-slate-400">/ 500</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Polluant majeur: <span className="font-bold text-slate-700">{data.mainPollutant}</span>
                    </p>
                  </div>

                  <div className="h-24 w-24 rounded-full border-[6px] flex items-center justify-center shadow-inner bg-white" style={{ borderColor: data.colorCode }}>
                    <Wind className="w-10 h-10 text-slate-400" />
                  </div>
                </div>

                {/* Critical Station Info */}
                {criticalStation && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Zone la plus touchée
                    </h3>
                    <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-3">
                      <span className="text-lg font-bold text-slate-700">{criticalStation.name}</span>
                      <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        AQI {criticalStation.aqi}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Polluant Principal</p>
                        <p className="font-semibold text-slate-700">{criticalStation.mainPollutant}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Concentration</p>
                        <p className="font-semibold text-slate-700">
                          {getConcentration(criticalStation, criticalStation.mainPollutant)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Health Advice */}
              <div className="col-span-5 bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4 text-blue-700">
                  <HeartPulse className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Impact Santé</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Population Générale</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {data.healthAdvice.general}
                    </p>
                  </div>
                  <div className="w-full h-px bg-blue-200/50"></div>
                  <div>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">Personnes Sensibles</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {data.healthAdvice.sensitive}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pollutants Grid */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Détail des Polluants (Moyennes)
              </h3>
              <div className="grid grid-cols-6 gap-3">
                <PollutantBox name="PM2.5" val={getCityAverage(data, 'maxPM25')} unit="µg/m³" isMain={data.mainPollutant === 'PM2.5'} />
                <PollutantBox name="PM10" val={getCityAverage(data, 'maxPM10')} unit="µg/m³" isMain={data.mainPollutant === 'PM10'} />
                <PollutantBox name="NO2" val={getCityAverage(data, 'maxNO2')} unit="ppb" isMain={data.mainPollutant === 'NO2'} />
                <PollutantBox name="SO2" val={getCityAverage(data, 'maxSO2')} unit="ppb" isMain={data.mainPollutant === 'SO2'} />
                <PollutantBox name="O3" val={getCityAverage(data, 'maxO3')} unit="ppb" isMain={data.mainPollutant === 'O3'} />
                <PollutantBox name="CO" val={getCityAverage(data, 'maxCO')} unit="ppm" isMain={data.mainPollutant === 'CO'} />
              </div>
            </div>

            {/* AQI Scale Legend */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                 <Info className="w-4 h-4 text-slate-400" />
                 <h4 className="text-xs font-bold text-slate-500 uppercase">Légende AQI</h4>
              </div>
              <div className="flex w-full h-3 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#2ecc71] flex-1"></div>
                <div className="h-full bg-[#f1c40f] flex-1"></div>
                <div className="h-full bg-[#e67e22] flex-1"></div>
                <div className="h-full bg-[#e74c3c] flex-1"></div>
                <div className="h-full bg-[#9b59b6] flex-1"></div>
                <div className="h-full bg-[#795548] flex-1"></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>Bon</span>
                <span>Modéré</span>
                <span>Médiocre</span>
                <span>Mauvais</span>
                <span>Tr. Mauvais</span>
                <span>Dangereux</span>
              </div>
            </div>

          </div>
          
          {/* Footer */}
          <div className="text-center mt-4 border-t border-slate-100 pt-4 px-8">
            <p className="text-[10px] text-slate-400">
              Bulletin généré automatiquement par le système de surveillance Mali Météo. 
              Les données sont provisoires et sujettes à validation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Components & Functions

function PollutantBox({ name, val, unit, isMain }: { name: string, val: number, unit: string, isMain: boolean }) {
  return (
    <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${isMain ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100'}`}>
      <span className={`text-xs font-bold ${isMain ? 'text-blue-600' : 'text-slate-400'} mb-1`}>{name}</span>
      <span className="text-lg font-bold text-slate-700 leading-none mb-1">{val}</span>
      <span className="text-[9px] text-slate-400 font-medium">{unit}</span>
    </div>
  );
}

function getConcentration(station: StationSummary, pollutant: string): string {
  switch (pollutant) {
    case 'PM2.5': return `${station.maxPM25} µg/m³`;
    case 'PM10': return `${station.maxPM10} µg/m³`;
    case 'NO2': return `${station.maxNO2} ppb`;
    case 'SO2': return `${station.maxSO2} ppb`;
    case 'CO': return `${station.maxCO} ppm`;
    case 'O3': return `${station.maxO3} ppb`;
    default: return 'N/A';
  }
}

function getCityAverage(data: DailySummary, key: keyof StationSummary): number {
  if (!data.stations.length) return 0;
  const sum = data.stations.reduce((acc, station) => {
    const val = station[key];
    return acc + (typeof val === 'number' ? val : 0);
  }, 0);
  return Math.round((sum / data.stations.length) * 10) / 10;
}
