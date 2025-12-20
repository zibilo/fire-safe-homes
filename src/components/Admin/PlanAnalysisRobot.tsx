import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Upload, Loader2, AlertTriangle, CheckCircle, ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Gestion de l'upload d'image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null); // Reset result
    }
  };

  // Lancer l'analyse
  const startAnalysis = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // 1. Upload temporaire de l'image pour que l'IA puisse la lire
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `temp_robot/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 2. Récupérer URL publique
      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(uploadData.path);

      // 3. Appeler l'IA (Edge Function)
      const { data, error: fnError } = await supabase.functions.invoke('analyze-plan', {
        body: { planUrl: urlData.publicUrl }
      });

      if (fnError) throw fnError;

      if (data.error) throw new Error(data.error);
      
      setAnalysis(data.analysis);
      toast.success("Analyse terminée !");

      // Nettoyage (Optionnel : supprimer l'image temporaire après analyse pour économiser le stockage)
      // await supabase.storage.from('house-plans').remove([fileName]);

    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'analyse : " + error.message);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-full">
          <Bot className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Robot Analyste</h1>
          <p className="text-muted-foreground">
            IA spécialisée dans l'analyse de plans d'incendie
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ZONE DE GAUCHE : UPLOAD */}
        <div className="space-y-6">
          <Card className="p-6 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors">
            <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img 
                    src={previewUrl} 
                    alt="Aperçu" 
                    className="w-full h-64 object-contain rounded-lg bg-black/5" 
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl(null);
                      setAnalysis(null);
                    }}
                    disabled={isAnalyzing}
                  >
                    Changer
                  </Button>
                </div>
              ) : (
                <Label htmlFor="robot-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center py-12">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-500" />
                  </div>
                  <span className="text-lg font-medium">Déposez un plan ici</span>
                  <span className="text-sm text-muted-foreground mt-1">ou cliquez pour parcourir</span>
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
            className="w-full h-12 text-lg gradient-fire border-0" 
            disabled={!imageFile || isAnalyzing}
            onClick={startAnalysis}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Le robot analyse le plan...
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
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/30 border-dashed">
              <Search className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg">En attente d'un plan...</p>
              <p className="text-sm max-w-xs mx-auto mt-2">
                Téléversez une image pour laisser l'intelligence artificielle détecter les risques et les accès.
              </p>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
                <Bot className="h-20 w-20 text-purple-600 relative z-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold mt-6">Analyse en cours</h3>
              <p className="text-muted-foreground mt-2">Identification des structures...</p>
              <div className="w-full max-w-xs mt-6 space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 animate-[slide-in_1s_infinite]"></div>
                </div>
              </div>
            </Card>
          )}

          {analysis && (
            <div className="space-y-4 animate-fade-in">
              {/* Score Global */}
              <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-l-4 border-purple-500 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-purple-900">
                      <FileText className="h-5 w-5" /> Résumé de l'analyse
                    </h3>
                    <p className="text-slate-600 mt-1">{analysis.summary}</p>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg shadow-sm border">
                    <span className="block text-xs text-muted-foreground uppercase font-bold">Risque</span>
                    <span className={`text-2xl font-bold ${
                      analysis.risk_score > 7 ? 'text-red-600' : 
                      analysis.risk_score > 4 ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {analysis.risk_score}/10
                    </span>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dangers */}
                <Card className="p-4 border-l-4 border-orange-500">
                  <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Risques Détectés
                  </h4>
                  {analysis.risks.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.risks.map((risk, idx) => (
                        <li key={idx} className="bg-orange-50 p-2 rounded">
                          <span className="font-bold block text-orange-900">{risk.area}</span>
                          <span className="text-orange-800">{risk.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun risque majeur détecté.</p>
                  )}
                </Card>

                {/* Accès et Pièces */}
                <Card className="p-4 border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> Accès & Structure
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">Issues : </span>
                      {analysis.exits.join(", ") || "Non identifiées"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Pièces : </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.rooms.map((room, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {room}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recommandations */}
              <Card className="p-4 border-l-4 border-green-500 bg-green-50/30">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Recommandations IA
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-green-600 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanAnalysisRobot;