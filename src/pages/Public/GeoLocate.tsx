import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, AlertTriangle, Loader2, MessageSquare, Send, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const EMERGENCY_PHONE_NUMBER = "+242061234567"; 

const GeoLocate = () => {
  const { id } = useParams();
  const [smsLink, setSmsLink] = useState(''); 
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error' | 'sms-fallback'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLocate = () => {
    setStatus('locating');
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }

    // --- CONFIGURATION CRITIQUE POUR LE HORS LIGNE ---
    // Si on est hors ligne, on accepte une vieille position (cache) pour aller vite.
    // Si on est en ligne, on essaie d'avoir une position fraîche.
    const isOffline = !navigator.onLine;
    
    const geoOptions = { 
        enableHighAccuracy: !isOffline, // Haute précision seulement si internet dispo
        timeout: 20000, // On laisse 20 secondes au GPS (le matériel est lent sans 4G)
        maximumAge: isOffline ? Infinity : 0 // Hors ligne ? Prends n'importe quelle position mémorisée
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // 1. DÉTECTION HORS LIGNE APRÈS OBTENTION GPS
        if (!navigator.onLine) {
            console.log("GPS obtenu mais appareil hors ligne -> SMS");
            triggerSMSFallback(latitude, longitude, accuracy);
            return;
        }

        try {
          // 2. TENTATIVE ENVOI INTERNET (Timeout court de 3s)
          const rpcPromise = supabase.rpc('update_victim_location', {
            request_id: id,
            lat: latitude,
            lng: longitude,
            acc: accuracy
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );

          const { error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

          if (error) throw error;
          
          setStatus('success');
          toast.success("Position transmise !");

        } catch (err) {
            // 3. ECHEC INTERNET -> BASCULE SMS
            console.warn("Échec internet, bascule SMS", err);
            triggerSMSFallback(latitude, longitude, accuracy);
        }
      },
      (err) => {
        console.error("Erreur GPS:", err);
        // Si erreur et qu'on était en haute précision, on peut réessayer en basse précision (optionnel)
        setStatus('error');
        if (err.code === 1) setErrorMsg("Vous devez autoriser la localisation.");
        else if (err.code === 2) setErrorMsg("Signal GPS introuvable. Sortez à l'extérieur.");
        else if (err.code === 3) setErrorMsg("Le GPS met trop de temps à répondre.");
        else setErrorMsg("Erreur de localisation.");
      },
      geoOptions
    );
  };

  const triggerSMSFallback = (lat: number, lng: number, acc: number) => {
    const precision = Math.round(acc);
    const message = `URGENCE: ${lat},${lng} (Précision:${precision}m). ID:${id}`;
    
    // Format universel
    const link = `sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`;
    
    setSmsLink(link);
    setStatus('sms-fallback');
    
    toast.info("Connexion absente : Mode SMS activé");

    // TENTATIVE DE REDIRECTION FORCEE
    // On utilise window.location.assign qui passe parfois mieux que href
    setTimeout(() => {
        try {
            window.location.assign(link);
        } catch (e) {
            console.log("Redirection auto bloquée par le navigateur (normal hors ligne)");
        }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border-t-4 border-red-600">
        <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
                <Smartphone className="w-8 h-8 text-red-600" />
            </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">URGENCE POMPIERS</h1>
        
        {status === 'idle' && (
          <>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm text-left border border-blue-100">
              <p className="font-semibold mb-1">Instruction :</p>
              1. Cliquez sur le bouton rouge.<br/>
              2. Autorisez la localisation.<br/>
              3. Si l'app SMS s'ouvre, envoyez le message.
            </div>
            <Button 
                onClick={handleLocate} 
                size="lg" 
                className="w-full bg-red-600 hover:bg-red-700 text-lg h-16 shadow-lg shadow-red-200 animate-pulse font-bold"
            >
              <MapPin className="mr-2 h-6 w-6" /> LOCALISER & ENVOYER
            </Button>
          </>
        )}

        {status === 'locating' && (
          <div className="py-8 bg-gray-50 rounded-lg border border-gray-100">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-800">Recherche GPS...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre jusqu'à 20 secondes hors ligne.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800">Reçu !</h2>
            <p className="text-green-700 mt-2 text-sm">Position transmise via Internet.</p>
          </div>
        )}

        {/* --- MODE SMS (HORS LIGNE) --- */}
        {status === 'sms-fallback' && (
          <div className="py-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 font-bold flex items-center justify-center gap-2">
                   <MessageSquare className="h-4 w-4"/> Pas d'internet détecté
                </p>
            </div>

            <p className="text-gray-900 font-bold text-lg mb-4">
              Cliquez pour envoyer le SMS :
            </p>

            {/* Ce lien est crucial car l'auto-redirect est bloqué par les navigateurs mobiles hors ligne */}
            <a href={smsLink} className="block w-full no-underline">
                <Button className="w-full bg-green-600 hover:bg-green-700 h-20 text-xl font-bold shadow-xl shadow-green-200 border-2 border-green-500">
                    <Send className="mr-3 w-8 h-8" /> 
                    ENVOYER SMS
                </Button>
            </a>

            <p className="text-xs text-gray-400 mt-4 px-2">
               Une fois dans les messages, appuyez sur la flèche d'envoi.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-red-700 mb-2">Échec GPS</h3>
            <p className="text-red-600 text-sm mb-6 px-4">{errorMsg}</p>
            <Button onClick={handleLocate} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                Réessayer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoLocate;
