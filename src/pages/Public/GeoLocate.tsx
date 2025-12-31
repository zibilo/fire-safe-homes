import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  ChevronLeft,
  ShieldAlert,
  Satellite,
  WifiOff,
  Navigation,
  Compass
} from 'lucide-react';

const GeoLocate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle' | 'locating'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  return (
    <div className="fixed inset-0 bg-[#050810] text-slate-100 overflow-hidden font-sans">

      {/* 🌌 GALAXY BACKGROUND */}
      <div className="absolute inset-0">
        <div className="absolute -top-1/3 -left-1/3 w-[70%] h-[70%] bg-indigo-600/20 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-30%] right-[-30%] w-[80%] h-[80%] bg-purple-700/20 blur-[200px] rounded-full" />
      </div>

      {/* HEADER */}
      <header className="safe-area-top flex items-center justify-between px-6 py-4 relative z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-slate-800/40 backdrop-blur border border-slate-700/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Système d’Alerte
          </p>
          <p className="text-xs text-red-500 font-bold flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Sécurisé
          </p>
        </div>

        <div className="w-10" />
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex items-center justify-center h-[80vh] px-6">
        <AnimatePresence mode="wait">

          {/* 🌠 IDLE */}
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm text-center"
            >

              {/* 🧭 COSMIC COMPASS */}
              <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">

                {/* ORBIT */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-slate-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
                />

                {/* ORBITING SILVER SPHERES */}
                {[Satellite, Navigation, ShieldAlert].map((Icon, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-xl flex items-center justify-center"
                    style={{ transformOrigin: '50% 130px' }}
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 14 + i * 6,
                      ease: 'linear'
                    }}
                  >
                    <Icon className="w-5 h-5 text-slate-800" />
                  </motion.div>
                ))}

                {/* CENTER COMPASS */}
                <motion.div
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 shadow-[0_0_80px_rgba(99,102,241,0.7)] flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                >
                  <Compass className="w-14 h-14 text-white" />
                </motion.div>
              </div>

              <h1 className="text-3xl font-black mb-4">
                Urgence <span className="text-indigo-400">GPS</span>
              </h1>

              <p className="text-slate-400 mb-10">
                Même au-delà des nuages,
                <br />
                la direction reste claire.
              </p>

              <Button
                onClick={() => setStatus('locating')}
                className="w-full h-20 rounded-[2rem] text-xl font-black bg-indigo-600 hover:bg-indigo-500 shadow-[0_20px_60px_rgba(99,102,241,0.5)]"
              >
                <MapPin className="mr-3 h-6 w-6" />
                LOCALISER
              </Button>
            </motion.div>
          )}

          {/* 🛰 LOCATING */}
          {status === 'locating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border border-indigo-400/20 rounded-full animate-ping" />
                <div className="w-28 h-28 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Navigation className="w-12 h-12 text-indigo-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl font-bold">Acquisition en cours…</h2>
              <p className="text-slate-500 italic mt-2">
                Le ciel vous guide.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="safe-area-bottom absolute bottom-6 w-full px-8 flex justify-between items-center text-[10px] opacity-40">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {isOffline ? 'Offline' : 'Online'}
        </div>
        <span>POMPIERS SERVICES • 2025</span>
      </footer>

      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default GeoLocate;
      
