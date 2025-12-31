import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react"; 
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Plus, HelpCircle, Volume2, PhoneCall, HomeIcon } from "lucide-react"; 
import { motion } from "framer-motion"; 

// Composant principal Home
export default function Home() {
  
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); 
  const [showCallButton, setShowCallButton] = useState(false); 

  // Références pour l'audio (Assurez-vous que ces fichiers existent dans le dossier public)
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

  // LOGIQUE 3 : AFFICHAGE DU BOUTON D'APPEL (Apparaît après un court délai)
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
        // Alert supprimée pour une meilleure UX, mais le log d'erreur reste utile
        setCurrentlyPlaying(null);
      });
  };


  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* ===== HEADER (z-50) ===== */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-center bg-black z-50 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg">Centre de Secours</h1>
      </header>
      
      {/* ===== WIDGET AIDE AUDIO (Centré) ===== */}
      <div className="fixed top-[70px] z-40 left-1/2 -translate-x-1/2"> 
        
        <div className="relative"> 
            
            {/* Bouton HelpCircle (?) (le déclencheur) */}
            <Button
            onClick={toggleAudioWidget}
            className="h-10 w-10 p-0 rounded-full bg-red-900/40 border border-red-700 hover:bg-red-900/60 transition-colors duration-300 shadow-md shadow-red-900/50"
            title="Aide Vocale"
            >
            <HelpCircle className="h-6 w-6 text-red-500" /> 
            </Button>

            {/* Conteneur des options audio (Menu déroulant - AVEC FRAMER MOTION) */}
            {isMenuVisible && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`
                absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col p-2 
                bg-neutral-900 rounded-lg shadow-2xl space-y-1 
                border border-red-900/70 min-w-[150px]
                `}
            >
                <p className="text-xs font-semibold text-red-400 mb-1 text-center">Guide Audio</p>
                
                {/* Bouton Français */}
                <Button
                onClick={() => playAudio('fr')}
                className={`
                    w-full justify-start h-8 text-sm transition rounded
                    ${currentlyPlaying === 'fr' ? 'bg-red-700 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}
                `}
                >
                <Volume2 className={`mr-2 h-4 w-4 ${currentlyPlaying === 'fr' ? 'text-white' : 'text-gray-400'}`} />
                Français (FR)
                </Button>
                
                {/* Bouton Lingala */}
                <Button
                onClick={() => playAudio('ln')}
                className={`
                    w-full justify-start h-8 text-sm transition rounded
                    ${currentlyPlaying === 'ln' ? 'bg-red-700 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}
                `}
                >
                <Volume2 className={`mr-2 h-4 w-4 ${currentlyPlaying === 'ln' ? 'text-white' : 'text-gray-400'}`} />
                Lingala (LN)
                </Button>
                
                {/* Bouton Arrêter tout */}
                <Button
                    onClick={stopAllAudio}
                    variant="ghost"
                    className={`
                        w-full h-6 text-xs mt-1 transition
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


      {/* ===== CONTENU PRINCIPAL (Monté) ===== */}
      {/* CORRECTION MOBILE : pt-[140px] pour décaler le contenu sous le header et le widget audio */}
      <main className="flex flex-col items-center justify-center flex-1 px-24 pb-40 space-y-8 bg-black pt-[140px]">

        {/* ICÔNE & TITRE */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Shield className="h-20 w-20 text-red-500 animate-bounce-slow" strokeWidth={1.2} />
          <h1 className="text-3xl font-extrabold text-white">AIDE D’URGENCE</h1>
          <p className="text-sm text-gray-400">Intervention pompiers prioritaire</p>
        </div>

        {/* BOUTONS PRINCIPAUX */}
        <div className="flex flex-col w-full max-w-[300px] gap-4">

          {/* 1. BOUTON URGENCE (Style Blob + Animation d'entrée unique + Largeur Réduite) */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 1.1 }} 
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: [1.1, 1, 0.98, 1], // Animation de rebond (diminue et revient à la normale)
                scaleX: [1.05, 1], // Petite réduction de largeur
            }}
            transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 100,
                scale: { duration: 0.5, times: [0, 0.7, 0.9, 1] }
            }}
            className="w-full flex justify-center" // Centrage du bouton
          >
            <Link to="/loc/urgence" className="w-full max-w-[200px]"> {/* Définition de la largeur max */}
              <button className="blob-button">
                <div className="blob1"></div>
                <div className="blob2"></div>
                <div className="inner">
                    <MapPin className="mr-3 h-5 w-5" />
                    URGENCE
                </div>
              </button>
            </Link>
          </motion.div>

          {/* 2. BOUTON AJOUT PROPRIÉTÉ (Statique, Icônes Maison + Plus) */}
          <Link to="/register-house">
            <Button
              variant="outline"
              className="w-full h-12 flex items-center justify-center border-neutral-700 text-white/80 rounded-xl hover:bg-white/5 transition"
            >
              <Plus className="mr-2 h-5 w-5 text-yellow-400" />
              <HomeIcon className="mr-2 h-5 w-5 text-yellow-400" />
              PROPRIÉTÉ
            </Button>
          </Link>

        </div>
      </main>

      {/* ===== WIDGET D'APPEL DIRECT (118) - FRAMER MOTION ===== */}
      {showCallButton && (
        <motion.a 
            href="tel:118"
            title="Appeler les pompiers (118)"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 150 }}
            className={`
                fixed bottom-24 right-8 
                w-16 h-16 
                bg-red-600 hover:bg-red-500 active:bg-red-700
                rounded-full 
                flex items-center justify-center 
                shadow-2xl shadow-red-700/60 
                z-50
            `}
        >
            <PhoneCall className="h-8 w-8 text-white animate-pulse-fast" strokeWidth={2.5} />
        </motion.a>
      )}
      
      {/* ===== ANIMATIONS CSS SUPPLÉMENTAIRES ET GLOBALES (Styles Blob et Animations) ===== */}
      <style>{`
        /* Animations par défaut */
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
        /* STYLES DU BOUTON URGENCE (BLOB) */
        /* ========================================================= */
        .blob-button {
          cursor: pointer;
          border-radius: 16px;
          border: none;
          padding: 2px;
          /* Utilisation de couleurs Rouge/Urgence */
          background: radial-gradient(circle 80px at 80% -10%, #fff0f0, #200000); 
          position: relative;
          width: 100%; 
          transition: background 0.3s, transform 0.3s;
          font-weight: bold;
          font-size: 1.1rem;
        }

        /* Transition de survol standard */
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
          width: 70px;
          height: 100%;
          border-radius: 16px;
          bottom: 0;
          left: 0;
          /* Couleur du blob rouge/orange */
          background: radial-gradient(
            circle 60px at 0% 100%,
            #ff733f,
            #ff000080,
            transparent
          );
          box-shadow: -10px 10px 30px #ff45002d;
          transition: background 0.3s, box-shadow 0.3s;
        }

        .blob-button:hover .blob1 {
          box-shadow: -5px 5px 20px #200000;
        }

        .blob-button .inner {
          padding: 14px 25px;
          border-radius: 14px;
          color: #fff;
          z-index: 3;
          position: relative;
          /* Fond principal rouge foncé */
          background: radial-gradient(circle 80px at 80% -50%, #883333, #300505); 
          transition: background 0.3s;
          display: flex; 
          align-items: center;
          justify-content: center;
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
          border-radius: 14px;
          /* Effet de lueur rouge */
          background: radial-gradient(
            circle 60px at 0% 100%,
            #ff00001a,
            #ff450011,
            transparent
          );
          position: absolute;
          transition: opacity 0.3s;
        }

        .blob-button:hover .inner::before {
          opacity: 0;
        }
        
      `}</style>
    </div>
  );
}