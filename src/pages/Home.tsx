import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { Shield, MapPin, Plus, Volume2, PhoneCall, Home as HomeIcon, X, Mic2 } from "lucide-react";
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
    // "h-screen overflow-hidden" empêche le scroll inutile et force tout à tenir dans l'écran
    <div className="h-screen w-full bg-[#F8F9FA] text-[#1D1D1F] flex flex-col overflow-hidden font-sans">
      
      {/* Header compact */}
      <header className="pt-8 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          <span className="font-bold text-xs uppercase tracking-widest opacity-50">Urgence 242</span>
        </div>
        <button 
          onClick={() => setIsAudioOpen(!isAudioOpen)}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600"
        >
          {isAudioOpen ? <X className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content - Flex grow pour occuper l'espace central */}
      <main className="flex-1 flex flex-col justify-center px-6 gap-6">
        
        <section>
          <h1 className="text-3xl font-extrabold tracking-tight">Centre de Secours</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Appuyez sur le bouton rouge en cas d'urgence.</p>
        </section>

        {/* Grille de boutons principale */}
        <div className="space-y-4">
          <Link to="/loc/urgence" className="block">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-red-600 h-28 rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-red-200"
            >
              <div className="text-white">
                <span className="text-xs font-bold uppercase opacity-80 block mb-1">Action immédiate</span>
                <h2 className="text-2xl font-black">URGENCE</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <MapPin className="text-white w-8 h-8" />
              </div>
            </motion.div>
          </Link>

          <Link to="/register-house" className="block">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white border border-gray-100 h-20 rounded-3xl px-6 flex items-center gap-4 shadow-sm"
            >
              <div className="bg-gray-50 p-2 rounded-xl">
                <HomeIcon className="text-gray-400 w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-700">Ma Propriété</span>
              <Plus className="ml-auto text-gray-300 w-5 h-5" />
            </motion.div>
          </Link>
        </div>

        {/* Aide Vocale intégrée (ne masque rien) */}
        <AnimatePresence>
          {isAudioOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-100/50 rounded-2xl p-2 flex gap-2 overflow-hidden"
            >
              <button 
                onClick={() => playAudio("fr")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${currentlyPlaying === 'fr' ? 'bg-black text-white' : 'bg-white'}`}
              >
                FRANÇAIS
              </button>
              <button 
                onClick={() => playAudio("ln")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${currentlyPlaying === 'ln' ? 'bg-black text-white' : 'bg-white'}`}
              >
                LINGALA
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer fixe pour le bouton 118 - Toujours visible et accessible */}
      <footer className="p-6 bg-white border-t border-gray-50">
        <motion.a
          href="tel:118"
          whileTap={{ scale: 0.95 }}
          className="w-full bg-[#1D1D1F] text-white h-16 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
        >
          <div className="bg-red-500 p-1.5 rounded-full animate-pulse">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg">Appeler le 118</span>
        </motion.a>
      </footer>
    </div>
  );
}
