import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react"; 
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Plus, HelpCircle, Volume2, PhoneCall, Home } from "lucide-react"; 
import { motion } from "framer-motion"; 

// Composant principal Home
export default function Home() {
  
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [showCallButton, setShowCallButton] = useState(false); 

  // Références pour l'audio
  const audioRefFr = useRef(new Audio("/1/1.wav"));
  const audioRefLn = useRef(new Audio("/2/2.wav"));
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  // LOGIQUE 1 : Arrêter l'audio au DÉMONTAGE du composant
  useEffect(() => {
    return () => {
      stopAllAudio(); 
    };
  }, []); 

  // LOGIQUE 2 : TRANSITION D'ENTRÉE/SORTIE (Widget Audio)
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

  // LOGIQUE 3 : AFFICHAGE DU BOUTON D'APPEL
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
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* ===== HEADER (Responsive) ===== */}
      <header className="fixed top-0 left-0 w-full h-14 sm:h-16 md:h-18 flex items-center justify-center bg-black z-50 border-b border-gray-800 px-4">
        <h1 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl">Centre de Secours</h1>
      </header>
      
      {/* ===== WIDGET AIDE AUDIO (Centré et Responsive) ===== */}
      <div className="fixed top-[60px] sm:top-[70px] md:top-[80px] z-40 left-1/2 -translate-x-1/2"> 
        
        <div className="relative"> 
            
            {/* Bouton HelpCircle (?) */}
            <Button
            onClick={toggleAudioWidget}
            className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 p-0 rounded-full bg-red-900/40 border border-red-700 hover:bg-red-900/60 transition-colors duration-300 shadow-md shadow-red-900/50"
            title="Aide Vocale"
            >
            <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" /> 
            </Button>

            {/* Menu déroulant audio */}
            {isMenuVisible && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.2 }}
                className="
                absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col p-2 
                bg-neutral-900 rounded-lg shadow-2xl space-y-1 
                border border-red-900/70 min-w-[140px] sm:min-w-[150px] md:min-w-[160px]
                "
            >
                <p className="text-xs sm:text-sm font-semibold text-red-400 mb-1 text-center">Guide Audio</p>
                
                {/* Bouton Français */}
                <Button
                onClick={() => playAudio('fr')}
                className={`
                    w-full justify-start h-7 sm:h-8 text-xs sm:text-sm transition rounded
                    ${currentlyPlaying === 'fr' ? 'bg-red-700 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}
                `}
                >
                <Volume2 className={`mr-2 h-3 w-3 sm:h-4 sm:w-4 ${currentlyPlaying === 'fr' ? 'text-white' : 'text-gray-400'}`} />
                Français (FR)
                </Button>
                
                {/* Bouton Lingala */}
                <Button
                onClick={() => playAudio('ln')}
                className={`
                    w-full justify-start h-7 sm:h-8 text-xs sm:text-sm transition rounded
                    ${currentlyPlaying === 'ln' ? 'bg-red-700 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}
                `}
                >
                <Volume2 className={`mr-2 h-3 w-3 sm:h-4 sm:w-4 ${currentlyPlaying === 'ln' ? 'text-white' : 'text-gray-400'}`} />
                Lingala (LN)
                </Button>
                
                {/* Bouton Arrêter */}
                <Button
                    onClick={stopAllAudio}
                    variant="ghost"
                    className={`
                        w-full h-5 sm:h-6 text-[10px] sm:text-xs mt-1 transition
                        ${currentlyPlaying ? 'text-red-400 hover:bg-red-900/50' : 'text-gray-600 cursor-default hover:bg-transparent'}
                    `}
                    disabled={!currentlyPlaying}
                >
                    Arrêter la lecture
                </Button>
                
            </motion.div>
            )}
        </div>
      </div>
      {/* ===== FIN WIDGET AIDE AUDIO ===== */}


      {/* ===== CONTENU PRINCIPAL (Responsive) ===== */}
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-8 md:px-12 lg:px-24 pb-24 sm:pb-32 md:pb-40 space-y-6 sm:space-y-8 bg-black pt-[120px] sm:pt-[140px] md:pt-[150px]">

        {/* ICÔNE & TITRE */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Shield className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-red-500 animate-bounce-slow" strokeWidth={1.2} />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">AIDE D'URGENCE</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Intervention pompiers prioritaire</p>
        </div>

        {/* BOUTONS PRINCIPAUX */}
        <div className="flex flex-col w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] lg:max-w-[350px] gap-3 sm:gap-4">

          {/* 1. BOUTON URGENCE */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 1.1 }} 
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: [1.1, 1, 0.98, 1],
                scaleX: [1.05, 1],
            }}
            transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 100,
                scale: { duration: 0.5, times: [0, 0.7, 0.9, 1] }
            }}
            className="w-full flex justify-center"
          >
            <Link to="/loc/urgence" className="w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px]">
              <button className="blob-button">
                <div className="blob1"></div>
                <div className="blob2"></div>
                <div className="inner">
                    <MapPin className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-base sm:text-lg md:text-xl">URGENCE</span>
                </div>
              </button>
            </Link>
          </motion.div>

          {/* 2. BOUTON AJOUT PROPRIÉTÉ */}
          <Link to="/register-house">
            <Button
              variant="outline"
              className="w-full h-11 sm:h-12 md:h-14 flex items-center justify-center border-neutral-700 text-white/80 rounded-xl hover:bg-white/5 transition text-sm sm:text-base"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              PROPRIÉTÉ
            </Button>
          </Link>

        </div>
      </main>

      {/* ===== WIDGET D'APPEL DIRECT (118) - Responsive ===== */}
      {showCallButton && (
        <motion.a 
            href="tel:118"
            title="Appeler les pompiers (118)"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 150 }}
            className="
                fixed 
                bottom-20 sm:bottom-24 md:bottom-28 
                right-4 sm:right-6 md:right-8 
                w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18
                bg-red-600 hover:bg-red-500 active:bg-red-700
                rounded-full 
                flex items-center justify-center 
                shadow-2xl shadow-red-700/60 
                z-50
            "
        >
            <PhoneCall className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-white animate-pulse-fast" strokeWidth={2.5} />
        </motion.a>
      )}
      
      {/* ===== STYLES CSS ===== */}
      <style>{`
        /* Animations */
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite;
        }

        @keyframes pulse-fast {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s infinite ease-in-out;
        }
        
        /* ========================================================= */
        /* STYLES DU BOUTON URGENCE (BLOB) - RESPONSIVE */
        /* ========================================================= */
        .blob-button {
          cursor: pointer;
          border-radius: 14px;
          border: none;
          padding: 2px;
          background: radial-gradient(circle 80px at 80% -10%, #fff0f0, #200000); 
          position: relative;
          width: 100%; 
          transition: background 0.3s, transform 0.3s;
          font-weight: bold;
          font-size: 1rem;
        }

        /* Responsive font sizes */
        @media (min-width: 640px) {
          .blob-button {
            border-radius: 16px;
            font-size: 1.1rem;
          }
        }

        @media (min-width: 768px) {
          .blob-button {
            font-size: 1.2rem;
          }
        }

        .blob-button:hover {
          transform: scale(0.98); 
        }

        .blob-button::after {
          content: "";
          position: absolute;
          width: 65%;
          height: 60%;
          border-radius: 120px;
          top: 0;
          right: 0;
          box-shadow: 0 0 20px #ff505038; 
          z-index: -1;
          transition: box-shadow 0.3s;
        }

        .blob-button:hover::after {
          box-shadow: 0 0 10px #ff000018; 
        }

        .blob-button .blob1 {
          position: absolute;
          width: 60px;
          height: 100%;
          border-radius: 14px;
          bottom: 0;
          left: 0;
          background: radial-gradient(
            circle 60px at 0% 100%,
            #ff733f,
            #ff000080,
            transparent
          );
          box-shadow: -10px 10px 30px #ff45002d;
          transition: background 0.3s, box-shadow 0.3s;
        }

        @media (min-width: 640px) {
          .blob-button .blob1 {
            width: 70px;
            border-radius: 16px;
          }
        }

        .blob-button:hover .blob1 {
          box-shadow: -5px 5px 20px #200000;
        }

        .blob-button .inner {
          padding: 12px 20px;
          border-radius: 12px;
          color: #fff;
          z-index: 3;
          position: relative;
          background: radial-gradient(circle 80px at 80% -50%, #883333, #300505); 
          transition: background 0.3s;
          display: flex; 
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .blob-button .inner {
            padding: 14px 25px;
            border-radius: 14px;
          }
        }

        @media (min-width: 768px) {
          .blob-button .inner {
            padding: 16px 30px;
          }
        }

        .blob-button:hover .inner {
          background: radial-gradient(circle 80px at 80% -50%, #440000, #100000);
        }

        .blob-button .inner::before {
          content: "";
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          border-radius: 12px;
          background: radial-gradient(
            circle 60px at 0% 100%,
            #ff00001a,
            #ff450011,
            transparent
          );
          position: absolute;
          transition: opacity 0.3s;
        }

        @media (min-width: 640px) {
          .blob-button .inner::before {
            border-radius: 14px;
          }
        }

        .blob-button:hover .inner::before {
          opacity: 0;
        }

        /* Ajustements pour très petits écrans */
        @media (max-width: 360px) {
          .blob-button {
            font-size: 0.9rem;
          }
          .blob-button .inner {
            padding: 10px 16px;
          }
        }
        
      `}</style>
    </div>
  );
      }
