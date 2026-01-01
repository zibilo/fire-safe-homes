import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Plus, HelpCircle, Volume2, PhoneCall, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showCallButton, setShowCallButton] = useState(false);
  
  const audioRefFr = useRef(new Audio("/1/1.wav"));
  const audioRefLn = useRef(new Audio("/2/2.wav"));
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    if (isAudioWidgetOpen) {
      setIsMenuVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsMenuVisible(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAudioWidgetOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCallButton(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleAudioWidget = () => {
    if (isAudioWidgetOpen) {
      stopAllAudio();
    }
    setIsAudioWidgetOpen(!isAudioWidgetOpen);
  };

  const stopAllAudio = () => {
    audioRefFr.current.pause();
    audioRefFr.current.currentTime = 0;
    audioRefLn.current.pause();
    audioRefLn.current.currentTime = 0;
    setCurrentlyPlaying(null);
  };

  const playAudio = (language) => {
    stopAllAudio();
    let audioToPlay;
    let newPlayingState;
    
    if (language === 'fr') {
      audioToPlay = audioRefFr.current;
      newPlayingState = 'fr';
    } else if (language === 'ln') {
      audioToPlay = audioRefLn.current;
      newPlayingState = 'ln';
    } else {
      return;
    }
    
    audioToPlay.play()
      .then(() => {
        setCurrentlyPlaying(newPlayingState);
        audioToPlay.onended = () => {
          setCurrentlyPlaying(null);
        };
      })
      .catch(error => {
        console.error(`Erreur de lecture audio pour ${language}:`, error);
        setCurrentlyPlaying(null);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-800 to-black text-white overflow-x-hidden">
      <style>{`
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Centre de Secours</h1>
            </div>
            <Link to="/map">
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Carte</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* WIDGET AIDE AUDIO */}
      <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-40 w-[90%] max-w-xs sm:max-w-sm">
        <div className="relative">
          <Button
            onClick={toggleAudioWidget}
            className={`w-full justify-center gap-2 h-10 sm:h-12 text-sm sm:text-base transition-all ${
              isAudioWidgetOpen 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Aide Audio</span>
          </Button>

          {isMenuVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-neutral-900/98 backdrop-blur-md rounded-lg shadow-2xl border border-neutral-700 p-3 sm:p-4"
            >
              <p className="text-xs sm:text-sm text-neutral-300 mb-3 text-center font-medium">
                Guide Audio
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => playAudio('fr')}
                  className={`w-full justify-start h-9 sm:h-10 text-xs sm:text-sm transition rounded ${
                    currentlyPlaying === 'fr' 
                      ? 'bg-red-700 hover:bg-red-600' 
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Français (FR)
                </Button>
                <Button
                  onClick={() => playAudio('ln')}
                  className={`w-full justify-start h-9 sm:h-10 text-xs sm:text-sm transition rounded ${
                    currentlyPlaying === 'ln' 
                      ? 'bg-red-700 hover:bg-red-600' 
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Lingala (LN)
                </Button>
                <Button
                  onClick={stopAllAudio}
                  variant="outline"
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm border-neutral-600 hover:bg-neutral-700"
                >
                  Arrêter la lecture
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="pt-32 sm:pt-36 md:pt-40 pb-24 sm:pb-32 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* ICÔNE & TITRE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full mb-4 sm:mb-6">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
              AIDE D'URGENCE
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-neutral-400">
              Intervention pompiers prioritaire
            </p>
          </motion.div>

          {/* BOUTONS PRINCIPAUX */}
          <div className="space-y-4 sm:space-y-6">
            {/* BOUTON URGENCE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
              className="flex justify-center"
            >
              <Link to="/emergency" className="w-full max-w-md">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow" />
                  <Button
                    size="lg"
                    className="relative w-full h-16 sm:h-20 text-lg sm:text-xl md:text-2xl font-bold bg-red-600 hover:bg-red-700 shadow-2xl transition-all duration-300 rounded-2xl animate-blob border-2 border-red-400"
                  >
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                    URGENCE
                  </Button>
                </div>
              </Link>
            </motion.div>

            {/* BOUTON PROPRIÉTÉ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center"
            >
              <Link to="/add-property" className="w-full max-w-md">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold border-2 border-neutral-600 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 rounded-xl"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="ml-2">PROPRIÉTÉ</span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      {/* BOUTON D'APPEL DIRECT (118) */}
      {showCallButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.3 
          }}
          className="fixed bottom-6 sm:bottom-8 right-4 sm:right-6 z-50"
        >
          <a href="tel:118">
            <Button
              size="lg"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-green-400"
            >
              <PhoneCall className="w-6 h-6 sm:w-7 sm:h-7" />
            </Button>
          </a>
        </motion.div>
      )}
    </div>
  );
              }
