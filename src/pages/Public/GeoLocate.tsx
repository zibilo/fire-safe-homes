import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Pour des animations fluides
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
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

const EMERGENCY_PHONE_NUMBER = "+242065119788";

const getSignalQuality = (accuracy: number) => {
  if (accuracy <= 15) return { level: 4, text: 'Précis (GPS)', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  if (accuracy <= 35) return { level: 3, text: 'Bon', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  if (accuracy <= 100) return { level: 2, text: 'Moyen', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  return { level: 1, text: 'Faible', color: 'text-red-400', bg: 'bg-red-500/20' };
};

const GeoLocate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'idle' | 'locating' | 'sms-ready' | 'error'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Reste de la logique interne (inchangée car déjà robuste)
  // ... [Insérer ici votre logique handleLocate et finalizeSMS] ...

  return (
    <div className="fixed inset-0 bg-[#050810] text-slate-100 selection:bg-red-500/30 overflow-hidden font-sans">
      
      {/* Background Decor: Effets de lumières galactiques dynamiques */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-red-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />

      {/* Header Bar: Style iOS/Android */}
      <header className="safe-area-top flex items-center justify-between px-6 py-4 relative z-50">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full bg-slate-800/40 border border-slate-700/50 backdrop-blur-md active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-slate-300" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Système d'Alerte</span>
          <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> SÉCURISÉ
          </span>
        </div>
        <div className="w-10" /> {/* Spacer pour l'équilibre */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10 h-[80vh]">
        
        <AnimatePresence mode="wait">
          {/* ÉCRAN D'ACCUEIL (IDLE) */}
          {status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900/40">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
              </div>

              <h1 className="text-3xl font-black text-center mb-4 tracking-tight uppercase italic">
                Urgence <span className="text-red-500">GPS</span>
              </h1>
              
              <div className="grid grid-cols-2 gap-3 mb-10 w-full">
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                  <Satellite className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-[11px] text-slate-400 leading-tight">Capteur Satellite Haute Précision</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                  <WifiOff className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-[11px] text-slate-400 leading-tight">Fonctionne sans réseau Internet</p>
                </div>
              </div>

              <Button 
                onClick={() => setStatus('locating')} // Exemple déclencheur
                className="w-full h-20 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] text-xl font-black shadow-[0_20px_50px_rgba(220,38,38,0.3)] active:scale-95 transition-all"
              >
                <MapPin className="mr-3 h-6 w-6" /> LOCALISER
              </Button>
            </motion.div>
          )}

          {/* ÉCRAN LOCALISATION (LOCATING) */}
          {status === 'locating' && (
            <motion.div 
              key="locating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                {/* Radar d'acquisition */}
                <div className="absolute inset-0 border-2 border-red-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                <div className="absolute inset-4 border border-red-500/40 rounded-full animate-[ping_2s_linear_infinite]" />
                <div className="w-32 h-32 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center z-10 shadow-inner">
                  <Navigation className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold tracking-wide">Acquisition en cours...</h2>
                <p className="text-slate-500 text-sm italic">Restez à découvert face au ciel</p>
              </div>

              {/* Barre de progression/précision */}
              <div className="mt-12 w-full max-w-xs bg-slate-900/80 p-4 rounded-3xl border border-slate-800 backdrop-blur-xl">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Qualité Signal</span>
                    <span className="text-xs font-mono text-emerald-400">{accuracy || '--'}m</span>
                 </div>
                 <div className="flex gap-1.5 h-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`flex-1 rounded-full ${accuracy && i <= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer d'information professionnel */}
      <footer className="safe-area-bottom absolute bottom-8 w-full px-8 flex justify-between items-center opacity-40">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-bold tracking-tighter uppercase">{isOffline ? 'Offline' : 'Online'}</span>
        </div>
        <span className="text-[10px] font-medium">POMPIERS SERVICES • 2025</span>
      </footer>

      {/* Styles specifiques pour Capacitor/Ionic safe areas */}
      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes ping {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GeoLocate;
