import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AudioWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<"fr" | "ln" | null>(null);
  const audioRefFr = useRef<HTMLAudioElement | null>(null);
  const audioRefLn = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRefFr.current = new Audio("/1/1.wav");
    audioRefLn.current = new Audio("/2/2.wav");

    const stopAudio = () => {
      audioRefFr.current?.pause();
      audioRefLn.current?.pause();
    };

    return () => {
      stopAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (audioRefFr.current) {
      audioRefFr.current.pause();
      audioRefFr.current.currentTime = 0;
    }
    if (audioRefLn.current) {
      audioRefLn.current.pause();
      audioRefLn.current.currentTime = 0;
    }
    setCurrentlyPlaying(null);
  };

  const playAudio = (language: "fr" | "ln") => {
    stopAllAudio();

    const audioToPlay = language === 'fr' ? audioRefFr.current : audioRefLn.current;

    if (audioToPlay) {
      audioToPlay.play().then(() => {
        setCurrentlyPlaying(language);
        audioToPlay.onended = () => setCurrentlyPlaying(null);
      }).catch(error => {
        console.error(`Erreur de lecture audio pour ${language}:`, error);
        setCurrentlyPlaying(null);
      });
    }
  };

  return (
    <div className="fixed top-20 z-40 left-1/2 -translate-x-1/2">
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 p-0 rounded-full bg-gray-800/80 border border-gray-700 hover:bg-gray-700/90 backdrop-blur-sm"
          title="Aide Vocale"
        >
          <HelpCircle className="h-6 w-6 text-gray-300" />
        </Button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col p-2 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 min-w-[180px]"
            >
              <p className="text-xs font-semibold text-gray-400 mb-1 text-center">Guide Audio</p>
              <Button
                onClick={() => playAudio('fr')}
                className={`w-full justify-start h-9 text-sm rounded ${currentlyPlaying === 'fr' ? 'bg-red-600' : 'bg-gray-800'}`}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Français
              </Button>
              <Button
                onClick={() => playAudio('ln')}
                className={`w-full justify-start h-9 text-sm rounded mt-1 ${currentlyPlaying === 'ln' ? 'bg-red-600' : 'bg-gray-800'}`}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Lingala
              </Button>
              {currentlyPlaying && (
                 <Button
                    onClick={stopAllAudio}
                    variant="ghost"
                    className="w-full h-7 text-xs mt-1 text-red-400 hover:bg-red-900/50"
                 >
                    Arrêter
                 </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
