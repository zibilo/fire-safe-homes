import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Shield, MapPin, Plus, Volume2, PhoneCall, Home as HomeIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const audioRefFr = useRef(new Audio("/1/1.wav"));
  const audioRefLn = useRef(new Audio("/2/2.wav"));

  const stopAllAudio = () => {
    [audioRefFr, audioRefLn].forEach(ref => {
      ref.current.pause();
      ref.current.currentTime = 0;
    });
    setCurrentlyPlaying(null);
  };

  const playAudio = (lang: string) => {
    stopAllAudio();
    const audio = lang === "fr" ? audioRefFr.current : audioRefLn.current;
    audio.play().then(() => {
      setCurrentlyPlaying(lang);
      audio.onended = () => setCurrentlyPlaying(null);
    }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-primary/10">
      
      {/* Top Bar Discrète */}
      <nav className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>
          <span className="font-semibold tracking-tight text-sm uppercase">Secours App</span>
        </div>
        <button 
          onClick={() => setIsAudioOpen(!isAudioOpen)}
          className={`p-2 rounded-full transition-all ${isAudioOpen ? 'bg-primary text-white' : 'bg-secondary'}`}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </nav>

      <main className="max-w-md mx-auto px-8 pt-12 pb-24 flex flex-col min-h-[80vh]">
        
        {/* Hero Section Ultra-Minimal */}
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight leading-tight"
          >
            Comment pouvons-nous <br/>
            <span className="text-primary">vous aider ?</span>
          </motion.h1>
          <p className="mt-4 text-gray-500 font-medium">Intervention rapide 24h/7j</p>
        </header>

        {/* Actions Principales */}
        <div className="grid gap-4 w-full">
          <Link to="/loc/urgence">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden p-6 rounded-[2rem] bg-primary text-white shadow-2xl shadow-primary/20 group"
            >
              <div className="relative z-10 flex flex-col h-32 justify-between">
                <MapPin className="w-8 h-8 opacity-80" />
                <div>
                  <h2 className="text-xl font-bold italic">URGENCE</h2>
                  <p className="text-sm opacity-80">Signaler un incident immédiat</p>
                </div>
              </div>
              {/* Effet de lumière en arrière-plan */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
            </motion.div>
          </Link>

          <Link to="/register-house">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="p-6 rounded-[2rem] bg-white border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ma Propriété</h3>
                  <p className="text-xs text-gray-400 font-medium">Enregistrer mon adresse</p>
                </div>
              </div>
              <Plus className="w-5 h-5 text-gray-300" />
            </motion.div>
          </Link>
        </div>

        {/* Aide Vocale Pop-up (Glassmorphism) */}
        <AnimatePresence>
          {isAudioOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-6 right-6 p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl z-50 flex items-center justify-around"
            >
              <button 
                onClick={() => playAudio("fr")}
                className={`flex flex-col items-center gap-1 transition-opacity ${currentlyPlaying === 'ln' ? 'opacity-40' : 'opacity-100'}`}
              >
                <span className="text-2xl">🇫🇷</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Français</span>
                {currentlyPlaying === 'fr' && <motion.div layoutId="dot" className="w-1 h-1 bg-primary rounded-full" />}
              </button>

              <div className="w-[1px] h-8 bg-gray-200" />

              <button 
                onClick={() => playAudio("ln")}
                className={`flex flex-col items-center gap-1 transition-opacity ${currentlyPlaying === 'fr' ? 'opacity-40' : 'opacity-100'}`}
              >
                <span className="text-2xl">🇨🇬</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lingala</span>
                {currentlyPlaying === 'ln' && <motion.div layoutId="dot" className="w-1 h-1 bg-primary rounded-full" />}
              </button>

              <button onClick={stopAllAudio} className="p-2 bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Appel Rapide - Floating Action Button Minimaliste */}
      <motion.a
        href="tel:118"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#1D1D1F] rounded-full flex items-center justify-center shadow-xl z-40"
      >
        <PhoneCall className="w-6 h-6 text-white" />
      </motion.a>
    </div>
  );
}
