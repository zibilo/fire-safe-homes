import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Download, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- Icônes ---
const getIcon = (status: string) => {
    const color = status === 'functional' ? '#22c55e' : '#ef4444';
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`;
    return L.divIcon({ className: 'custom-marker', html: svgIcon, iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -40] });
};

// --- Composant pour recadrer la carte automatiquement ---
function AutoZoom({ markers }: { markers: any[] }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50] }); // Ajoute une petite marge
        }
    }, [markers, map]);
    return null;
}

const FireHydrantMap = () => {
  const [hydrants, setHydrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
        const { data } = await supabase.from('view_hydrants_map').select('*');
        if (data) setHydrants(data);
        setLoading(false);
    };
    fetch();
  }, []);

  const openInMaps = (lat: number, lng: number) => {
    window.open(`geo:${lat},${lng}?q=${lat},${lng}`, '_blank');
  };

  const handleExportKML = () => {
     // ... (gardez votre code export KML précédent ici si vous l'utilisez)
     // Pour simplifier l'exemple je ne le remets pas, mais il est compatible
  };

  if (loading) return <div className="h-[500px] flex items-center justify-center bg-gray-100"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
        {/* En-tête de la carte */}
        <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border">
            <span className="text-sm font-medium pl-2">{hydrants.length} points répertoriés</span>
            {/* Vous pouvez remettre le bouton export ici */}
        </div>

        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm relative z-0">
            <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* 🎯 Zoom automatique sur vos données */}
                <AutoZoom markers={hydrants} />

                {hydrants.map((point) => (
                    (point.lat && point.lng) && (
                        <Marker key={point.id} position={[point.lat, point.lng]} icon={getIcon(point.status)}>
                            <Popup>
                                <div className="min-w-[180px]">
                                    <h3 className="font-bold text-base mb-1">{point.matricule}</h3>
                                    <div className="text-sm text-gray-600 mb-2 space-y-1">
                                        <p><strong>Ville:</strong> {point.city}, {point.district}</p>
                                        {(point.avenue || point.alley) && (
                                            <p>{point.avenue} {point.alley}</p>
                                        )}
                                        {point.details && <p className="italic text-xs border-t pt-1 mt-1">{point.details}</p>}
                                    </div>
                                    <Button size="sm" className="w-full mt-2 bg-blue-600" onClick={() => openInMaps(point.lat, point.lng)}>
                                        <Navigation className="w-3 h-3 mr-2" /> Y aller
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    </div>
  );
};

export default FireHydrantMap;