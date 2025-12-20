import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  AlertTriangle, 
  Loader2, 
  Send, 
  ChevronLeft, 
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

const EMERGENCY_PHONE_NUMBER = "+242065119788";

const GeoLocate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États de l'application
  const [smsLink, setSmsLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'locating' | 'sms-ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // SÉCURITÉ : Réinitialiser les données au chargement du composant
  useEffect(() => {
    setStatus('idle');
    setSmsLink('');
    setErrorMsg('');
  }, [id]); // Se déclenche si l'ID change ou au premier montage

  const handleLocate = () => {
    setStatus('locating');
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg("La géolocalisation n'est pas supportée par cet appareil.");
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const precision = Math.round(accuracy);
        
        // Correction de l'URL Google Maps
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `URGENCE POMPIERS - Ma position : ${mapUrl} (Précision: ${precision}m). Réf: ${id || 'N/A'}`;
        
        const link = `sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`;
        
        setSmsLink(link);
        setStatus('sms-ready');
        toast.success("Position captée !");

        // Redirection auto vers SMS
        window.location.href = link;
      },
      (err) => {
        console.error("Erreur GPS:", err);
        setStatus('error');
        if (err.code === 1) setErrorMsg("Accès GPS refusé. Veuillez l'activer dans les réglages.");
        else if (err.code === 2) setErrorMsg("Signal GPS introuvable (essayez de sortir à l'extérieur).");
        else if (err.code === 3) setErrorMsg("Délai d'attente dépassé.");
        else setErrorMsg("Erreur technique de localisation.");
      },
      geoOptions
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Bouton Retour en haut à gauche */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Retour
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Décoration d'arrière-plan discrète */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center text-center">
          <div className="bg-red-500/20 p-4 rounded-2xl mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-1 uppercase">
            Alerte Secours
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Transmission de coordonnées GPS
          </p>

          {/* ÉTAT : INITIAL */}
          {status === 'idle' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Instructions</p>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Autorisez l'accès GPS si demandé.
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Le SMS s'ouvrira automatiquement.
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleLocate} 
                className="w-full bg-red-600 hover:bg-red-500 text-white h-20 rounded-2xl text-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                <MapPin className="mr-3 h-6 w-6" /> LOCALISER MOI
              </Button>
            </div>
          )}

          {/* ÉTAT : RECHERCHE EN COURS */}
          {status === 'locating' && (
            <div className="py-10 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping"></div>
                <Loader2 className="w-16 h-16 animate-spin text-red-500 relative z-10" />
              </div>
              <p className="mt-8 text-white font-medium animate-pulse">Calcul des coordonnées...</p>
              <p className="text-xs text-slate-500 mt-2 italic">Restez immobile à l'extérieur</p>
            </div>
          )}

          {/* ÉTAT : SMS PRÊT */}
          {status === 'sms-ready' && (
            <div className="w-full space-y-4 py-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-lg">
                <p className="text-emerald-500 font-bold text-sm uppercase">Position Verrouillée</p>
              </div>

              <a href={smsLink} className="block w-full">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 h-20 text-xl font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Send className="mr-3 w-6 h-6" /> ENVOYER LE SMS
                </Button>
              </a>

              <button 
                onClick={handleLocate}
                className="flex items-center justify-center w-full py-3 text-slate-400 text-sm hover:text-white transition-colors"
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> 
                Actualiser la position
              </button>
            </div>
          )}

          {/* ÉTAT : ERREUR */}
          {status === 'error' && (
            <div className="w-full py-4 animate-in zoom-in-95 duration-300">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-200 text-sm">{errorMsg}</p>
              </div>
              <Button 
                onClick={handleLocate} 
                variant="outline" 
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        Système d'Alerte Géolocalisé v2.0
      </p>
    </div>
  );
};

export default GeoLocate;
