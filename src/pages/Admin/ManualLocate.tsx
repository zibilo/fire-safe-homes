import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Send, Map, Loader2, CheckCircle, Navigation, RefreshCw, History, Smartphone, MessageSquare, Search, MapPin, Layers, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportExcel';

interface GeoRequest {
  id: string;
  phone_number: string;
  status: 'pending' | 'located';
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  created_at: string;
}

const ManualLocate = () => {
  const [phone, setPhone] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [victimData, setVictimData] = useState<GeoRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeoRequest[]>([]);
  const [smsContent, setSmsContent] = useState("");
  const [manualLocation, setManualLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    fetchHistory();
    const channel = supabase
      .channel('geo-list-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'geo_requests' }, () => fetchHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase.from('geo_requests').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setHistory(data as any);
  };

  const generateAndSend = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('geo_requests').insert([{ status: 'pending', phone_number: phone }]).select().single();
      if (error || !data) throw error;
      const sessionId = data.id;
      setCurrentId(sessionId);
      setVictimData(null); 
      const locationLink = `${window.location.origin}/loc/${sessionId}`;
      const messageBody = `URGENCE: Cliquez sur ce lien pour transmettre votre position GPS aux secours : ${locationLink}`;
      const smsHref = `sms:${phone}?&body=${encodeURIComponent(messageBody)}`;
      await navigator.clipboard.writeText(messageBody);
      toast.success("Lien copié !");
      window.location.href = smsHref;
    } catch (error) {
      console.error(error);
      toast.error("Erreur création.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentId) return;
    const channel = supabase
      .channel(`geo-single-${currentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'geo_requests', filter: `id=eq.${currentId}` }, 
      (payload) => {
        if (payload.new.status === 'located') {
          setVictimData(payload.new as GeoRequest);
          toast.success("POSITION REÇUE !");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentId]);

  const handleParseSMS = () => {
    const regex = /([-+]?\d*\.\d+|\d+),\s*([-+]?\d*\.\d+|\d+)/;
    const match = smsContent.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setManualLocation({ lat, lng });
        toast.success("Coordonnées extraites !");
      } else {
        toast.error("Coordonnées invalides.");
      }
    } else {
      toast.error("Format non reconnu.");
    }
  };

  // --- FONCTION INTELLIGENTE D'OUVERTURE DES CARTES ---
  const openMaps = (lat: number, lng: number, mode: 'google' | 'organic' | 'both') => {
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    // Le format geo:lat,lng?q=lat,lng(Label) permet d'afficher un marqueur sur Organic Maps / Maps.me
    const organicUrl = `geo:${lat},${lng}?q=${lat},${lng}(URGENCE VICTIME)`;

    if (mode === 'google') {
        window.open(googleUrl, '_blank');
    } 
    else if (mode === 'organic') {
        // Tente d'ouvrir l'appli native directement
        window.location.href = organicUrl;
    } 
    else if (mode === 'both') {
        // L'ASTUCE : On ouvre Google Maps dans un nouvel onglet...
        window.open(googleUrl, '_blank');
        
        // ...et 500ms plus tard, on lance Organic Maps sur la page actuelle
        setTimeout(() => {
            window.location.href = organicUrl;
            toast.info("Lancement des deux applications...");
        }, 800);
    }
  };

  const viewRequest = (req: GeoRequest) => {
    setCurrentId(req.id);
    req.status === 'located' ? setVictimData(req) : setVictimData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportGeo = () => {
    const data = history.map(req => ({
      "Téléphone": req.phone_number,
      "Statut": req.status === 'located' ? 'Localisé' : 'En attente',
      "Latitude": req.lat,
      "Longitude": req.lng,
      "Précision (m)": req.accuracy,
      "Date": format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: fr })
    }));
    exportToExcel(data, "geolocalisations");
    toast.success("Export terminé");
  };

  // Composant réutilisable pour les boutons d'action
  const MapActions = ({ lat, lng }: { lat: number, lng: number }) => (
    <div className="space-y-3">
        {/* GROS BOUTON PRINCIPAL */}
        <Button 
            className="w-full h-12 text-md font-bold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg"
            onClick={() => openMaps(lat, lng, 'both')}
        >
            <Layers className="mr-2 h-5 w-5" /> OUVRIR LES 2 APPS
        </Button>

        <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openMaps(lat, lng, 'google')}>
                <Map className="mr-2 h-4 w-4" /> Google Maps
            </Button>
            <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => openMaps(lat, lng, 'organic')}>
                <Navigation className="mr-2 h-4 w-4" /> Organic Maps
            </Button>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
            <Navigation className="h-8 w-8 text-blue-600" /> Géolocalisation d'Urgence
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
            {/* CARTE 1 : GÉNÉRATEUR */}
            <Card className="border-t-4 border-blue-600 shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-blue-600" /> Méthode 1 : Lien Web
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!victimData ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Numéro de téléphone</label>
                                <Input type="tel" placeholder="ex: 0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                            <Button onClick={generateAndSend} disabled={loading || !phone} className="w-full bg-blue-600 hover:bg-blue-700">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-4 h-4" />} Envoyer Lien
                            </Button>
                        </>
                    ) : (
                        <div className="text-center space-y-4 animate-in fade-in">
                            <div className="bg-green-100 text-green-800 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Victime Localisée !</h3>
                                <p className="text-xs text-muted-foreground">Précision: ~{Math.round(victimData.accuracy || 0)}m</p>
                            </div>
                            
                            {/* BOUTONS D'ACTION */}
                            <MapActions lat={victimData.lat!} lng={victimData.lng!} />

                            <Button variant="ghost" size="sm" onClick={() => { setVictimData(null); setCurrentId(null); setPhone(''); }} className="w-full mt-2">
                                <RefreshCw className="mr-2 h-3 w-3" /> Nouveau
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CARTE 2 : DÉCODEUR SMS */}
            <Card className="border-t-4 border-indigo-500 shadow-md bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" /> Méthode 2 : Décodeur
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* MODIFICATION ICI : Fond noir et texte blanc */}
                    <Textarea 
                        placeholder='Collez le SMS (ex: "URGENCE LOC: -4.22, 15.29...")' 
                        value={smsContent}
                        onChange={(e) => setSmsContent(e.target.value)}
                        className="min-h-[80px] text-sm bg-black text-white placeholder:text-gray-400 border-gray-700"
                    />
                    <Button onClick={handleParseSMS} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        <Search className="mr-2 w-4 h-4" /> Localiser Manuellement
                    </Button>

                    {manualLocation && (
                         <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg shadow-sm animate-in zoom-in-95">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="text-green-600 w-5 h-5" />
                                <span className="font-bold text-green-700 text-sm">Trouvé</span>
                                <span className="text-xs text-gray-500 ml-auto font-mono">{manualLocation.lat}, {manualLocation.lng}</span>
                            </div>
                            
                            {/* BOUTONS D'ACTION */}
                            <MapActions lat={manualLocation.lat} lng={manualLocation.lng} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* --- COLONNE DROITE : HISTORIQUE --- */}
        <div className="lg:col-span-2">
            <Card className="h-full border-t-4 border-gray-400">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5" /> Historique
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExportGeo}>
                        <Download className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Numéro</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((req) => (
                                    <TableRow key={req.id} className={currentId === req.id ? "bg-blue-50" : ""}>
                                        <TableCell className="text-xs">{format(new Date(req.created_at), "d MMM HH:mm", { locale: fr })}</TableCell>
                                        <TableCell className="font-medium text-xs">{req.phone_number}</TableCell>
                                        <TableCell>
                                            {req.status === 'located' ? <Badge className="bg-green-100 text-green-800">OK</Badge> : <Badge variant="outline">Attente</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" onClick={() => viewRequest(req)}>Voir</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default ManualLocate;
