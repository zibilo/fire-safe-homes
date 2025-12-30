import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  MapPin,
  Plus,
  HelpCircle,
  Volume2,
  PhoneCall,
  HomeIcon,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showCallButton, setShowCallButton] = useState(false);

  const audioRefFr = useRef(new Audio("/1/1.wav"));
  const audioRefLn = useRef(new Audio("/2/2.wav"));
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    if (isAudioWidgetOpen) setIsMenuVisible(true);
    else {
      const t = setTimeout(() => setIsMenuVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [isAudioWidgetOpen]);

  useEffect(() => {
    const t = setTimeout(() => setShowCallButton(true), 700);
    return () => clearTimeout(t);
  }, []);

  const stopAllAudio = () => {
    audioRefFr.current.pause();
    audioRefLn.current.pause();
    audioRefFr.current.currentTime = 0;
    audioRefLn.current.currentTime = 0;
    setCurrentlyPlaying(null);
  };

  const playAudio = (lang: "fr" | "ln") => {
    stopAllAudio();
    const audio = lang === "fr" ? audioRefFr.current : audioRefLn.current;
    audio.play().then(() => {
      setCurrentlyPlaying(lang);
      audio.onended = () => setCurrentlyPlaying(null);
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a1208] via-[#120a05] to-black text-white overflow-hidden">

      {/* 🌍 HALO AFRICAIN */}
      <div className="absolute -top-1/3 -left-1/3 w-[80%] h-[80%] bg-amber-600/20 blur-[180px]" />
      <div className="absolute bottom-[-40%] right-[-30%] w-[90%] h-[90%] bg-red-700/20 blur-[200px]" />

      {/* HEADER */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-center z-50 backdrop-blur border-b border-amber-900/30">
        <h1 className="text-sm tracking-[0.3em] text-amber-400 font-semibold">
          POMPIERS DU CONGO
        </h1>
      </header>

      {/* 🎧 AIDE VOCALE */}
      <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setIsAudioWidgetOpen(!isAudioWidgetOpen)}
          className="h-11 w-11 rounded-full bg-amber-800/40 border border-amber-600"
        >
          <HelpCircle className="text-amber-300" />
        </Button>

        <AnimatePresence>
          {isMenuVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mt-2 bg-[#1a1208] border border-amber-700 rounded-xl p-3 space-y-2 shadow-xl"
            >
              <p className="text-xs text-amber-400 text-center">Guide vocal</p>

              <Button
                onClick={() => playAudio("fr")}
                className="w-full justify-start bg-amber-900/40"
              >
                <Volume2 className="mr-2 h-4 w-4" /> Français
              </Button>

              <Button
                onClick={() => playAudio("ln")}
                className="w-full justify-start bg-amber-900/40"
              >
                <Volume2 className="mr-2 h-4 w-4" /> Lingala
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🌱 CONTENU */}
      <main className="flex flex-col items-center justify-center pt-[140px] pb-40 px-6 space-y-10 text-center">

        {/* TOTEM PROTECTION */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-amber-600/20 blur-2xl rounded-full" />
          <Shield className="relative h-24 w-24 text-amber-400" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Tu n’es pas seul
          </h2>
          <p className="text-amber-300 mt-2 text-sm">
            Les pompiers veillent sur toi, jour et nuit
          </p>
        </div>

        {/* 🔥 URGENCE */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="w-full max-w-xs"
        >
          <Link to="/loc/urgence">
            <Button className="w-full h-20 rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 shadow-2xl text-xl font-black">
              <Flame className="mr-3" />
              APPEL D’URGENCE
            </Button>
          </Link>
        </motion.div>

        {/* 🏠 PROPRIÉTÉ */}
        <Link to="/register-house" className="w-full max-w-xs">
          <Button
            variant="outline"
            className="w-full h-14 border-amber-700 text-amber-300 rounded-xl"
          >
            <HomeIcon className="mr-2" />
            Protéger ma maison
          </Button>
        </Link>
      </main>

      {/* 📞 APPEL RAPIDE */}
      {showCallButton && (
        <motion.a
          href="tel:118"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 right-6 w-16 h-16 bg-red-700 rounded-full flex items-center justify-center shadow-2xl"
        >
          <PhoneCall className="h-8 w-8 animate-pulse" />
        </motion.a>
      )}
    </div>
  );
        }
        
