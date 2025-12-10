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
  Navigation, Map as MapIcon, Copy, Upload, ImagePlus
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
  
  // État local pour le plan (pour mise à jour immédiate après upload)
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
      
      let data = [];

      if (street && neighborhood && city) {
        const query = `${street}, ${neighborhood}, ${city}, République du Congo`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      if ((!data || data.length === 0) && neighborhood && city) {
        const query = `${neighborhood}, ${city}, République du Congo`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      if ((!data || data.length === 0) && city) {
        const query = `${city}, République du Congo`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }
      
      if (data && data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        });
      }
    } catch (error) {
      console.error("Erreur géocodage:", error);
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
    toast.success("Ouverture du GPS...");
  };

  const openInMaps = () => {
    if (!coordinates) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lon}`;
    window.open(url, '_blank');
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
      const fileName = `${house.id}/manual_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(data.path);

      const newUrl = urlData.publicUrl;

      // Mettre à jour la base de données
      const { error: dbError } = await supabase
        .from('houses')
        .update({ plan_url: newUrl, updated_at: new Date().toISOString() })
        .eq('id', house.id);

      if (dbError) throw dbError;

      // Mise à jour locale
      setCurrentPlanUrl(newUrl);
      toast.success("Plan téléversé avec succès !");
      
    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors du téléversement : " + error.message);
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
      ? "Génération du rapport opérationnel via Gemini..." 
      : "Analyse architecturale du plan via Gemini...";
    
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

      // Mise à jour de l'analyse locale
      setCurrentAnalysis(data.analysis);
      toast.success("Analyse terminée avec succès !");
      
    } catch (error: any) {
      console.error("Erreur analyse:", error);
      toast.error("Échec de l'analyse : " + (error.message || "Erreur inconnue"));
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
      link.download = `Plan_${house.city}_${house.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Téléchargement réussi");
    } catch (error) {
       window.open(currentPlanUrl, '_blank');
       toast.info("Ouverture dans un nouvel onglet");
    } finally {
      setDownloading(false);
    }
  };

  // --- HELPERS UI ---
  const getRiskBadgeVariant = (riskLevel: string | number) => {
    if (typeof riskLevel === 'number') {
      if (riskLevel >= 7) return "destructive";
      if (riskLevel >= 4) return "secondary";
      return "default";
    }
    return "default";
  };

  const getRiskIcon = (riskLevel: string | number) => {
    if (typeof riskLevel === 'number') {
      if (riskLevel >= 7) return <AlertTriangle className="h-4 w-4 text-red-500" />;
      if (riskLevel >= 4) return <Clock className="h-4 w-4 text-yellow-500" />;
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | undefined | null }) => (
    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
      <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "Non spécifié"}</p>
      </div>
    </div>
  );

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
            ID: {house.id} • Enregistré le {house.created_at ? new Date(house.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="files">Plan & Fichiers</TabsTrigger>
              <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
              <TabsTrigger value="operational">Rapport Pompier</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFORMATIONS */}
            <TabsContent value="info" className="space-y-6 mt-4">
              <Card className="p-4 border-l-4 border-l-red-600 bg-red-50/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-red-700">
                    <Siren className="h-5 w-5 animate-pulse" /> 
                    Intervention & Navigation
                  </h3>
                  {coordinates ? (
                     <div className="flex gap-2">
                       <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 cursor-pointer" onClick={copyCoordinates}>
                          <MapPin className="w-3 h-3 mr-1" /> 
                          {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}
                       </Badge>
                     </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {geoLoading ? "Recherche GPS..." : "GPS Non Confirmé"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={startNavigation} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    disabled={!coordinates || geoLoading}
                  >
                    <Navigation className="mr-2 h-4 w-4" /> GPS (Appareil)
                  </Button>
                  <Button 
                    onClick={openInMaps} 
                    variant="outline" 
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                    disabled={!coordinates || geoLoading}
                  >
                    <MapIcon className="mr-2 h-4 w-4" /> Google Maps Web
                  </Button>
                  <Button onClick={copyCoordinates} variant="secondary" className="px-3" disabled={!coordinates || geoLoading}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-l-4 border-l-primary">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Propriétaire & Contact
                  </h3>
                  <div className="space-y-1">
                    <InfoRow icon={User} label="Nom" value={house.owner_name} />
                    <InfoRow icon={FileText} label="Téléphone" value={house.phone || house.owner_phone} />
                    <InfoRow icon={FileText} label="Email" value={house.owner_email} />
                    <InfoRow icon={Home} label="Type" value={house.property_type === 'house' ? 'Maison Individuelle' : 'Appartement'} />
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Localisation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow icon={MapPin} label="Ville" value={house.city} />
                    <InfoRow icon={MapPin} label="Quartier" value={house.neighborhood} />
                    <InfoRow icon={MapPin} label="Ruelle / Rue" value={house.street || house.address} />
                    <InfoRow icon={MapPin} label="District" value={house.district} />
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: FICHIERS */}
            <TabsContent value="files" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 border-dashed border-2">
                  {currentPlanUrl ? (
                    <div className="flex flex-col gap-3 w-full">
                       <div className="w-full h-48 bg-white rounded-md flex items-center justify-center overflow-hidden border border-border mb-2">
                          <img src={currentPlanUrl} alt="Plan" className="w-full h-full object-contain" />
                       </div>
                      <div className="flex gap-2 justify-center w-full">
                        <Button onClick={() => window.open(currentPlanUrl!, '_blank')} variant="outline" className="flex-1">
                          <Eye className="mr-2 h-4 w-4" /> Voir
                        </Button>
                        <Button onClick={handleDownloadPlan} disabled={downloading} className="gradient-fire border-0 flex-1">
                          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileText className="h-16 w-16 text-primary/40" />
                      <div>
                        <h3 className="text-lg font-semibold">Aucun plan disponible</h3>
                        <p className="text-sm text-muted-foreground mb-4">Téléversez un plan pour l'analyser.</p>
                      </div>
                    </>
                  )}
                  
                  {/* Zone d'Upload Manuel */}
                  <div className="w-full mt-4 pt-4 border-t border-border">
                    <Label htmlFor="manual-upload" className="cursor-pointer w-full block">
                      <div className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-4 text-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                             <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                             <p className="text-sm text-blue-700">Téléversement en cours...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                             <Upload className="h-8 w-8 text-blue-500 mb-2" />
                             <p className="text-sm font-medium text-blue-700">
                               {currentPlanUrl ? "Remplacer le plan" : "Ajouter un plan"}
                             </p>
                             <p className="text-xs text-muted-foreground">PNG, JPG, PDF (Max 10MB)</p>
                          </div>
                        )}
                      </div>
                      <Input 
                        id="manual-upload" 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden"
                        onChange={handleManualUpload}
                        disabled={isUploading}
                      />
                    </Label>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Autres documents</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {documents.map((url, idx) => (
                      <div key={`doc-${idx}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm truncate max-w-[150px]">Document {idx + 1}</span>
                        <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}><Eye className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    {photos.map((url, idx) => (
                      <div key={`photo-${idx}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm truncate max-w-[150px]">Photo {idx + 1}</span>
                        <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}><Eye className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: ANALYSE STANDARD */}
            <TabsContent value="analysis" className="mt-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Analyse Architecturale (Gemini)</span>
                  </div>
                  <Button 
                    onClick={() => handleAnalyzePlan('standard')} 
                    disabled={analyzing || !currentPlanUrl}
                    className="gradient-fire border-0"
                    size="sm"
                  >
                    {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Lancer l'analyse
                  </Button>
                </div>

                {hasStandardAnalysis ? (
                  <div className="space-y-6">
                    {/* RÉSULTATS */}
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded">
                      <span className="font-semibold">Risque global :</span>
                      <Badge variant={getRiskBadgeVariant(standardAnalysis.overall_risk_score)}>
                        {standardAnalysis.overall_risk_score}/10
                      </Badge>
                    </div>
                    {standardAnalysis.summary && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">{standardAnalysis.summary}</p>
                      </Card>
                    )}
                    {standardAnalysis.high_risk_zones?.map((zone: any, idx: number) => (
                       <Card key={idx} className="p-3 border-l-4 border-l-orange-500">
                          <div className="flex justify-between">
                             <span className="font-medium">{zone.name}</span>
                             <Badge variant="destructive">{zone.risk_level}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{zone.reason}</p>
                       </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune analyse disponible.</p>
                    {!currentPlanUrl && <p className="text-sm text-orange-500 mt-2">Veuillez d'abord ajouter un plan.</p>}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: RAPPORT OPÉRATIONNEL */}
            <TabsContent value="operational" className="mt-4">
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-lg mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <Siren className="h-5 w-5 text-red-500" /> Rapport Tactique (Pompier)
                </h3>
                <Button 
                  onClick={() => handleAnalyzePlan('operational')} 
                  disabled={analyzing || !currentPlanUrl}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                  size="sm"
                >
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Siren className="mr-2 h-4 w-4" />}
                  Générer Rapport
                </Button>
              </div>

              {operationalReport ? (
                <div className="space-y-6">
                  {operationalReport.operational_summary && (
                    <Card className="p-4 bg-slate-50 border-l-4 border-l-slate-500">
                      <p className="text-sm italic text-slate-700">{operationalReport.operational_summary}</p>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-t-4 border-t-blue-600">
                      <h4 className="font-bold text-blue-700 mb-3">Accès</h4>
                      {operationalReport.access_points?.map((acc: any, i: number) => (
                        <div key={i} className="mb-2 text-sm">
                          <span className="font-bold">{acc.id || `A${i+1}`}: </span>{acc.location}
                        </div>
                      ))}
                    </Card>
                    <Card className="p-4 border-t-4 border-t-orange-600">
                       <h4 className="font-bold text-orange-700 mb-3">Risques (ZRA)</h4>
                       {operationalReport.risk_zones?.map((z: any, i: number) => (
                         <div key={i} className="mb-2 text-sm bg-orange-50 p-2 rounded">
                           <span className="font-bold">{z.zone}: </span>{z.risk}
                         </div>
                       ))}
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                   Cliquez sur "Générer Rapport" pour créer la fiche tactique.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}