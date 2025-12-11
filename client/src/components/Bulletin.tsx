import { useRef } from 'react';
import { DailySummary, getCriticalStation, StationSummary } from '@/lib/aqi';
import logoMaliMeteo from '@assets/Logo_Mali_Meteo_1765449131851.png';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface BulletinProps {
  data: DailySummary;
  onExportStart?: () => void;
  onExportEnd?: () => void;
}

export function Bulletin({ data, onExportStart, onExportEnd }: BulletinProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Logic to find critical station info
  const criticalStation = getCriticalStation(data.stations);
  let criticalConcentration = 0;
  if (criticalStation) {
      // Get the concentration of the main pollutant for this station
      // @ts-ignore - dynamic access
      criticalConcentration = criticalStation[`max${data.mainPollutant.replace('.', '')}`] || 0;
  }

  const handleExport = () => {
    if (!contentRef.current) return;
    
    if (onExportStart) onExportStart();

    const element = contentRef.current;
    
    const opt = {
      margin: 3,
      filename: `bulletin_qualite_air_${data.date.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        // Force background to white to avoid transparency issues
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        if (onExportEnd) onExportEnd();
    });
  };

  // Replicating the EXACT original design structure and styles using Tailwind to match the provided HTML/CSS
  return (
    <div className="w-full flex flex-col items-center gap-6 font-['Poppins']">
      <div id="export-button-container" className="text-center w-full max-w-[1100px]">
        <Button 
          onClick={handleExport}
          className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-semibold py-3 px-6 rounded-lg text-lg cursor-pointer"
        >
          <FileDown className="mr-2 h-5 w-5" /> Télécharger le Bulletin (PDF)
        </Button>
      </div>

      <div className="w-full max-w-[1100px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* PDF Content Area */}
        <div id="pdf-content" ref={contentRef} className="w-full bg-white">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#007BFF] to-[#00BFFF] text-white p-[20px_30px] flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-[60px] h-[60px] rounded-full mr-[15px] bg-white flex items-center justify-center overflow-hidden p-1">
                <img src={logoMaliMeteo} alt="Mali Météo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="m-0 text-[24px] font-bold">MALI MÉTÉO</h2>
                <p className="m-[5px_0_0_0] text-[14px] opacity-90">BULLETIN QUALITÉ DE L'AIR DE BAMAKO</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end text-right">
              <div className="mb-[5px] flex flex-col items-end">
                <p className="font-normal text-[12px] m-[0_0_5px_0] opacity-80 leading-none uppercase">DATE DU RELEVÉ</p>
                <strong className="font-bold text-[32px] leading-none text-white m-0 tracking-[1px]">{data.date}</strong>
              </div>
              <div className="text-[12px] font-bold flex items-center text-white bg-[#17A2B8] p-[4px_10px] rounded-[6px] shadow-[0_2px_4px_rgba(0,0,0,0.2)] uppercase mt-[5px] leading-[1.2]">
                <i className="fas fa-chart-line mr-1"></i> Validité: 24h
              </div>
            </div>
          </div>

          {/* Alert Bar */}
          <div 
            className="text-white text-center py-[15px] font-bold text-[18px]"
            style={{ backgroundColor: data.colorCode }}
          >
            <i className="fas fa-exclamation-triangle mr-2"></i> 
            ALERTE : Qualité de l'Air {data.aqiLabel.toUpperCase()} (AQI: {data.cityMaxAQI})
          </div>

          <div className="flex p-[20px] gap-[25px]">
            {/* Left Section */}
            <div className="flex-[2]">
              {/* Global AQI */}
              <div className="text-center p-[15px] rounded-[12px] mb-[20px] bg-[#ecf0f1]">
                <p className="text-[14px] mb-[5px] text-[#7f8c8d]">Indice de Qualité de l'Air (AQI)</p>
                <p className="text-[12px] mb-[10px] text-[#7f8c8d]">Valeur maximale mesurée</p>
                
                <div 
                  className="text-[60px] font-bold m-[5px_0] leading-none"
                  style={{ color: data.colorCode }}
                >
                  {data.cityMaxAQI}
                </div>
                <div 
                  className="text-[20px] font-semibold mb-[10px]"
                  style={{ color: data.colorCode }}
                >
                  {data.aqiLabel.toUpperCase()}
                </div>

                <div className="mt-[10px] text-left">
                   <p className="flex items-center m-[6px_0] text-[13px] text-[#2c3e50]">
                     <span className="h-[10px] w-[10px] rounded-full inline-block mr-[8px]" style={{ backgroundColor: data.colorCode }}></span>
                     <strong className="mr-1">Polluant Critique :</strong> {data.mainPollutant}
                   </p>
                   <p className="flex items-center m-[6px_0] text-[13px] text-[#2c3e50]">
                     <i className="fas fa-map-marker-alt mr-[8px]"></i> 
                     <strong className="mr-1">Station :</strong> {criticalStation?.name || 'Inconnue'}
                   </p>
                   <p className="flex items-center m-[6px_0] text-[13px] text-[#2c3e50]">
                     <i className="fas fa-chart-line mr-[8px]"></i> 
                     <strong className="mr-1">Concentration Maximale :</strong> {criticalConcentration} {['CO'].includes(data.mainPollutant) ? 'ppm' : (['NO2', 'SO2', 'O3'].includes(data.mainPollutant) ? 'ppb' : 'µg/m³')}
                   </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="flex gap-[20px] mt-[20px] flex-col">
                <div className="flex-1 p-[20px] border border-[#e6e9ed] rounded-[10px] bg-white">
                    <div className="font-bold mb-[15px] text-[18px] flex items-center text-[#007BFF]">
                        <i className="fas fa-notes-medical mr-2"></i> Recommandations Santé
                    </div>
                    <div className="text-[#2c3e50] text-[14px]">
                        <p className="mb-2"><strong>Général :</strong> {data.healthAdvice.general}</p>
                        <p><strong>Sensibles :</strong> {data.healthAdvice.sensitive}</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 border-l border-[#e6e9ed] pl-[25px]">
               <div className="font-bold mb-[15px] text-[18px] flex items-center text-[#007BFF]">
                   <i className="fas fa-wind mr-2"></i> Polluants Surveillés
               </div>
               
               <div className="grid grid-cols-2 gap-[15px] mt-[20px]">
                 <PollutantCard 
                    symbol="PM2.5" 
                    name="Particules fines" 
                    isCritical={data.mainPollutant === 'PM2.5'} 
                    criticalColor={data.colorCode} 
                    icon="fa-smog" 
                 />
                 <PollutantCard symbol="PM10" name="Particules inhalables" icon="fa-cloud" isCritical={data.mainPollutant === 'PM10'} criticalColor={data.colorCode} />
                 <PollutantCard symbol="O3" name="Ozone" icon="fa-sun" isCritical={data.mainPollutant === 'O3'} criticalColor={data.colorCode} />
                 <PollutantCard symbol="NO2" name="Dioxyde d'azote" icon="fa-industry" isCritical={data.mainPollutant === 'NO2'} criticalColor={data.colorCode} />
                 <PollutantCard symbol="SO2" name="Dioxyde de soufre" icon="fa-burn" isCritical={data.mainPollutant === 'SO2'} criticalColor={data.colorCode} />
                 <PollutantCard symbol="CO" name="Monoxyde de carbone" icon="fa-head-side-cough" isCritical={data.mainPollutant === 'CO'} criticalColor={data.colorCode} />
               </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-[20px_25px] border-t border-[#e6e9ed] bg-[#ecf0f1]">
            <div className="font-bold mb-[10px] text-[16px] text-[#2c3e50]">
              <i className="fas fa-chart-bar mr-2"></i> Échelle de Qualité de l'Air (AQI)
            </div>
            <div className="flex justify-between rounded-[8px] overflow-hidden">
              <LegendItem color="#2ecc71" label="Bonne (0-50)" darkText={false} />
              <LegendItem color="#f1c40f" label="Modérée (51-100)" darkText={true} />
              <LegendItem color="#e67e22" label="Peu Saine GS (101-150)" darkText={false} />
              <LegendItem color="#e74c3c" label="Peu Saine (151-200)" darkText={false} />
              <LegendItem color="#9b59b6" label="Très Peu Saine (201-300)" darkText={false} />
              <LegendItem color="#795548" label="Dangereuse (301-500)" darkText={false} />
            </div>
          </div>

          {/* Footer Explanation */}
          <div className="p-[15px_30px] bg-white border-t border-[#e6e9ed]">
             <h4 className="font-bold text-[18px] mb-[10px] text-[#007BFF] flex items-center">
               <i className="fas fa-book-reader mr-2"></i> Comprendre Notre Bulletin
             </h4>
             <div className="flex gap-[15px] mt-[10px]">
               <ExplanationItem title="AQI (Score central)" icon="fa-sort-numeric-up">
                 Indique la gravité de la pollution maximale mesurée. Plus le chiffre est élevé (jusqu'à 500), plus l'air est potentiellement nocif pour la santé.
               </ExplanationItem>
               <ExplanationItem title="Polluant Critique" icon="fa-filter">
                 C'est la substance (particules fines, ozone, etc.) dont la concentration est la plus élevée et qui donne le score AQI de la journée.
               </ExplanationItem>
               <ExplanationItem title="Recommandations" icon="fa-hand-point-right">
                 Suivez-les strictement pour minimiser votre exposition et protéger les groupes sensibles (enfants, personnes âgées, etc.).
               </ExplanationItem>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function PollutantCard({ symbol, name, isCritical, criticalColor, icon }: { symbol: string, name: string, isCritical?: boolean, criticalColor?: string, icon: string }) {
  return (
    <div 
      className={`border rounded-[10px] p-[15px_10px] text-center bg-white ${isCritical ? 'bg-[#fffafa]' : ''}`}
      style={isCritical ? { border: `3px solid ${criticalColor}` } : { border: '1px solid #e6e9ed' }}
    >
      <i className={`fas ${icon} text-[20px] mb-2 text-[#2c3e50]`}></i>
      <h4 className="font-bold text-[16px] m-0 text-[#2c3e50]">{symbol}</h4>
      <p className="text-[12px] m-0 text-[#7f8c8d]">{name}</p>
    </div>
  );
}

function LegendItem({ color, label, darkText }: { color: string, label: string, darkText: boolean }) {
    return (
        <div 
            className="flex-1 text-center p-[10px_5px] text-[11px] font-semibold"
            style={{ backgroundColor: color, color: darkText ? 'black' : 'white' }}
        >
            {label}
        </div>
    )
}

function ExplanationItem({ title, children, icon }: { title: string, children: React.ReactNode, icon: string }) {
  return (
    <div className="flex-1 p-[12px_15px] rounded-[8px] bg-[#f4f7f9] border border-[#e6e9ed] min-w-0">
      <h5 className="font-bold text-[14px] mb-[5px] flex items-center text-[#2c3e50]">
        <i className={`fas ${icon} text-[#17A2B8] mr-[6px] text-[16px]`}></i> {title}
      </h5>
      <p className="text-[12px] leading-[1.4] text-[#7f8c8d] m-0">
        {children}
      </p>
    </div>
  );
}
