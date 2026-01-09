import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  AlertTriangle, 
  Loader2, 
  Send, 
  ChevronLeft, 
  RefreshCcw,
  ShieldAlert,
  Satellite,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EMERGENCY_PHONE_NUMBER = "+242065119788";

// Niveaux de qualité du signal satellite
const getSignalQuality = (accuracy: number): { level: number; text: string; color: string } => {
  if (accuracy <= 10) return { level: 4, text: 'Excellent', color: 'text-emerald-500' };
  if (accuracy <= 30) return { level: 3, text: 'Bon', color: 'text-green-500' };
  if (accuracy <= 100) return { level: 2, text: 'Moyen', color: 'text-yellow-500' };
  return { level: 1, text: 'Faible', color: 'text-red-500' };
};

const GeoLocate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États de l'application
  const [smsLink, setSmsLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'locating' | 'sms-ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [attempts, setAttempts] = useState(0);
  
  const watchIdRef = useRef<number | null>(null);
  const bestPositionRef = useRef<GeolocationPosition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Détection mode hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // SÉCURITÉ : Réinitialiser les données au chargement du composant
  useEffect(() => {
    setStatus('idle');
    setSmsLink('');
    setErrorMsg('');
    setAccuracy(null);
    setCoordinates(null);
    setAttempts(0);
    bestPositionRef.current = null;
  }, [id]);

  const finalizeSMS = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc } = position.coords;
    const precision = Math.round(acc);
    
    // URL format compatible hors ligne (pas de dépendance réseau)
    const mapUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const message = `URGENCE POMPIERS - Ma position GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} - Carte: ${mapUrl} (Précision: ${precision}m). Réf: ${id || 'N/A'}`;
    
    const link = `sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`;
    
    setSmsLink(link);
    setStatus('sms-ready');
    setAccuracy(precision);
    setCoordinates({ lat: latitude, lng: longitude });
    
    toast.success(`Position captée ! Précision: ${precision}m`);

    // Tenter la mise à jour directe si en ligne
    if (!isOffline && id) {
      supabase
        .from('geo_requests')
        .update({
          lat: latitude,
          lng: longitude,
          accuracy: precision,
          status: 'located'
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.warn("Mise à jour BDD en temps réel échouée:", error);
          }
        });
    }

    // Redirection auto vers SMS (méthode principale et de secours)
    window.location.href = link;
  }, [id, isOffline]);

  const handleLocate = useCallback(() => {
    setStatus('locating');
    setErrorMsg("");
    setAttempts(0);
    bestPositionRef.current = null;

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg("La géolocalisation n'est pas supportée par cet appareil.");
      return;
    }

    // Nettoyer les anciens watchers
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Options optimisées pour GPS satellite (hors ligne)
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true, // Force le GPS satellite (pas WiFi/Cell)
      timeout: 60000,           // 60 secondes pour acquisition satellite
      maximumAge: 0             // Toujours une nouvelle position
    };

    // Utiliser watchPosition pour améliorer la précision progressivement
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setAttempts(prev => prev + 1);
        const currentAccuracy = position.coords.accuracy;
        setAccuracy(Math.round(currentAccuracy));
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });

        // Garder la meilleure position
        if (!bestPositionRef.current || currentAccuracy < bestPositionRef.current.coords.accuracy) {
          bestPositionRef.current = position;
        }

        // Si précision excellente (< 15m), finaliser immédiatement
        if (currentAccuracy <= 15) {
          navigator.geolocation.clearWatch(watchId);
          watchIdRef.current = null;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          finalizeSMS(position);
        }
      },
      (err) => {
        console.error("Erreur GPS:", err);
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Si on a une position, même imprécise, l'utiliser
        if (bestPositionRef.current) {
          finalizeSMS(bestPositionRef.current);
          return;
        }
        
        setStatus('error');
        if (err.code === 1) {
          setErrorMsg("Accès GPS refusé. Activez la localisation dans les paramètres de votre appareil.");
        } else if (err.code === 2) {
          setErrorMsg("Signal satellite introuvable. Sortez à l'extérieur avec une vue dégagée du ciel.");
        } else if (err.code === 3) {
          setErrorMsg("Délai dépassé. Assurez-vous d'être à l'extérieur avec une vue du ciel.");
        } else {
          setErrorMsg("Erreur technique de localisation.");
        }
      },
      geoOptions
    );

    watchIdRef.current = watchId;

    // Timeout de sécurité : après 45 secondes, utiliser la meilleure position disponible
    timeoutRef.current = setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (bestPositionRef.current) {
        finalizeSMS(bestPositionRef.current);
      } else if (status === 'locating') {
        setStatus('error');
        setErrorMsg("Impossible de capter le signal satellite. Essayez à l'extérieur.");
      }
    }, 45000);
  }, [finalizeSMS, status]);

  // Composant indicateur de signal satellite
  const SignalIndicator = ({ accuracy: acc }: { accuracy: number | null }) => {
    if (acc === null) return null;
    const quality = getSignalQuality(acc);
    
    return (
      <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg">
        <Satellite className={`w-5 h-5 ${quality.color}`} />
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-1.5 rounded-full transition-all ${
                level <= quality.level ? quality.color.replace('text-', 'bg-') : 'bg-slate-700'
              }`}
              style={{ height: `${8 + level * 4}px` }}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${quality.color}`}>
          {quality.text} ({acc}m)
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Indicateur hors ligne */}
      {isOffline && (
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium">
          <WifiOff className="w-4 h-4" />
          Mode Hors Ligne
        </div>
      )}

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
          <p className="text-slate-400 text-sm mb-2">
            Transmission de coordonnées GPS
          </p>
          
          {/* Indicateur mode hors ligne */}
          {isOffline && (
            <p className="text-amber-400 text-xs mb-4 flex items-center gap-1">
              <Satellite className="w-3 h-3" />
              GPS Satellite actif (fonctionne sans internet)
            </p>
          )}

          {/* ÉTAT : INITIAL */}
          {status === 'idle' && (
            <div className="w-full space-y-6 mt-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Instructions</p>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Autorisez l'accès GPS si demandé.
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Sortez à l'extérieur pour une meilleure réception.
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Le SMS s'ouvrira automatiquement.
                  </li>
                  <li className="flex items-start">
                    <span className="bg-emerald-500 h-2 w-2 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    Fonctionne sans connexion Internet.
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
            <div className="py-6 flex flex-col items-center w-full">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping"></div>
                <Loader2 className="w-16 h-16 animate-spin text-red-500 relative z-10" />
              </div>
              
              {/* Indicateur de signal en temps réel */}
              {accuracy !== null && <SignalIndicator accuracy={accuracy} />}
              
              <p className="mt-4 text-white font-medium animate-pulse">
                Recherche du signal satellite...
              </p>
              <p className="text-xs text-slate-500 mt-2 italic">
                {attempts > 0 ? `${attempts} lecture(s) - Amélioration en cours...` : 'Restez immobile à l\'extérieur'}
              </p>
              
              {coordinates && (
                <p className="text-xs text-slate-600 mt-2 font-mono">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              )}
              
              {/* Bouton pour forcer la finalisation */}
              {accuracy !== null && accuracy > 15 && (
                <button
                  onClick={() => bestPositionRef.current && finalizeSMS(bestPositionRef.current)}
                  className="mt-4 text-sm text-slate-400 hover:text-white underline"
                >
                  Utiliser la position actuelle ({accuracy}m)
                </button>
              )}
            </div>
          )}

          {/* ÉTAT : SMS PRÊT */}
          {status === 'sms-ready' && (
            <div className="w-full space-y-4 py-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-lg">
                <p className="text-emerald-500 font-bold text-sm uppercase">Position Verrouillée</p>
                {accuracy !== null && <SignalIndicator accuracy={accuracy} />}
              </div>
              
              {coordinates && (
                <div className="bg-slate-800/50 rounded-lg p-3 text-left">
                  <p className="text-xs text-slate-500 mb-1">Coordonnées GPS</p>
                  <p className="text-sm text-white font-mono">
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}

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
              
              <div className="bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50 mb-4">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Conseils GPS</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Allez à l'extérieur avec vue du ciel</li>
                  <li>• Éloignez-vous des bâtiments hauts</li>
                  <li>• Attendez 30 secondes immobile</li>
                  <li>• Activez la localisation haute précision</li>
                </ul>
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
        Système d'Alerte Géolocalisé v3.0 • GPS Satellite
      </p>
    </div>
  );
};

export default GeoLocate;
