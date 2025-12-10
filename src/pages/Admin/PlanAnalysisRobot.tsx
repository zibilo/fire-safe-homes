import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Upload, Loader2, AlertTriangle, CheckCircle, ArrowRight, FileText, Search, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisResult {
  summary: string;
  rooms: string[];
  risks: { area: string; description: string }[];
  exits: string[];
  recommendations: string[];
  risk_score: number;
}

const PlanAnalysisRobot = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // 1. NOUVEAU : État pour la progression
  const [progress, setProgress] = useState(0);
  
  const contentRef = useRef(null); 

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setProgress(0); // Reset
    }
  };

  const startAnalysis = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    setProgress(0);
    let filePathToClean: string | null = null;
    let progressInterval: NodeJS.Timeout;

    // 2. NOUVEAU : Démarrage de la simulation de progression
    // On avance vite au début, puis on ralentit vers 90%
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // On bloque à 90% tant que c'est pas fini
        const diff = Math.random() * 10; // Saut aléatoire
        return Math.min(prev + diff, 90);
      });
    }, 500);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `temp_robot/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;
      
      filePathToClean = uploadData.path; 

      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(uploadData.path);
      
      const planUrl = urlData.publicUrl;

      const HOUSE_ID_FOR_SAVE = "temp_analysis_123"; 

      const { data, error: fnError } = await supabase.functions.invoke('analyze-plan', {
        body: { 
            planUrl: planUrl, 
            houseId: HOUSE_ID_FOR_SAVE
        },
        timeout: 60000 
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      
      // 3. SUCCÈS : On force à 100% avant d'afficher
      clearInterval(progressInterval);
      setProgress(100);
      
      // Petit délai pour laisser l'utilisateur voir le 100%
      setTimeout(() => {
        setAnalysis(data.analysis);
        toast.success("Analyse terminée !");
      }, 500);

    } catch (error: any) {
      console.error("Erreur:", error);
      clearInterval(progressInterval);
      setProgress(0); // Reset en cas d'erreur
      toast.error("Erreur lors de l'analyse : " + error.message);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setIsAnalyzing(false);
      
      if (filePathToClean) {
          try {
              await supabase.storage.from('house-plans').remove([filePathToClean]);
          } catch(e) {
              console.error("Échec suppression temp:", e);
          }
      }
    }
  };

  const generatePdf = () => {
    const input = contentRef.current;
    if (!input) return;
    toast.info("Génération du PDF en cours...");
    html2canvas(input as HTMLElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      const margin = 10;
      pdf.addImage(imgData, 'PNG', margin, position + margin, pdfWidth - 2 * margin, imgHeight);
      const pageHeight = pdf.internal.pageSize.getHeight();
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, pdfWidth - 2 * margin, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('Rapport_Analyse_FireBot.pdf');
      toast.success("PDF téléchargé !");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in bg-gray-900 min-h-screen p-6 text-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-900 rounded-full">
          <Bot className="h-8 w-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Robot Analyste</h1>
          <p className="text-gray-400">
            IA spécialisée dans l'analyse de plans d'incendie
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ZONE DE GAUCHE : UPLOAD */}
        <div className="space-y-6">
          <Card className="p-6 border-2 border-dashed border-purple-500/20 bg-gray-900 hover:border-purple-500/50 transition-colors">
            <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img 
                    src={previewUrl} 
                    alt="Aperçu" 
                    className="w-full h-64 object-contain rounded-lg bg-gray-800" 
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 right-2 bg-gray-700 text-gray-100 hover:bg-gray-600"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl(null);
                      setAnalysis(null);
                      setProgress(0);
                    }}
                    disabled={isAnalyzing}
                  >
                    Changer
                  </Button>
                </div>
              ) : (
                <Label htmlFor="robot-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center py-12">
                  <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-400" />
                  </div>
                  <span className="text-lg font-medium">Déposez un plan ici</span>
                  <span className="text-sm text-gray-400 mt-1">ou cliquez pour parcourir</span>
                  <Input 
                    id="robot-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </Label>
              )}
            </div>
          </Card>

          <Button 
            className="w-full h-12 text-lg bg-purple-600 border-0 hover:bg-purple-700 disabled:opacity-50" 
            disabled={!imageFile || isAnalyzing || isUploading}
            onClick={startAnalysis}
          >
            {isAnalyzing || isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Lancer l'analyse IA
              </>
            )}
          </Button>
        </div>

        {/* ZONE DE DROITE : RÉSULTATS */}
        <div className="space-y-6">
          {!analysis && !isAnalyzing && (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-900 border-dashed border-gray-700">
              <Search className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg">En attente d'un plan...</p>
              <p className="text-sm max-w-xs mx-auto mt-2">
                Téléversez une image pour laisser l'intelligence artificielle détecter les risques et les accès.
              </p>
            </Card>
          )}

          {/* 4. MODIFICATION VISUELLE DU LOADING */}
          {isAnalyzing && (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full animate-pulse"></div>
                  <Bot className="h-24 w-24 text-purple-400 relative z-10 animate-bounce" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-100 mb-2">
                  {Math.round(progress)}%
                </h3>
                
                {/* Barre de progression */}
                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-inner mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Texte dynamique selon le % */}
                <p className="text-purple-300 font-medium animate-pulse">
                  {progress < 30 ? "Lecture du fichier..." : 
                   progress < 60 ? "Analyse des structures..." : 
                   progress < 90 ? "Détection des risques..." : 
                   "Finalisation du rapport..."}
                </p>
              </div>
            </Card>
          )}

          {analysis && (
            <div className="space-y-4 animate-fade-in">
              <div ref={contentRef} className="space-y-4 p-4 rounded-lg bg-gray-950 shadow-2xl"> 
                <Card className="p-6 bg-gray-900 border-l-4 border-purple-500 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-purple-400">
                        <FileText className="h-5 w-5" /> Résumé de l'analyse
                      </h3>
                      <div className="prose prose-sm prose-invert max-w-none mt-1 text-gray-200"> 
                        <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="text-center bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-700">
                      <span className="block text-xs text-gray-400 uppercase font-bold">Risque</span>
                      <span className={`text-2xl font-bold ${
                        analysis.risk_score > 7 ? 'text-red-500' : 
                        analysis.risk_score > 4 ? 'text-yellow-400' : 'text-green-500'
                      }`}>
                        {analysis.risk_score}/10
                      </span>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-l-4 border-orange-500 bg-gray-800 text-gray-100">
                    <h4 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Risques Détectés
                    </h4>
                    {analysis.risks.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {analysis.risks.map((risk, idx) => (
                          <li key={idx} className="bg-gray-700 p-2 rounded"> 
                            <span className="font-bold block text-orange-300">{risk.area}</span>
                            <span className="text-gray-300">{risk.description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucun risque majeur détecté.</p>
                    )}
                  </Card>

                  <Card className="p-4 border-l-4 border-blue-500 bg-gray-800 text-gray-100">
                    <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> Accès & Structure
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-300">Issues : </span>
                        {analysis.exits.join(", ") || "Non identifiées"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Pièces : </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.rooms.map((room, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-blue-900 text-blue-300 hover:bg-blue-800">
                              {room}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 border-l-4 border-green-500 bg-gray-800/80">
                  <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Recommandations IA
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-500 font-bold">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 text-lg border-purple-500 text-purple-400 bg-gray-900 hover:bg-gray-800"
                onClick={generatePdf}
              >
                <Download className="mr-2 h-5 w-5" />
                Télécharger le Rapport (PDF)
              </Button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanAnalysisRobot;
