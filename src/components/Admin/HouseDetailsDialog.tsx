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
  created_at?: string | null;
}

interface HouseDetailsDialogProps {
  house: HouseDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HouseDetailsDialog({ house, open, onOpenChange }: HouseDetailsDialogProps) {
  const [downloading, setDownloading] = useState(false);

  // --- GESTION DES FICHIERS ---
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

  // --- GÉOLOCALISATION ---
  
  // 1. Adresse complète pour Google Maps (Web)
  const fullAddress = `${house.parcel_number ? 'Parcelle ' + house.parcel_number + ', ' : ''}${house.street || ''}, ${house.neighborhood || ''}, ${house.district || ''}, ${house.city || ''}, Congo`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // 2. URI "geo:" pour Mobile (Universel : Organic Maps, Maps, Waze...)
  // Le format "geo:0,0?q=" force le téléphone à chercher l'adresse textuelle
  // C'est la méthode la plus robuste pour Android/iOS
  const mobileGeoUri = `geo:0,0?q=${encodedAddress}`;

  // Fonction pour ouvrir l'app mobile
  const openMobileMap = () => {
    // Sur mobile, window.location.href déclenche mieux les "Intents" (liens profonds)
    window.location.href = mobileGeoUri;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Dossier : {house.city} - {house.district}</DialogTitle>
          <DialogDescription>
             Propriétaire : {house.owner_name} • ID: {house.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-2">
          <Tabs defaultValue="info" className="w-full">
            
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="info" className="flex-1 min-w-[100px]">Informations</TabsTrigger>
              <TabsTrigger value="location" className="flex-1 min-w-[100px]">Géolocalisation</TabsTrigger>
              <TabsTrigger value="files" className="flex-1 min-w-[100px]">Fichiers & CNI</TabsTrigger>
            </TabsList>

            {/* TAB 1: INFORMATIONS */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> Contact
                  </h3>
                  <InfoRow icon={User} label="Nom" value={house.owner_name} />
                  <InfoRow icon={FileText} label="Téléphone" value={house.phone} />
                  <InfoRow icon={Building} label="Type" value={house.property_type === 'company' ? 'Entreprise / ERP' : (house.property_type === 'house' ? 'Maison' : 'Appartement')} />
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-orange-500" /> Caractéristiques
                  </h3>
                  <InfoRow icon={Ruler} label="Surface" value={`${house.surface_area || 0} m²`} />
                  <InfoRow icon={Building} label="Pièces" value={house.number_of_rooms} />
                  <InfoRow icon={Clock} label="Année constr." value={house.construction_year} />
                  <InfoRow icon={Zap} label="Énergie" value={house.heating_type} />
                </Card>
              </div>

              <Card className="p-4 bg-muted/30">
                 <h3 className="font-semibold mb-2 text-sm">Description / Notes</h3>
                 <p className="text-sm text-muted-foreground italic">
                   {house.description || "Aucune description fournie."}
                 </p>
              </Card>
            </TabsContent>

            {/* TAB 2: GÉOLOCALISATION */}
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
                          <p className="text-lg text-foreground font-medium">{house.street}</p>
                          {house.neighborhood && <p className="text-muted-foreground">Quartier : {house.neighborhood}</p>}
                          {house.parcel_number && <p className="text-muted-foreground">Parcelle N° {house.parcel_number}</p>}
                          <p className="text-muted-foreground">{house.district}, {house.city}</p>
                        </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-3 w-full md:w-72 pt-2">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                        onClick={() => window.open(googleMapsUrl, '_blank')}
                      >
                        <MapIcon className="mr-2 h-4 w-4" />
                        Google Maps (Web)
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-green-600 text-green-700 hover:bg-green-50 shadow-sm bg-white"
                        onClick={openMobileMap}
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        Ouvrir App GPS (Organic)
                      </Button>
                   </div>
                </div>
              </Card>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3">
                 <ExternalLink className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                 <div className="text-sm text-yellow-800 dark:text-yellow-200">
                   <p className="font-semibold mb-1">Fonctionnement sur mobile :</p>
                   <p>Le bouton "Ouvrir App GPS" utilise le protocole universel du téléphone. Il vous demandera quelle application utiliser (Organic Maps, Google Maps, Waze, etc.) si plusieurs sont installées.</p>
                 </div>
              </div>
            </TabsContent>

            {/* TAB 3: FICHIERS & CNI */}
            <TabsContent value="files" className="space-y-6 mt-4">
              
              {/* SECTION IDENTITÉ */}
              {idCards.length > 0 ? (
                <Card className="p-5 border-purple-500/20 bg-purple-500/5">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-purple-700 dark:text-purple-400">
                        <CreditCard className="h-5 w-5" /> Pièces d'identité
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {idCards.map((url, idx) => {
                            const isRecto = url.includes('recto');
                            const label = isRecto ? "Recto" : "Verso";
                            return (
                                <div key={idx} className="group relative bg-white dark:bg-black rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <div className="aspect-[1.6] bg-gray-100 relative flex items-center justify-center">
                                        <img 
                                            src={url} 
                                            alt={`CNI ${label}`} 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => window.open(url, '_blank')}>
                                                <Eye className="h-4 w-4 mr-2" /> Voir
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3 flex justify-between items-center">
                                        <span className="font-semibold text-sm">{label}</span>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8"
                                            onClick={() => handleDownload(url, `CNI_${label}_${house.owner_name}.jpg`)}
                                            disabled={downloading}
                                        >
                                            <Download className="h-3 w-3 mr-2" /> Télécharger
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
              ) : (
                <Card className="p-6 text-center border-dashed">
                    <CreditCard className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucune pièce d'identité fournie.</p>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 border-dashed border-2">
                  <FileText className="h-12 w-12 text-primary/40" />
                  <div>
                    <h3 className="text-base font-semibold">Plan du bâtiment</h3>
                    <p className="text-xs text-muted-foreground">
                      {house.plan_url ? "Fichier disponible" : "Non fourni"}
                    </p>
                  </div>
                  {house.plan_url && (
                    <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => window.open(house.plan_url!, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" /> Voir
                        </Button>
                        <Button className="flex-1" onClick={() => handleDownload(house.plan_url!, `Plan_${house.id}.jpg`)}>
                            <Download className="mr-2 h-4 w-4" /> DL
                        </Button>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Autres Documents</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {otherDocs.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">Aucun autre document.</p>}
                    {otherDocs.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded border">
                        <span className="text-sm truncate max-w-[150px]">Document {idx + 1}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(url, '_blank')}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(url, `Doc_${idx}.jpg`)}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}