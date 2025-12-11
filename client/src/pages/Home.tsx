import { useState } from 'react';
import Papa from 'papaparse';
import { parseCSV, DailySummary, getHealthAdvice, getAQILabel, getAQIColor } from '@/lib/aqi';
import { Bulletin } from '@/components/Bulletin';
import { Upload, AlertCircle, Loader2, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Home() {
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const summary = await parseCSV(file);
      
      if (!summary) {
        throw new Error("Impossible de générer le résumé. Vérifiez le format du fichier.");
      }

      // Add UI helper properties
      const enrichedData = {
        ...summary,
        healthAdvice: getHealthAdvice(summary.cityMaxAQI),
        aqiLabel: getAQILabel(summary.cityMaxAQI),
        colorCode: getAQIColor(summary.cityMaxAQI)
      };

      setData(enrichedData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur inconnue lors du traitement.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-[1100px] mx-auto flex flex-col items-center">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Générateur de Bulletin Qualité de l'Air
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Plateforme de Surveillance Environnementale - Mali Météo
          </p>
        </div>

        {/* Input Panel */}
        <Card className="w-full max-w-2xl mb-10 border-2 border-dashed border-slate-200 shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group">
          <CardContent 
            className="p-12 flex flex-col items-center justify-center text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="bg-white p-5 rounded-full mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-slate-100">
               <FileType className="w-10 h-10 text-blue-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Charger les données du jour</h3>
            <p className="text-slate-400 mb-8 text-sm max-w-xs mx-auto">
              Glissez-déposez votre fichier CSV exporté des stations de surveillance
            </p>
            
            <input 
              type="file" 
              id="csvFile" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <label 
              htmlFor="csvFile" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-full cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Sélectionner un fichier CSV
            </label>

            {loading && (
              <div className="mt-8 flex items-center text-blue-600 font-medium animate-pulse bg-blue-50 px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse des données en cours...
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-8 text-left animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur d'importation</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Bulletin Output */}
        {data && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
             <Bulletin data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
