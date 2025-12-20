import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, FileText, MapPin, Building, Ruler, 
  Clock, Zap, Eye, Download, 
  CreditCard, Navigation, Map as MapIcon, ExternalLink, Smartphone
} from "lucide-react";
import { useState } from "react";
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
  latitude?: number;
  longitude?: number;
  created_at?: string | null;
}

interface HouseDetailsDialogProps {
  house?: HouseDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsDialog({ house, open, onOpenChange }: HouseDetailsDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!house) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails indisponibles</DialogTitle>
            <DialogDescription>Aucun logement sélectionné.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // --- UTILITAIRES ---
  // Ces utilitaires sont conservés pour l'instant même s'ils ne sont plus utilisés dans les onglets restants.
  const parseUrls = (urls: string[] | string | undefined | null): string[] => {
    if (!urls) return [];
    if (Array.isArray(urls)) return urls;
    try { return JSON.parse(urls); } catch { return []; }
  };

  const allDocuments = parseUrls(house.documents_urls);
  const idCards = allDocuments.filter(url => url.includes('cni_recto') || url.includes('cni_verso'));
  const otherDocs = allDocuments.filter(url => !url.includes('cni_recto') && !url.includes('cni_verso'));

  const handleDownload = async (url: string, filename: string) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Téléchargement réussi");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  const hasCoordinates = house.latitude != null && house.longitude != null;

  const fullAddress = `${house.parcel_number ? 'Parcelle ' + house.parcel_number + ', ' : ''}${house.street || ''}, ${house.neighborhood || ''}, ${house.district || ''}, ${house.city || ''}, Congo`;
  const encodedAddress = encodeURIComponent(fullAddress);

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/@${house.latitude},${house.longitude},17z`
    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  const mobileGeoUri = hasCoordinates
    ? `geo:${house.latitude},${house.longitude}?q=${house.latitude},${house.longitude}(${encodeURIComponent(house.street || 'Lieu')})`
    : `geo:0,0?q=${encodedAddress}`;

  const openMobileMap = () => {
    window.location.href = mobileGeoUri;
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | undefined | null }) => (
    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
      <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-medium text-foreground">{value ?? "Non spécifié"}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Dossier : {house.city || "Non défini"} - {house.district || "Non défini"}</DialogTitle>
          <DialogDescription>
            Propriétaire : {house.owner_name || "Non spécifié"} • ID: {house.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="info" className="flex-1 min-w-[100px]">Informations</TabsTrigger>
              <TabsTrigger value="location" className="flex-1 min-w-[100px]">Géolocalisation</TabsTrigger>
              {/* L'onglet "Fichiers & CNI" a été retiré */}
            </TabsList>

            {/* --- TAB 1: INFORMATIONS --- */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> Contact
                  </h3>
                  <InfoRow icon={User} label="Nom" value={house.owner_name} />
                  <InfoRow icon={FileText} label="Téléphone" value={house.phone || house.owner_phone} />
                  <InfoRow icon={Building} label="Type" value={
                    house.property_type === 'company' ? 'Entreprise / ERP' : 
                    house.property_type === 'house' ? 'Maison' : 
                    house.property_type === 'apartment' ? 'Appartement' : "Non spécifié"
                  } />
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-orange-500" /> Caractéristiques
                  </h3>
                  <InfoRow icon={Ruler} label="Surface" value={house.surface_area ? `${house.surface_area} m²` : "Non spécifié"} />
                  <InfoRow icon={Building} label="Pièces" value={house.number_of_rooms} />
                  <InfoRow icon={Clock} label="Année constr." value={house.construction_year} />
                  <InfoRow icon={Zap} label="Énergie" value={house.heating_type} />
                </Card>
              </div>

              <Card className="p-4 bg-muted/30">
                <h3 className="font-semibold mb-2 text-sm">Description / Notes</h3>
                <p className="text-sm text-muted-foreground italic">{house.description || "Aucune description fournie."}</p>
              </Card>
            </TabsContent>

            {/* --- TAB 2: GÉOLOCALISATION --- */}
            <TabsContent value="location" className="mt-4 space-y-6">
              <Card className="p-6 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/10">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">Adresse enregistrée</h3>
                        <p className="text-lg text-foreground font-medium">{house.street || "Non spécifié"}</p>
                        {house.neighborhood && <p className="text-muted-foreground">Quartier : {house.neighborhood}</p>}
                        {house.parcel_number && <p className="text-muted-foreground">Parcelle N° {house.parcel_number}</p>}
                        <p className="text-muted-foreground">{house.district || "Non spécifié"}, {house.city || "Non spécifié"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-72 pt-2">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={() => window.open(googleMapsUrl, '_blank')}>
                      <MapIcon className="mr-2 h-4 w-4" />
                      Google Maps (Web)
                    </Button>

                    <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50 shadow-sm bg-white" onClick={openMobileMap}>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Ouvrir App GPS (Mobile)
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            {/* --- TAB 3: FICHIERS & CNI a été retiré (Ancien "files") --- */}

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}