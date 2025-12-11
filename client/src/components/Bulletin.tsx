import { useRef } from 'react';
import { AQIData } from '@/lib/aqi';
import logoMaliMeteo from '@assets/Logo_Mali_Meteo_1765449131851.png';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface BulletinProps {
  data: AQIData;
  onExportStart?: () => void;
  onExportEnd?: () => void;
}

export function Bulletin({ data, onExportStart, onExportEnd }: BulletinProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!contentRef.current) return;
    
    if (onExportStart) onExportStart();

    const element = contentRef.current;
    const opt = {
      margin: 3,
      filename: `bulletin_qualite_air_${data.date.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        if (onExportEnd) onExportEnd();
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <Button 
        onClick={handleExport}
        className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
      >
        <FileDown className="w-5 h-5" />
        Télécharger le Bulletin (PDF)
      </Button>

      <div className="w-full max-w-[800px] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* PDF Content Area */}
        <div id="pdf-content" ref={contentRef} className="w-full bg-white">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#007BFF] to-[#00BFFF] text-white p-6 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center mr-4 shadow-sm overflow-hidden p-1">
                <img src={logoMaliMeteo} alt="Mali Météo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="m-0 text-2xl font-bold tracking-tight">MALI MÉTÉO</h2>
                <p className="m-0 text-sm opacity-90 font-light tracking-wide">BULLETIN QUALITÉ DE L'AIR DE BAMAKO</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end text-right">
              <div className="mb-1 flex flex-col items-end">
                <p className="text-xs uppercase opacity-80 mb-1">Date du relevé</p>
                <strong className="text-3xl font-bold leading-none">{data.date}</strong>
              </div>
              <div className="bg-[#17A2B8] text-white text-[11px] font-bold py-1 px-3 rounded shadow-sm uppercase flex items-center mt-1">
                <span className="mr-1">⏱</span> Validité: 24h
              </div>
            </div>
          </div>

          {/* Alert Bar */}
          <div 
            className="text-white text-center py-4 font-bold text-lg uppercase tracking-wide"
            style={{ backgroundColor: data.colorCode }}
          >
            ⚠️ ALERTE : Qualité de l'Air {data.category} (AQI: {data.aqi})
          </div>

          <div className="flex p-6 gap-6 md:flex-row flex-col">
            {/* Left Section */}
            <div className="flex-[2]">
              {/* Global AQI */}
              <div className="text-center p-5 rounded-xl bg-[#ecf0f1] mb-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Indice de Qualité de l'Air (AQI)</p>
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Valeur maximale mesurée</p>
                
                <div 
                  className="text-[64px] font-bold leading-none mb-2"
                  style={{ color: data.colorCode }}
                >
                  {data.aqi}
                </div>
                <div 
                  className="text-xl font-bold mb-4 uppercase"
                  style={{ color: data.colorCode }}
                >
                  {data.category}
                </div>

                <div className="mt-4 text-left bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                   <p className="flex items-center text-sm my-2 text-gray-700">
                     <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: data.colorCode }}></span>
                     <strong className="mr-1">Polluant Critique :</strong> {data.criticalPollutant}
                   </p>
                   <p className="flex items-center text-sm my-2 text-gray-700">
                     <span className="mr-3 text-gray-400">📍</span>
                     <strong className="mr-1">Station :</strong> {data.station}
                   </p>
                   <p className="flex items-center text-sm my-2 text-gray-700">
                     <span className="mr-3 text-gray-400">📊</span>
                     <strong className="mr-1">Concentration Max :</strong> {data.concentration} µg/m³
                   </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border border-gray-200 rounded-xl bg-white p-5 shadow-sm">
                <div className="font-bold text-lg mb-3 flex items-center text-[#007BFF]">
                  <span className="mr-2">⚕️</span> Recommandations Santé
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {data.recommendation}
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 border-l border-gray-100 pl-6 md:border-l md:pl-6 border-l-0 pl-0 pt-6 md:pt-0 border-t md:border-t-0">
               <div className="font-bold text-lg mb-4 flex items-center text-gray-700">
                  <span className="mr-2">💨</span> Polluants Surveillés
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <PollutantCard symbol="PM2.5" name="Particules fines" isCritical={data.criticalPollutant === 'PM2.5'} criticalColor={data.colorCode} icon="🌫️" />
                 <PollutantCard symbol="PM10" name="Particules inhalables" icon="☁️" />
                 <PollutantCard symbol="O3" name="Ozone" icon="☀️" />
                 <PollutantCard symbol="NO2" name="Dioxyde d'azote" icon="🏭" />
                 <PollutantCard symbol="SO2" name="Dioxyde de soufre" icon="🔥" />
                 <PollutantCard symbol="CO" name="Monoxyde de carbone" icon="😷" />
               </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-[#ecf0f1] border-t border-gray-200 p-6">
            <div className="font-bold text-base mb-3 text-gray-700 flex items-center">
              <span className="mr-2">📊</span> Échelle de Qualité de l'Air (AQI)
            </div>
            <div className="flex rounded-lg overflow-hidden text-[10px] font-bold text-white text-center shadow-sm">
              <div className="flex-1 py-2 bg-[#2ecc71]">Bonne<br/>0-50</div>
              <div className="flex-1 py-2 bg-[#f1c40f] text-black">Modérée<br/>51-100</div>
              <div className="flex-1 py-2 bg-[#e67e22]">Peu Saine GS<br/>101-150</div>
              <div className="flex-1 py-2 bg-[#e74c3c]">Peu Saine<br/>151-200</div>
              <div className="flex-1 py-2 bg-[#9b59b6]">Très Peu<br/>201-300</div>
              <div className="flex-1 py-2 bg-[#795548]">Dangereuse<br/>301-500</div>
            </div>
          </div>

          {/* Footer Explanation */}
          <div className="bg-white border-t border-gray-200 p-6">
             <h4 className="font-bold text-lg mb-4 text-[#007BFF] flex items-center">
               <span className="mr-2">📖</span> Comprendre Notre Bulletin
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <ExplanationItem title="AQI (Score central)" icon="🔢">
                 Indique la gravité de la pollution. Plus le chiffre est élevé (max 500), plus l'air est nocif.
               </ExplanationItem>
               <ExplanationItem title="Polluant Critique" icon="🧪">
                 Substance (PM2.5, Ozone...) ayant la concentration la plus élevée aujourd'hui.
               </ExplanationItem>
               <ExplanationItem title="Recommandations" icon="👉">
                 Suivez-les pour protéger votre santé, surtout si vous êtes sensible.
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
      className={`border rounded-lg p-3 text-center bg-white transition-all ${isCritical ? 'shadow-md scale-105' : 'border-gray-200'}`}
      style={isCritical ? { borderColor: criticalColor, borderWidth: '2px' } : {}}
    >
      <div className="text-xl mb-1">{icon}</div>
      <h4 className="font-bold text-sm text-gray-800">{symbol}</h4>
      <p className="text-[10px] text-gray-500 leading-tight mt-1">{name}</p>
    </div>
  );
}

function ExplanationItem({ title, children, icon }: { title: string, children: React.ReactNode, icon: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
      <h5 className="font-bold text-sm mb-2 text-gray-700 flex items-center">
        <span className="text-[#17A2B8] mr-2">{icon}</span> {title}
      </h5>
      <p className="text-xs text-gray-500 leading-relaxed">
        {children}
      </p>
    </div>
  );
}
