import { useState } from 'react';
import Papa from 'papaparse';
import { calculatePM25AQI, getAQICategory, parseDate, STATION_NAMES_MAP, AQIData } from '@/lib/aqi';
import { Bulletin } from '@/components/Bulletin';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Home() {
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCSV = (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          const meta = results.meta;

          if (rows.length === 0) throw new Error("Fichier CSV vide ou incomplet");

          // Find date
          const dateField = meta.fields?.find(f => f.toLowerCase().includes('date'));
          if (!dateField) throw new Error("Colonne 'date' introuvable");

          let bulletinDate = "Date inconnue";
          for (const row of rows) {
            const parsed = parseDate(row[dateField]);
            if (parsed) {
              bulletinDate = parsed;
              break;
            }
          }

          // Find PM2.5 columns
          const pm25Fields = meta.fields?.filter(f => f.includes('PM2.5')) || [];
          if (pm25Fields.length === 0) throw new Error("Aucune colonne PM2.5 trouvée");

          let maxPM25 = -Infinity;
          let criticalStation = "Inconnue";

          rows.forEach(row => {
            pm25Fields.forEach(field => {
              let valStr = row[field];
              if (typeof valStr === 'string') {
                  valStr = valStr.replace(',', '.');
              }
              const val = parseFloat(valStr);
              
              if (!isNaN(val) && val > maxPM25) {
                maxPM25 = val;
                
                // Determine station name from column header
                const stationKey = Object.keys(STATION_NAMES_MAP).find(key => field.includes(key));
                criticalStation = stationKey ? STATION_NAMES_MAP[stationKey] : "Inconnue";
              }
            });
          });

          if (maxPM25 === -Infinity) throw new Error("Aucune donnée PM2.5 valide trouvée");

          const aqi = calculatePM25AQI(maxPM25);
          const category = getAQICategory(aqi);

          setData({
            aqi,
            category: category.name,
            colorClass: category.colorClass,
            colorCode: category.colorCode,
            recommendation: category.recommendation,
            criticalPollutant: "PM2.5",
            concentration: maxPM25,
            station: criticalStation,
            date: bulletinDate
          });

        } catch (err: any) {
          setError(err.message || "Erreur de traitement du fichier");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError("Erreur de lecture du fichier CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSV(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSV(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] py-10 px-4 font-sans text-[#2c3e50]">
      <div className="max-w-[1100px] mx-auto flex flex-col items-center">
        
        <h1 className="text-3xl font-bold mb-2 text-center text-[#2c3e50]">Générateur de Bulletin Qualité de l'Air</h1>
        <p className="text-gray-500 mb-8 text-center">Mali Météo - Système de Surveillance Environnementale</p>

        {/* Input Panel */}
        <Card className="w-full mb-8 border-2 border-dashed border-gray-200 shadow-sm hover:border-[#007BFF] transition-colors">
          <CardContent 
            className="p-10 flex flex-col items-center justify-center text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="bg-blue-50 p-4 rounded-full mb-4">
               <Upload className="w-8 h-8 text-[#007BFF]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Charger le fichier CSV du jour</h3>
            <p className="text-gray-400 mb-6 text-sm">Glissez-déposez votre fichier ici ou cliquez pour parcourir</p>
            
            <input 
              type="file" 
              id="csvFile" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <label 
              htmlFor="csvFile" 
              className="bg-[#007BFF] hover:bg-[#0056b3] text-white font-semibold py-2 px-6 rounded-lg cursor-pointer transition-colors shadow-md"
            >
              Sélectionner un fichier
            </label>

            {loading && (
              <div className="mt-6 flex items-center text-[#007BFF] font-medium animate-pulse">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Traitement en cours...
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-6 max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Bulletin Output */}
        {data && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Bulletin data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
