import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  ChevronLeft,
  Satellite,
  Navigation,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const EMERGENCY_PHONE_NUMBER = '+242065119788';

type Status = 'idle' | 'locating' | 'sms-ready' | 'error';

const GeoLocate = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);

  /* 🔊 VOIX IA (OFFLINE) */
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  /* 🧭 ORIENTATION RÉELLE (BOUSSOLE) */
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setHeading(360 - event.alpha);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  /* 📡 GPS */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS non supporté');
      return;
    }

    speak('Position en cours. Veuillez patienter.');
    setStatus('locating');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(accuracy));

        /* ✅ GPS BON */
        if (accuracy <= 35) {
          navigator.geolocation.clearWatch(watchIdRef.current!);
          setStatus('sms-ready');
          speak('Position acquise avec précision.');
          toast.success('GPS précis');
        }
      },
      () => {
        setStatus('error');
        speak('Erreur de localisation.');
        toast.error('Erreur GPS');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, []);

  /* ⚠️ FALLBACK GPS FAIBLE */
  useEffect(() => {
    if (status === 'locating' && accuracy && accuracy > 100) {
      speak('Signal GPS faible. Restez à découvert.');
    }
  }, [accuracy, status]);

  /* 📩 ENVOI SMS */
  const sendSMS = () => {
    if (!coords) return;

    const message = `
🚨 URGENCE GPS 🚨
Latitude: ${coords.lat}
Longitude: ${coords.lng}
Précision: ${accuracy} m
Google Maps:
https://maps.google.com/?q=${coords.lat},${coords.lng}
    `.trim();

    window.location.href = `sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 bg-[#050810] text-white overflow-hidden font-sans">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0">
        <div className="absolute -top-1/3 -left-1/3 w-[70%] h-[70%] bg-indigo-600/20 blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[-30%] w-[80%] h-[80%] bg-purple-700/20 blur-[200px]" />
      </div>

      {/* HEADER */}
      <header className="safe-area-top flex justify-between items-center px-6 py-4 relative z-50">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft />
        </button>
        <span className="text-xs tracking-widest text-slate-400">SYSTÈME D’URGENCE</span>
        <div />
      </header>

      <main className="relative z-10 flex items-center justify-center h-[80vh] px-6">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {status === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">

                {/* ORBIT */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-slate-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
                />

                {/* COMET SPHERES */}
                {[Satellite, Navigation].map((Icon, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center"
                    style={{ transformOrigin: '50% 130px' }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 16 + i * 6, ease: 'linear' }}
                  >
                    <Icon className="text-slate-800 w-5 h-5" />
                  </motion.div>
                ))}

                {/* 🧭 BOUSSOLE RÉELLE */}
                <motion.div
                  style={{ rotate: heading }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl"
                >
                  <Compass className="w-14 h-14 text-white" />
                </motion.div>
              </div>

              <Button onClick={handleLocate} className="w-full h-20 text-xl rounded-3xl">
                <MapPin className="mr-3" /> LOCALISER
              </Button>
            </motion.div>
          )}

          {/* LOCATING */}
          {status === 'locating' && (
            <motion.div className="text-center">
              <Navigation className="mx-auto w-16 h-16 animate-pulse text-indigo-400" />
              <p className="mt-4">Acquisition GPS…</p>
              <p className="text-slate-400 text-sm mt-2">
                Précision : {accuracy ?? '--'} m
              </p>
            </motion.div>
          )}

          {/* SMS READY */}
          {status === 'sms-ready' && (
            <motion.div className="text-center">
              <AlertTriangle className="mx-auto w-16 h-16 text-emerald-400" />
              <p className="mt-4 font-bold">Position prête</p>
              <Button onClick={sendSMS} className="mt-6 w-full h-16 rounded-2xl">
                Envoyer SMS d’urgence
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
};

export default GeoLocate;

