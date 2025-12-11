import { useRef } from 'react';
import { DailySummary, getCriticalStation, StationSummary } from '@/lib/aqi';
import logoMaliMeteo from '@assets/Logo_Mali_Meteo_1765449131851.png';
import html2pdf from 'html2pdf.js';
import { Button } from '@/components/ui/button';
import '@/styles/bulletin.css'; // Import the EXACT ORIGINAL styles

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
      // @ts-ignore - dynamic access
      criticalConcentration = criticalStation[`max${data.mainPollutant.replace('.', '')}`] || 0;
  }

  const handleExport = () => {
    if (!contentRef.current) return;
    
    if (onExportStart) onExportStart();

    const element = contentRef.current;
    
    // Configured for A4 portrait exact fit
    const opt = {
      margin: 0,
      filename: `bulletin_qualite_air_${data.date.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        // Important: this helps with the "cutting off" issue
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        if (onExportEnd) onExportEnd();
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div id="export-button-container" className="text-center w-full max-w-[1100px]">
        <Button 
          onClick={handleExport}
          className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-semibold py-3 px-6 rounded-lg text-lg cursor-pointer transition-colors"
        >
          <i className="fas fa-file-pdf mr-2"></i> Télécharger le Bulletin (PDF)
        </Button>
      </div>

      <div className="main-app-container">
        <div id="bulletinOutput" className="bulletin-container">
            <div id="pdf-content" ref={contentRef}>
                <div className="header">
                    <div className="header-title">
                        <div className="logo">
                            <img src={logoMaliMeteo} alt="Mali Météo" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                        </div>
                        <div className="header-text">
                            <h2>MALI MÉTÉO</h2>
                            <p>BULLETIN QUALITÉ DE L'AIR DE BAMAKO</p>
                        </div>
                    </div>
                    <div className="date-info">
                        <div className="date-block">
                            <p>DATE DU RELEVÉ</p>
                            <strong>{data.date}</strong>
                        </div>
                        <div className="validity-info">
                            <i className="fas fa-chart-line"></i> 
                            Validité: 24h
                        </div>
                    </div>
                </div>

                <div className="alert-bar" style={{ backgroundColor: data.colorCode }}>
                    <i className="fas fa-exclamation-triangle"></i>&nbsp;
                    ALERTE : Qualité de l'Air {data.aqiLabel.toUpperCase()} (AQI: {data.cityMaxAQI})
                </div>

                <div className="main-content">
                    <div className="left-section">
                        <div className="aqi-global">
                            <p style={{ fontSize: '14px', marginBottom: '5px', color: 'var(--color-text-light)' }}>Indice de Qualité de l'Air (AQI)</p>
                            <p style={{ fontSize: '12px', marginBottom: '10px', color: 'var(--color-text-light)' }}>Valeur maximale mesurée</p>
                            <div className="aqi-value" style={{ color: data.colorCode }}>{data.cityMaxAQI}</div>
                            <div className="aqi-label" style={{ color: data.colorCode }}>{data.aqiLabel.toUpperCase()}</div>
                            
                            <div className="pollutant-info">
                                <p>
                                    <span className="dot" style={{ backgroundColor: data.colorCode }}></span> 
                                    <strong>Polluant Critique :</strong>&nbsp;{data.mainPollutant}
                                </p>
                                <p>
                                    <i className="fas fa-map-marker-alt" style={{marginRight: '8px'}}></i> 
                                    <strong>Station :</strong>&nbsp;{criticalStation?.name || 'Inconnue'}
                                </p>
                                <p>
                                    <i className="fas fa-chart-line" style={{marginRight: '8px'}}></i> 
                                    <strong>Concentration Maximale :</strong>&nbsp;{criticalConcentration} {['CO'].includes(data.mainPollutant) ? 'ppm' : (['NO2', 'SO2', 'O3'].includes(data.mainPollutant) ? 'ppb' : 'µg/m³')}
                                </p>
                            </div>
                        </div>

                        <div className="info-boxes">
                            <div className="recommendation-box">
                                <div className="box-title">
                                    <i className="fas fa-notes-medical" style={{marginRight: '8px'}}></i> Recommandations Santé
                                </div>
                                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                    <p style={{marginBottom: '8px'}}><strong>Pour tous :</strong> {data.healthAdvice.general}</p>
                                    <p><strong>Groupes sensibles :</strong> {data.healthAdvice.sensitive}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="right-section">
                        <div className="box-title">
                            <i className="fas fa-wind" style={{marginRight: '8px'}}></i> Polluants Surveillés
                        </div>
                        <div className="pollutants-grid">
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

                <div className="legend">
                    <div className="legend-title">
                        <i className="fas fa-chart-bar" style={{marginRight: '8px'}}></i> Échelle de Qualité de l'Air (AQI)
                    </div>
                    <div className="legend-items">
                        <div className="legend-item" style={{ backgroundColor: '#17A2B8', color: 'white' }}>Bonne (0-50)</div>
                        <div className="legend-item" style={{ backgroundColor: '#f1c40f' }}>Modérée (51-100)</div>
                        <div className="legend-item" style={{ backgroundColor: '#e67e22' }}>Peu Saine GS (101-150)</div>
                        <div className="legend-item" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Peu Saine (151-200)</div>
                        <div className="legend-item" style={{ backgroundColor: '#9b59b6', color: 'white' }}>Très Peu Saine (201-300)</div>
                        <div className="legend-item" style={{ backgroundColor: '#6e4c4c', color: 'white' }}>Dangereuse (301-500)</div>
                    </div>
                </div>

                <div className="explanation-footer">
                    <h4><i className="fas fa-book-reader"></i> Comprendre Notre Bulletin</h4>
                    <div className="explanation-grid">
                        <div className="explanation-item">
                            <h5><i className="fas fa-sort-numeric-up"></i> AQI (Score central)</h5>
                            <p>Indique la gravité de la pollution maximale mesurée. Plus le chiffre est élevé (jusqu'à 500), plus l'air est potentiellement nocif pour la santé.</p>
                        </div>
                        <div className="explanation-item">
                            <h5><i className="fas fa-filter"></i> Polluant Critique</h5>
                            <p>C'est la substance (particules fines, ozone, etc.) dont la concentration est la plus élevée et qui donne le score AQI de la journée.</p>
                        </div>
                        <div className="explanation-item">
                            <h5><i className="fas fa-hand-point-right"></i> Recommandations</h5>
                            <p>Suivez-les strictement pour minimiser votre exposition et protéger les groupes sensibles (enfants, personnes âgées, etc.).</p>
                        </div>
                    </div>
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
      className={`pollutant-card ${isCritical ? 'critical-card' : ''}`}
      style={isCritical ? { border: `3px solid ${criticalColor}` } : {}}
    >
      <i className={`fas ${icon}`}></i>
      <h4>{symbol}</h4>
      <p>{name}</p>
    </div>
  );
}
