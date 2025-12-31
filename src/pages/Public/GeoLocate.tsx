import { useState, useEffect, useRef, useCallback } from 'react';
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
  WifiOff,
  Zap,
  Navigation,
  Activity,
  Clock,
  Phone,
  Share2,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';

const EMERGENCY_PHONE_NUMBER = "+242065119788";

// Niveaux de qualité du signal satellite améliorés
const getSignalQuality = (accuracy: number): { level: number; text: string; color: string; icon: string } => {
  if (accuracy <= 10) return { level: 5, text: 'Excellent', color: 'text-emerald-400', icon: 'bg-emerald-500' };
  if (accuracy <= 30) return { level: 4, text: 'Très Bon', color: 'text-green-400', icon: 'bg-green-500' };
  if (accuracy <= 50) return { level: 3, text: 'Bon', color: 'text-lime-400', icon: 'bg-lime-500' };
  if (accuracy <= 100) return { level: 2, text: 'Moyen', color: 'text-yellow-400', icon: 'bg-yellow-500' };
  return { level: 1, text: 'Faible', color: 'text-orange-400', icon: 'bg-orange-500' };
};

const GeoLocate = () => {
  const [smsLink, setSmsLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'locating' | 'sms-ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [attempts, setAttempts] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const bestPositionRef = useRef<GeolocationPosition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Détection batterie
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Timer pour le temps écoulé
  useEffect(() => {
    if (status === 'locating') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

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

  // Nettoyage
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const finalizeSMS = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc, altitude: alt, speed: spd, heading: hdg } = position.coords;
    const precision = Math.round(acc);
    
    const mapUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    let message = `🚨 URGENCE POMPIERS
📍 GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
🎯 Précision: ${precision}m`;
    
    if (alt) message += `
⛰️ Altitude: ${Math.round(alt)}m`;
    if (spd && spd > 0) message += `
🚗 Vitesse: ${Math.round(spd * 3.6)}km/h`;
    
    message += `
🗺️ Carte: ${mapUrl}
⏰ ${new Date().toLocaleTimeString('fr-FR')}`;
    
    const link = `sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`;
    
    setSmsLink(link);
    setStatus('sms-ready');
    setAccuracy(precision);
    setCoordinates({ lat: latitude, lng: longitude });
    setAltitude(alt);
    setSpeed(spd);
    setHeading(hdg);
    
    // Vibration de succès
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Notification sonore (si autorisée)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {}

    setTimeout(() => {
      window.location.href = link;
    }, 500);
  }, []);

  const handleLocate = useCallback(() => {
    setStatus('locating');
    setErrorMsg("");
    setAttempts(0);
    setElapsedTime(0);
    bestPositionRef.current = null;

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg("La géolocalisation n'est pas supportée par cet appareil.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 60000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setAttempts(prev => prev + 1);
        const currentAccuracy = position.coords.accuracy;
        setAccuracy(Math.round(currentAccuracy));
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setAltitude(position.coords.altitude);
        setSpeed(position.coords.speed);
        setHeading(position.coords.heading);

        if (!bestPositionRef.current || currentAccuracy < bestPositionRef.current.coords.accuracy) {
          bestPositionRef.current = position;
        }

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
        
        if (bestPositionRef.current) {
          finalizeSMS(bestPositionRef.current);
          return;
        }
        
        setStatus('error');
        if (err.code === 1) {
          setErrorMsg("Accès GPS refusé. Activez la localisation dans les paramètres.");
        } else if (err.code === 2) {
          setErrorMsg("Signal satellite introuvable. Sortez à l'extérieur.");
        } else if (err.code === 3) {
          setErrorMsg("Délai dépassé. Positionnez-vous à l'extérieur.");
        } else {
          setErrorMsg("Erreur technique de localisation.");
        }
      },
      geoOptions
    );

    watchIdRef.current = watchId;

    timeoutRef.current = setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (bestPositionRef.current) {
        finalizeSMS(bestPositionRef.current);
      } else if (status === 'locating') {
        setStatus('error');
        setErrorMsg("Impossible de capter le signal satellite.");
      }
    }, 45000);
  }, [finalizeSMS, status]);

  const copyCoordinates = () => {
    if (coordinates) {
      const text = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLocation = async () => {
    if (coordinates && navigator.share) {
      try {
        await navigator.share({
          title: 'Ma Position GPS',
          text: `Coordonnées: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
          url: `https://www.google.com/maps?q=${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`
        });
      } catch (err) {
        console.error('Erreur de partage:', err);
      }
    }
  };

  const SignalIndicator = ({ accuracy: acc }: { accuracy: number | null }) => {
    if (acc === null) return null;
    const quality = getSignalQuality(acc);
    
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/50">
        <div className="relative">
          <Satellite className={`w-6 h-6 ${quality.color}`} />
          <div className={`absolute -top-1 -right-1 w-2 h-2 ${quality.icon} rounded-full animate-pulse`}></div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                level <= quality.level ? quality.icon : 'bg-slate-700'
              }`}
              style={{ height: `${6 + level * 3}px` }}
            />
          ))}
        </div>
        <div className="flex-1">
          <span className={`text-sm font-bold ${quality.color}`}>
            {quality.text}
          </span>
          <p className="text-xs text-slate-500">±{acc}m</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animations d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header avec statuts */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-start px-4 z-10">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all hover:bg-slate-800 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div className="flex gap-2">
          {isOffline && (
            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm text-amber-400 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/30">
              <WifiOff className="w-4 h-4" />
              Hors Ligne
            </div>
          )}
          {batteryLevel !== null && (
            <div className={`flex items-center gap-2 backdrop-blur-sm px-3 py-2 rounded-xl text-xs font-bold border ${
              batteryLevel > 20 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              <Zap className="w-4 h-4" />
              {batteryLevel}%
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-slate-900/90 to-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-600/30 rounded-2xl blur-xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-5 rounded-2xl shadow-lg">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Alerte Secours
          </h1>
          <p className="text-slate-400 text-sm mb-1">
            Transmission GPS Ultra-Précise
          </p>
          
          {isOffline && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs mt-2 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Satellite className="w-3 h-3" />
              GPS Satellite Autonome Actif
            </div>
          )}

          {/* ÉTAT : INITIAL */}
          {status === 'idle' && (
            <div className="w-full space-y-5 mt-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-5 text-left border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">Protocole d'Urgence</p>
                </div>
                <ul className="text-sm text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-3">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                    <span>Autorisez l'accès GPS haute précision</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                    <span>Positionnez-vous à l'extérieur (vue dégagée du ciel)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-red-500 h-2 w-2 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                    <span>Le SMS d'urgence s'ouvrira automatiquement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-emerald-500 h-2 w-2 rounded-full mt-1.5 shrink-0 animate-pulse"></span>
                    <span><strong>Fonctionne sans Internet</strong> (GPS satellite)</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleLocate} 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white h-24 rounded-2xl text-xl font-black transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-red-500/50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <MapPin className="mr-3 h-7 w-7" /> 
                <span>LOCALISER MOI</span>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                <span>Numéro d'urgence: {EMERGENCY_PHONE_NUMBER}</span>
              </div>
            </div>
          )}

          {/* ÉTAT : RECHERCHE EN COURS */}
          {status === 'locating' && (
            <div className="py-8 flex flex-col items-center w-full space-y-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-600/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-red-600/20 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-full border-4 border-red-500/30">
                  <Loader2 className="w-16 h-16 animate-spin text-red-500" />
                </div>
              </div>
              
              {accuracy !== null && <SignalIndicator accuracy={accuracy} />}
              
              <div className="space-y-2 w-full">
                <p className="text-white font-bold text-lg animate-pulse">
                  Recherche du signal satellite...
                </p>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Navigation className="w-4 h-4" />
                    <span>{attempts} lecture(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{elapsedTime}s</span>
                  </div>
                </div>
              </div>
              
              {coordinates && (
                <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Position en cours</p>
                  <p className="text-sm text-white font-mono">
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                  {altitude && (
                    <p className="text-xs text-slate-400 mt-1">Altitude: {Math.round(altitude)}m</p>
                  )}
                </div>
              )}
              
              {accuracy !== null && accuracy > 15 && (
                <button
                  onClick={() => bestPositionRef.current && finalizeSMS(bestPositionRef.current)}
                  className="text-sm text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Utiliser la position actuelle ({accuracy}m)
                </button>
              )}
            </div>
          )}

          {/* ÉTAT : SMS PRÊT */}
          {status === 'sms-ready' && (
            <div className="w-full space-y-4 py-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 py-4 px-5 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400 font-black text-sm uppercase tracking-wide">Position Verrouillée</p>
                </div>
                {accuracy !== null && <SignalIndicator accuracy={accuracy} />}
              </div>
              
              {coordinates && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-4 text-left border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Coordonnées GPS</p>
                    <div className="flex gap-2">
                      <button
                        onClick={copyCoordinates}
                        className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Copier"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      {navigator.share && (
                        <button
                          onClick={shareLocation}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Partager"
                        >
                          <Share2 className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-base text-white font-mono mb-2">
                    {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {altitude && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>⛰️ Altitude:</span>
                        <span className="text-white font-medium">{Math.round(altitude)}m</span>
                      </div>
                    )}
                    {speed !== null && speed > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>🚗 Vitesse:</span>
                        <span className="text-white font-medium">{Math.round(speed * 3.6)}km/h</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <a href={smsLink} className="block w-full">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 h-24 text-xl font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-500/50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <Send className="mr-3 w-7 h-7" /> 
                  <span>ENVOYER LE SMS</span>
                </Button>
              </a>

              <button 
                onClick={handleLocate}
                className="flex items-center justify-center w-full py-3 text-slate-400 text-sm hover:text-white transition-colors group"
              >
                <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" /> 
                Actualiser la position
              </button>
            </div>
          )}

          {/* ÉTAT : ERREUR */}
          {status === 'error' && (
            <div className="w-full py-6 animate-in zoom-in-95 duration-300 space-y-4">
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 p-5 rounded-2xl backdrop-blur-sm">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-200 text-sm leading-relaxed">{errorMsg}</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-5 text-left border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Satellite className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">Optimisation GPS</p>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>Sortez à l'extérieur avec vue dégagée du ciel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>Éloignez-vous des bâtiments et arbres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>Restez immobile pendant 30-60 secondes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">4.</span>
                    <span>Vérifiez que la localisation haute précision est activée</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={handleLocate} 
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white h-16 rounded-2xl font-bold transition-all"
              >
                <RefreshCcw className="mr-2 w-5 h-5" />
                Réessayer la Localisation
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center space-y-1">
        <p className="text-slate-600 text-[10px] uppercase tracking-widest font-black">
          Système d'Alerte Géolocalisé Pro v4.0
        </p>
        <p className="text-slate-700 text-[9px] tracking-wide">
          GPS Satellite • Mode Autonome • Précision Maximale
        </p>
      </div>
    </div>
  );
};

export default GeoLocate;
