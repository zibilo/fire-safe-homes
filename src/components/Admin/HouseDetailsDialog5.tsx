import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, FileText, Home, MapPin, Building, Ruler, 
  Clock, Zap, ShieldAlert, AlertTriangle, Eye, Download, FileCheck,
  Siren, Bot, ArrowRight, Loader2, Sparkles, CheckCircle,
  Navigation, Map as MapIcon, Copy, Upload, ImagePlus, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HouseDetails {
  id: string | number;
  owner_name?: string;
  owner_phone?: string;
  phone?: string;
  owner_email?: string;
  property_type?: string;
  address?: string;
  street?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  parcel_number?: string;
  building_name?: string;
  floor_number?: number;
  apartment_number?: string;
  total_floors?: number;
  number_of_floors?: number;
  elevator_available?: boolean;
  description?: string;
  notes?: string;
  number_of_rooms?: number | null;
  surface_area?: number | string;
  construction_year?: number;
  heating_type?: string;
  sensitive_objects?: string[];
  security_notes?: string;
  plan_url?: string | null;
  photos_urls?: string[] | string;
  documents_urls?: string[] | string;
  plan_analysis?: any;
  created_at?: string | null;
}

interface HouseDetailsDialogProps {
  house: HouseDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsDialog({ house, open, onOpenChange }: HouseDetailsDialogProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // État local pour le plan et l'analyse
  const [currentPlanUrl, setCurrentPlanUrl] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  // --- GÉOCODAGE & NAVIGATION ---
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCoordinates(null);
      setCurrentPlanUrl(house.plan_url || null);
      setCurrentAnalysis(house.plan_analysis);
      fetchCoordinates();
    }
  }, [open, house]);

  // --- GÉOCODAGE ---
  const fetchCoordinates = async () => {
    setGeoLoading(true);
    try {
      const city = house.city?.trim() || "";
      const neighborhood = house.neighborhood?.trim() || "";
      const street = house.street?.trim() || house.address?.trim() || "";
      
      const queries = [
        `${street}, ${neighborhood}, ${city}, République du Congo`,
        `${neighborhood}, ${city}, République du Congo`,
        `${city}, République du Congo`
      ];

      for (const q of queries) {
        if (q.replace(", République du Congo", "").trim() === "") continue;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          return;
        }
      }
    } catch (error) {
      console.error("Erreur géocodage", error);
    } finally {
      setGeoLoading(false);
    }
  };

  const startNavigation = () => {
    if (!coordinates) {
      toast.error("Coordonnées GPS introuvables.");
      return;
    }
    const geoUri = `geo:${coordinates.lat},${coordinates.lon}?q=${coordinates.lat},${coordinates.lon}(Intervention)`;
    window.location.href = geoUri;
  };

  const openInMaps = () => {
    if (!coordinates) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lon}`, '_blank');
  };

  const copyCoordinates = () => {
    if (!coordinates) return;
    const text = `${coordinates.lat}, ${coordinates.lon}`;
    navigator.clipboard.writeText(text);
    toast.success("Coordonnées copiées");
  };

  // --- UPLOAD MANUEL ---
  const handleManualUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${house.id}/plan_ia_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // Mettre à jour la BDD
      const { error: dbError } = await supabase
        .from('houses')
        .update({ plan_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', house.id);

      if (dbError) throw dbError;

      setCurrentPlanUrl(publicUrl);
      toast.success("Plan prêt pour l'analyse !");
      
    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error("Erreur upload : " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- ANALYSE IA (GEMINI) ---
  const handleAnalyzePlan = async (mode: 'standard' | 'operational' = 'standard') => {
    if (!currentPlanUrl) {
      toast.error("Veuillez d'abord téléverser un plan.");
      return;
    }

    setAnalyzing(true);
    const loadingMessage = mode === 'operational' 
      ? "Génération du rapport opérationnel..." 
      : "Analyse architecturale...";
    
    toast.info(loadingMessage);

    try {
      const contextData = {
        occupants: "Non spécifié",
        fluids: house.heating_type || "Non spécifié",
        sensitive_objects: house.sensitive_objects || [],
        security_notes: house.security_notes || "",
        structure: {
          type: house.property_type,
          floors: house.total_floors || house.number_of_floors,
          surface: house.surface_area,
          rooms: house.number_of_rooms
        }
      };

      const anonKey = supabase.supabaseKey;
      const response = await fetch('https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          planUrl: currentPlanUrl,
          houseId: house.id,
          mode: mode,
          contextData: contextData
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur serveur (${response.status}): ${errText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentAnalysis(data.analysis);
      toast.success("Analyse terminée !");
      
    } catch (error: any) {
      console.error("Erreur analyse:", error);
      toast.error("Échec : " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPlan = async () => {
    if (!currentPlanUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(currentPlanUrl);
      if (!response.ok) throw new Error("Erreur réseau");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = currentPlanUrl.split('.').pop() || 'pdf';
      link.download = `Plan_${house.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Téléchargement réussi");
    } catch (error) {
       window.open(currentPlanUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const parseUrls = (urls: string[] | string | undefined | null): string[] => {
    if (!urls) return [];
    if (Array.isArray(urls)) return urls;
    try { return JSON.parse(urls); } catch { return []; }
  };

  const documents = parseUrls(house.documents_urls);
  const photos = parseUrls(house.photos_urls);
  
  const standardAnalysis = currentAnalysis;
  const operationalReport = currentAnalysis?.operational_report || 
                           (currentAnalysis?.access_points ? currentAnalysis : null);
  
  const hasStandardAnalysis = standardAnalysis && (standardAnalysis.summary || standardAnalysis.high_risk_zones) && !operationalReport;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Dossier complet de la maison</DialogTitle>
          <DialogDescription>
            ID: {house.id} • {house.address}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="info">Infos & GPS</TabsTrigger>
              <TabsTrigger value="files">Fichiers</TabsTrigger>
              <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
              <TabsTrigger value="operational">Rapport Pompier</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFOS */}
            <TabsContent value="info" className="space-y-6 mt-4">
              <Card className="p-4 border-l-4 border-l-red-600 bg-red-50/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-red-700">
                    <Siren className="h-5 w-5 animate-pulse" /> Intervention
                  </h3>
                  {coordinates ? (
                     <Badge className="bg-green-600 cursor-pointer" onClick={copyCoordinates}>
                        GPS OK: {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}
                     </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {geoLoading ? "Recherche..." : "Non Géolocalisé"}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button onClick={startNavigation} disabled={!coordinates} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Navigation className="mr-2 h-4 w-4" /> GPS
                  </Button>
                  <Button onClick={openInMaps} disabled={!coordinates} variant="outline" className="flex-1">
                    <MapIcon className="mr-2 h-4 w-4" /> Carte
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4"/> Propriétaire</h3>
                  <div className="space-y-1">
                    <p><strong>Nom:</strong> {house.owner_name}</p>
                    <p><strong>Tél:</strong> {house.phone || house.owner_phone}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4"/> Adresse</h3>
                  <div className="space-y-1">
                    <p>{house.address || house.street}</p>
                    <p>{house.neighborhood}, {house.city}</p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: FICHIERS */}
            <TabsContent value="files" className="space-y-6 mt-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Documents attachés</h3>
                <div className="space-y-2">
                  {currentPlanUrl && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Plan Principal</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => window.open(currentPlanUrl!, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {[...documents, ...photos].map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm truncate max-w-[200px]">Document annexe {idx + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {!currentPlanUrl && documents.length === 0 && photos.length === 0 && (
                    <p className="text-center text-muted-foreground">Aucun fichier disponible.</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: ANALYSE IA (AVEC UPLOAD) */}
            <TabsContent value="analysis" className="mt-4 space-y-4">
              {/* ZONE IMAGE / UPLOAD */}
              <Card className="p-4 border-dashed border-2">
                <div className="flex flex-col items-center justify-center gap-4">
                   {currentPlanUrl ? (
                     <div className="w-full space-y-3">
                       <div className="relative w-full h-64 bg-black/5 rounded-lg flex items-center justify-center overflow-hidden">
                         <img src={currentPlanUrl} alt="Plan" className="h-full object-contain" />
                         <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 rounded-full"
                            onClick={() => setCurrentPlanUrl(null)}
                            title="Retirer l'image"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                       <div className="flex gap-2 justify-center">
                         <Button 
                           onClick={() => handleAnalyzePlan('standard')} 
                           disabled={analyzing}
                           className="gradient-fire border-0"
                         >
                           {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                           Analyse Standard
                         </Button>
                         <Button 
                           onClick={() => handleAnalyzePlan('operational')} 
                           disabled={analyzing}
                           className="bg-red-600 hover:bg-red-700 text-white"
                         >
                           {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Siren className="mr-2 h-4 w-4" />}
                           Rapport Pompier
                         </Button>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center w-full py-8">
                       <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                       <h3 className="font-semibold text-lg">Aucun plan pour l'analyse</h3>
                       <p className="text-muted-foreground mb-4">Veuillez importer une image du plan pour lancer l'IA.</p>
                       
                       <Label htmlFor="analysis-upload" className="cursor-pointer">
                         <div className={`inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                           {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                           {isUploading ? "Envoi..." : "Importer un plan"}
                         </div>
                         <Input 
                           id="analysis-upload" 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           onChange={handleManualUpload}
                           disabled={isUploading}
                         />
                       </Label>
                     </div>
                   )}
                </div>
              </Card>

              {/* RÉSULTATS ANALYSE */}
              {hasStandardAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-muted p-3 rounded">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">Résultat Analyse :</span>
                    <Badge variant={getRiskBadgeVariant(standardAnalysis.overall_risk_score)}>{standardAnalysis.overall_risk_score}/10</Badge>
                  </div>
                  <Card className="p-4">
                    <p className="text-sm">{standardAnalysis.summary}</p>
                  </Card>
                  {standardAnalysis.high_risk_zones?.map((zone: any, i: number) => (
                    <Card key={i} className="p-3 border-l-4 border-l-orange-500">
                      <div className="flex justify-between font-medium">
                        <span>{zone.name}</span>
                        <Badge variant="destructive">{zone.risk_level}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{zone.reason}</p>
                    </Card>
                  ))}
                </div>
              ) : !analyzing && currentPlanUrl && (
                <div className="text-center text-muted-foreground py-4">
                  Cliquez sur un bouton d'analyse ci-dessus pour voir les résultats.
                </div>
              )}
            </TabsContent>

            {/* TAB 4: RAPPORT OPÉRATIONNEL */}
            <TabsContent value="operational" className="mt-4">
              {!operationalReport ? (
                 <div className="text-center py-12 border-2 border-dashed rounded-lg">
                   <Siren className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                   <h3 className="font-semibold text-lg text-slate-500">Rapport non généré</h3>
                   <p className="text-slate-400 mb-4">Allez dans l'onglet "Analyse IA" et cliquez sur "Rapport Pompier"</p>
                 </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white p-4 rounded-lg border-l-8 border-red-600 shadow-md">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Siren className="h-6 w-6 text-red-500" /> RAPPORT TACTIQUE
                    </h3>
                    <p className="mt-2 text-slate-300 text-sm italic border-t border-slate-700 pt-2">
                      {operationalReport.operational_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-t-4 border-t-blue-600">
                      <h4 className="font-bold text-blue-800 mb-3">Accès</h4>
                      <ul className="space-y-2 text-sm">
                        {operationalReport.access_points?.map((acc: any, i: number) => (
                          <li key={i} className="bg-blue-50 p-2 rounded">
                            <span className="font-bold">{acc.id || `A${i+1}`}:</span> {acc.location}
                          </li>
                        ))}
                      </ul>
                    </Card>

                    <Card className="p-4 border-t-4 border-t-orange-600">
                      <h4 className="font-bold text-orange-800 mb-3">Zones à Risque (ZRA)</h4>
                      <ul className="space-y-2 text-sm">
                        {operationalReport.risk_zones?.map((zone: any, i: number) => (
                          <li key={i} className="bg-orange-50 p-2 rounded flex justify-between">
                            <span className="font-bold">{zone.zone}</span>
                            <span className="text-orange-700">{zone.risk}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}