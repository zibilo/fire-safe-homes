import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, FileText, Home, MapPin, Building, Ruler, 
  Clock, Zap, ShieldAlert, AlertTriangle, Eye, Download, 
  Loader2, Navigation, Map as MapIcon, Copy, Upload, Image as ImageIcon, X
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
  plan_analysis?: any; // On garde le type pour éviter les erreurs TS, mais on ne l'utilise pas
  created_at?: string | null;
}

interface HouseDetailsDialogProps {
  house: HouseDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsDialog({ house, open, onOpenChange }: HouseDetailsDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPlanUrl, setCurrentPlanUrl] = useState<string | null>(null);

  // --- GÉOCODAGE & NAVIGATION ---
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (open) {
      setCoordinates(null);
      setCurrentPlanUrl(house.plan_url || null);
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
      
      // Stratégie : Rue -> Quartier -> Ville
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
          return; // Trouvé, on arrête
        }
      }
    } catch (error) {
      console.error("Erreur géocodage", error);
    } finally {
      setGeoLoading(false);
    }
  };

  // --- NAVIGATION ---
  const startNavigation = () => {
    if (!coordinates) return toast.error("Coordonnées introuvables");
    window.location.href = `geo:${coordinates.lat},${coordinates.lon}?q=${coordinates.lat},${coordinates.lon}(Intervention)`;
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

  // --- UPLOAD MANUEL (Pour ajouter/remplacer un plan) ---
  const handleManualUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${house.id}/plan_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('houses')
        .update({ plan_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', String(house.id));

      if (dbError) throw dbError;

      setCurrentPlanUrl(publicUrl);
      toast.success("Plan téléversé avec succès !");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur upload : " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- TÉLÉCHARGEMENT ---
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
       // Fallback : ouverture dans un nouvel onglet
       window.open(currentPlanUrl, '_blank');
       toast.info("Ouverture dans un nouvel onglet");
    } finally {
      setDownloading(false);
    }
  };

  // --- UI HELPERS ---
  const InfoRow = ({ icon: Icon, label, value }: any) => (
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dossier Maison #{house.id}</DialogTitle>
          <DialogDescription>Détails et localisation</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="mt-2">
          <TabsList>
            <TabsTrigger value="info">Infos & GPS</TabsTrigger>
            <TabsTrigger value="files">Plan & Documents</TabsTrigger>
          </TabsList>

          {/* ONGLET INFOS */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Navigation */}
            <Card className="p-4 bg-blue-50/50 border-l-4 border-blue-600">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 text-blue-800">
                   <Navigation className="h-5 w-5" /> Navigation GPS
                </h3>
                {coordinates ? (
                  <Badge className="bg-green-600 cursor-pointer" onClick={copyCoordinates}>
                    GPS OK: {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {geoLoading ? "Recherche..." : "Non localisé"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={startNavigation} disabled={!coordinates} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Navigation className="mr-2 h-4 w-4" /> GPS (Appareil)
                </Button>
                <Button onClick={openInMaps} disabled={!coordinates} variant="outline" className="flex-1">
                  <MapIcon className="mr-2 h-4 w-4" /> Google Maps
                </Button>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Propriétaire</h4>
                <InfoRow icon={User} label="Nom" value={house.owner_name} />
                <InfoRow icon={FileText} label="Téléphone" value={house.phone || house.owner_phone} />
                <InfoRow icon={FileText} label="Email" value={house.owner_email} />
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Adresse</h4>
                <InfoRow icon={MapPin} label="Ville" value={house.city} />
                <InfoRow icon={MapPin} label="Quartier" value={house.neighborhood} />
                <InfoRow icon={MapPin} label="Ruelle / Rue" value={house.street || house.address} />
                <InfoRow icon={Building} label="Type" value={house.property_type === 'house' ? 'Maison' : 'Appartement'} />
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

          {/* ONGLET FICHIERS (Plan + Documents) */}
          <TabsContent value="files" className="space-y-4 mt-4">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Plan de la maison</h3>
                {currentPlanUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPlanUrl(null)}>
                        <X className="h-4 w-4 mr-2" /> Retirer vue
                    </Button>
                )}
              </div>
              
              {/* Affichage Image */}
              <div className="mb-6 bg-muted/30 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 min-h-[250px]">
                {currentPlanUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img 
                      src={`${currentPlanUrl}?t=${Date.now()}`} 
                      alt="Plan" 
                      className="max-h-[400px] w-auto object-contain rounded shadow-sm" 
                    />
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => window.open(currentPlanUrl, '_blank')}>
                        <Eye className="mr-2 h-4 w-4" /> Ouvrir
                      </Button>
                      <Button 
                          onClick={handleDownloadPlan} 
                          disabled={downloading} 
                          className="gradient-fire border-0" 
                          size="sm"
                        >
                          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Télécharger
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun plan disponible</p>
                  </div>
                )}
              </div>

              {/* Zone Upload */}
              <div className="border-t pt-4">
                <Label htmlFor="plan-upload" className="cursor-pointer block">
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? 'bg-muted' : 'hover:bg-blue-50 border-blue-200'}`}>
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p>Téléversement en cours...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-blue-600">
                        <Upload className="h-8 w-8 mb-2" />
                        <p className="font-medium">Cliquez pour ajouter ou remplacer le plan</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF acceptés</p>
                      </div>
                    )}
                    <Input 
                      id="plan-upload" 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={handleManualUpload}
                      disabled={isUploading}
                    />
                  </div>
                </Label>
              </div>
            </Card>

            {/* Autres documents */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Autres documents joints</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {[...documents, ...photos].map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm truncate max-w-[200px]">Document annexe {idx + 1}</span>
                    <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {documents.length === 0 && photos.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">Aucun document supplémentaire.</p>
                )}
              </div>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}