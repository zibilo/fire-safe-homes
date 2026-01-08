import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Shield, MapPin, Plus, Volume2, PhoneCall, Home as HomeIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MobileNav from "@/components/Layout/MobileNav";

export default function Home() {
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showCall, setShowCall] = useState(false);

  const audioRefFr = useRef(new Audio("/1/1.wav"));
  const audioRefLn = useRef(new Audio("/2/2.wav"));

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowCall(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const stopAllAudio = () => {
    audioRefFr.current.pause();
    audioRefFr.current.currentTime = 0;
    audioRefLn.current.pause();
    audioRefLn.current.currentTime = 0;
    setCurrentlyPlaying(null);
  };

  const playAudio = (lang: string) => {
    stopAllAudio();
    const audio = lang === "fr" ? audioRefFr.current : audioRefLn.current;
    audio.play()
      .then(() => {
        setCurrentlyPlaying(lang);
        audio.onended = () => setCurrentlyPlaying(null);
      })
      .catch(console.error);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32 relative z-10">
        
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
          >
            <Shield className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Centre de Secours
          </h1>
          <p className="text-muted-foreground text-sm">
            Intervention pompiers prioritaire
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-xs space-y-4"
        >
          {/* Emergency button */}
          <Link to="/loc/urgence" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-lg shadow-primary/25 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span>Urgence</span>
            </motion.button>
          </Link>

          {/* Property button */}
          <Link to="/register-house" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-card hover:bg-accent border border-border text-foreground rounded-2xl font-medium flex items-center justify-center gap-3 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Plus className="w-4 h-4 text-primary" />
                <HomeIcon className="w-5 h-5 text-primary" />
              </div>
              <span>Enregistrer ma propriété</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Audio help toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <button
            onClick={() => {
              if (isAudioOpen) stopAllAudio();
              setIsAudioOpen(!isAudioOpen);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground text-sm transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Aide vocale</span>
          </button>

          <AnimatePresence>
            {isAudioOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-3 flex flex-col items-center gap-2"
              >
                <button
                  onClick={() => playAudio("fr")}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    currentlyPlaying === "fr" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => playAudio("ln")}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    currentlyPlaying === "ln" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  🇨🇬 Lingala
                </button>
                {currentlyPlaying && (
                  <button
                    onClick={stopAllAudio}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Arrêter
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Floating call button */}
      <AnimatePresence>
        {showCall && (
          <motion.a
            href="tel:118"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-28 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30 z-50"
          >
            <PhoneCall className="w-6 h-6 text-primary-foreground" />
          </motion.a>
        )}
      </AnimatePresence>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}
