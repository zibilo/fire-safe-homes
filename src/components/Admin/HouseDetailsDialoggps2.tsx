import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, FileText, Home, MapPin, Building, Ruler, 
  Clock, Zap, ShieldAlert, AlertTriangle, Eye, Download, FileCheck,
  Siren, Bot, ArrowRight, Loader2, Sparkles, CheckCircle,
  Navigation, Map as MapIcon, Copy
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
  
  // --- GÉOCODAGE & NAVIGATION ---
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCoordinates(null);
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

      // Tentative 1 : Adresse précise
      if (street && neighborhood && city) {
        const query = `${street}, ${neighborhood}, ${city}, République du Congo`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      // Tentative 2 : Quartier
      if ((!data || data.length === 0) && neighborhood && city) {
        const query = `${neighborhood}, ${city}, République du Congo`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        data = await res.json();
      }

      // Tentative 3 : Ville
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

  // --- NAVIGATION OFFLINE ---
  const startNavigation = () => {
    if (!coordinates) {
      toast.error("Coordonnées GPS introuvables.");
      return;
    }
    // Protocole GEO pour ouvrir l'app GPS native (fonctionne Offline avec Organic Maps/Maps.me)
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

  // --- ANALYSE IA (OPENAI) ---
  const handleAnalyzePlan = async (mode: 'standard' | 'operational' = 'standard') => {
    if (!house.plan_url) {
      toast.error("Aucun plan disponible pour l'analyse");
      return;
    }

    setAnalyzing(true);
    const loadingMessage = mode === 'operational' 
      ? "Génération du rapport opérationnel via IA..." 
      : "Analyse architecturale du plan via IA...";
    
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

      // Appel à la Edge Function (qui utilise maintenant OpenAI)
      const response = await fetch('https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // L'authentification est gérée côté serveur si verify_jwt=false, 
          // sinon on passe la clé anon publique
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          planUrl: house.plan_url,
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

      toast.success("Analyse IA terminée avec succès !");
      
      // Petit délai pour laisser le temps à la BD de se mettre à jour avant rechargement visuel (optionnel)
      setTimeout(() => {
        window.location.reload(); // Pour rafraîchir les données affichées
      }, 1000);
      
    } catch (error: any) {
      console.error("Erreur analyse:", error);
      toast.error("Échec de l'analyse : " + (error.message || "Erreur inconnue"));
    } finally {
      setAnalyzing(false);
    }
  };

  // --- DOWNLOAD ---
  const handleDownloadPlan = async () => {
    if (!house.plan_url) return;
    setDownloading(true);
    try {
      const response = await fetch(house.plan_url);
      if (!response.ok) throw new Error("Erreur réseau");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = house.plan_url.split('.').pop() || 'pdf';
      link.download = `Plan_${house.city}_${house.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Téléchargement réussi");
    } catch (error) {
      toast.error("Impossible de télécharger le fichier.");
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
  
  const standardAnalysis = house.plan_analysis;
  const operationalReport = house.plan_analysis?.operational_report || 
                           (house.plan_analysis?.access_points ? house.plan_analysis : null);
  
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
              {/* NAVIGATION GPS OFFLINE */}
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
                    title="Fonctionne sans internet avec une app GPS offline"
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

                  <Button
                    onClick={copyCoordinates}
                    variant="secondary"
                    className="px-3"
                    disabled={!coordinates || geoLoading}
                    title="Copier les coordonnées"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                {!coordinates && !geoLoading && (
                  <p className="text-xs text-red-500 mt-2 text-center border-t border-red-200 pt-2">
                    * Adresse non géolocalisée. Vérifiez l'orthographe des lieux.
                  </p>
                )}
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
                    <MapPin className="h-4 w-4" /> Localisation (Formulaire)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow icon={MapPin} label="Ville" value={house.city} />
                    <InfoRow icon={MapPin} label="Quartier" value={house.neighborhood} />
                    <InfoRow icon={MapPin} label="Ruelle / Rue" value={house.street || house.address} />
                    <InfoRow icon={MapPin} label="District" value={house.district} />
                    <InfoRow icon={MapPin} label="N° Parcelle" value={house.parcel_number} />
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> Détails Techniques
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoRow icon={Home} label="Pièces" value={house.number_of_rooms} />
                  <InfoRow icon={Ruler} label="Surface" value={house.surface_area ? `${house.surface_area} m²` : undefined} />
                  <InfoRow icon={Clock} label="Année" value={house.construction_year} />
                  <InfoRow icon={Zap} label="Chauffage" value={house.heating_type} />
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Description / Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {house.description || house.notes || "Aucune description fournie."}
                  </p>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-l-red-500">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Sécurité & Risques
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Objets sensibles déclarés :</p>
                    <div className="flex flex-wrap gap-2">
                      {house.sensitive_objects && house.sensitive_objects.length > 0 ? (
                        house.sensitive_objects.map((obj, idx) => (
                          <Badge key={idx} variant="outline" className="border-red-200 bg-red-50 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {obj}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun objet sensible déclaré.</p>
                      )}
                    </div>
                  </div>
                  {house.security_notes && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Notes de sécurité</p>
                      <p className="text-sm bg-red-50 text-red-900 p-3 rounded-md border border-red-100">
                        {house.security_notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: FICHIERS */}
            <TabsContent value="files" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 border-dashed border-2">
                  <FileText className="h-16 w-16 text-primary/40" />
                  <div>
                    <h3 className="text-lg font-semibold">Plan de la maison</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {house.plan_url ? "Plan disponible" : "Aucun plan n'a été fourni"}
                    </p>
                  </div>
                  {house.plan_url ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex gap-2 justify-center w-full">
                        <Button 
                          onClick={() => window.open(house.plan_url!, '_blank')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" /> Voir
                        </Button>
                        <Button 
                          onClick={handleDownloadPlan}
                          disabled={downloading}
                          className="gradient-fire border-0 flex-1"
                        >
                          {downloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Télécharger
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={() => handleAnalyzePlan('operational')} 
                        disabled={analyzing}
                        variant="secondary"
                        className="w-full bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-200"
                      >
                        {analyzing ? (
                          <>
                            <Bot className="mr-2 h-4 w-4 animate-pulse" /> Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Siren className="mr-2 h-4 w-4" /> Analyser plan & formulaire (IA)
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button disabled variant="outline">Plan non disponible</Button>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Autres documents</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {documents.map((url, idx) => (
                      <div key={`doc-${idx}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-blue-500" />
                          <span className="text-sm truncate max-w-[150px]">Document {idx + 1}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {photos.map((url, idx) => (
                      <div key={`photo-${idx}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-purple-500" />
                          <span className="text-sm truncate max-w-[150px]">Photo {idx + 1}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!documents.length && !photos.length) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucun autre document.</p>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: ANALYSE STANDARD */}
            <TabsContent value="analysis" className="mt-4">
              {hasStandardAnalysis ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6 bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(standardAnalysis.overall_risk_score || standardAnalysis.riskLevel)}
                      <span className="font-semibold">Niveau de risque estimé :</span>
                    </div>
                    <Badge 
                      variant={getRiskBadgeVariant(standardAnalysis.overall_risk_score || standardAnalysis.riskLevel)} 
                      className="text-base px-3 py-1"
                    >
                      {standardAnalysis.overall_risk_score ? `${standardAnalysis.overall_risk_score}/10` : standardAnalysis.riskLevel}
                    </Badge>
                  </div>

                  {standardAnalysis.summary && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Résumé de l'analyse
                      </h3>
                      <p className="text-sm text-muted-foreground">{standardAnalysis.summary}</p>
                    </Card>
                  )}

                  {standardAnalysis.high_risk_zones && standardAnalysis.high_risk_zones.length > 0 && (
                    <Card className="p-4 border-t-4 border-t-orange-500">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" /> Zones à Haut Risque
                      </h3>
                      <div className="space-y-2">
                        {standardAnalysis.high_risk_zones.map((zone: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <div>
                              <span className="font-medium">{zone.name}</span>
                              <p className="text-xs text-muted-foreground">{zone.reason}</p>
                            </div>
                            <Badge variant="destructive">{zone.risk_level}%</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {standardAnalysis.safety_recommendations && (
                    <Card className="p-4 border-t-4 border-t-green-500">
                      <h3 className="font-semibold mb-3">Recommandations de Sécurité</h3>
                      <ul className="space-y-2">
                        {standardAnalysis.safety_recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Aucune analyse standard</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Lancez une analyse IA pour identifier les risques et obtenir des recommandations.
                  </p>
                  <Button 
                    onClick={() => handleAnalyzePlan('standard')} 
                    disabled={analyzing || !house.plan_url}
                    className="gradient-fire border-0"
                  >
                    {analyzing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours...</>
                    ) : (
                      <><Bot className="mr-2 h-4 w-4" /> Lancer l'analyse standard</>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: RAPPORT OPÉRATIONNEL */}
            <TabsContent value="operational" className="mt-4">
              {operationalReport ? (
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white p-4 rounded-lg border-l-8 border-red-600 shadow-md">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Siren className="h-6 w-6 text-red-500" />
                        RAPPORT OPÉRATIONNEL D'URGENCE
                      </h3>
                      <Badge className="bg-red-600 hover:bg-red-700 border-0">PRIORITAIRE</Badge>
                    </div>
                    {operationalReport.operational_summary && (
                      <p className="mt-2 text-slate-300 text-sm italic border-t border-slate-700 pt-2">
                        "{operationalReport.operational_summary}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 border-t-4 border-t-blue-600">
                      <h4 className="font-bold text-lg mb-4 text-blue-700 flex items-center gap-2">
                        1. ACCÈS & DÉPLOIEMENT
                      </h4>
                      <div className="space-y-3">
                        {operationalReport.access_points?.map((access: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-100">
                            <div className="flex justify-between">
                              <span className="font-bold text-blue-800">{access.id || `Accès ${idx+1}`}</span>
                            </div>
                            <p className="text-sm font-medium mt-1">{access.location}</p>
                            <p className="text-xs text-blue-600 mt-1">{access.description}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4 border-t-4 border-t-orange-600">
                      <h4 className="font-bold text-lg mb-4 text-orange-700 flex items-center gap-2">
                        2. ZONES À RISQUE (Z.R.A)
                      </h4>
                      <div className="space-y-3">
                        {operationalReport.risk_zones?.map((zone: any, idx: number) => (
                          <div key={idx} className="bg-orange-50 p-3 rounded border border-orange-100 flex justify-between items-start">
                            <div>
                              <p className="font-bold text-orange-900">{zone.zone}</p>
                              <p className="text-xs text-orange-800 font-medium">{zone.risk}</p>
                            </div>
                            {zone.tactical_advice && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-white">!</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4 border-t-4 border-t-green-600">
                      <h4 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2">
                        3. VOIES D'ÉVACUATION (V.E.)
                      </h4>
                      <ul className="space-y-2">
                        {operationalReport.evacuation_routes?.map((route: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm bg-green-50 p-2 rounded border border-green-100">
                            <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold text-green-900">{route.name}: </span>
                              <span className="text-green-800">{route.description}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    <Card className="p-4 border-t-4 border-t-slate-600">
                      <h4 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                        4. RECOMMANDATIONS TACTIQUES
                      </h4>
                      <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 space-y-2">
                        {operationalReport.tactical_recommendations?.map((rec: string, idx: number) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span className="font-bold text-slate-500">#{idx + 1}</span>
                            {rec}
                          </p>
                        ))}
                        <div className="mt-4 pt-2 border-t border-slate-200">
                          <p className="font-bold text-xs mb-1">DONNÉES COMPLÉMENTAIRES DU FORMULAIRE :</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <p>Fluides: <span className="font-medium">{house.heating_type || 'N/A'}</span></p>
                            <p>Étages: <span className="font-medium">{house.total_floors || house.number_of_floors || 'N/A'}</span></p>
                          </div>
                          {house.sensitive_objects && house.sensitive_objects.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-bold text-red-600">MATÉRIELS SENSIBLES :</p>
                              <p className="text-xs">{house.sensitive_objects.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="p-12 text-center flex flex-col items-center border-2 border-dashed border-slate-300">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <Siren className="h-10 w-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Rapport opérationnel non disponible</h3>
                  <p className="text-muted-foreground max-w-md mt-2 mb-6">
                    Générez un rapport tactique spécifique pour les équipes d'intervention (accès, dangers immédiats, évacuation).
                  </p>
                  <Button 
                    onClick={() => handleAnalyzePlan('operational')} 
                    disabled={analyzing || !house.plan_url}
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    {analyzing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération...</>
                    ) : (
                      <><Siren className="mr-2 h-4 w-4" /> Générer le rapport d'urgence</>
                    )}
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}