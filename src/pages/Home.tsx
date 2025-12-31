import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react"; 
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Plus, HelpCircle, Volume2, PhoneCall, HomeIcon, Lock, AlertCircle } from "lucide-react"; 
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex flex-col overflow-hidden">
      
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(220, 38, 38, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Floating Security Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-red-600/5 rounded-full blur-2xl animate-pulse-slow" />
      </div>

      {/* Header avec effet de verre */}
      <header className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl z-50 border-b border-red-500/20 shadow-lg shadow-red-900/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-10 w-10 text-red-500" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">Centre de Secours</h1>
            <p className="text-xs text-red-400 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Plateforme Sécurisée 24/7
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-semibold">EN LIGNE</span>
        </div>
      </header>
      
      {/* Widget Audio modernisé */}
      <div className="fixed top-24 z-40 left-1/2 -translate-x-1/2"> 
        <div className="relative"> 
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAudioWidget}
            className="relative h-12 w-12 p-0 rounded-2xl bg-gradient-to-br from-red-600/30 to-orange-600/30 backdrop-blur-sm border border-red-500/40 hover:border-red-400/60 transition-all duration-300 shadow-lg shadow-red-900/30 flex items-center justify-center group"
            title="Aide Vocale"
          >
            <HelpCircle className="h-6 w-6 text-red-400 group-hover:text-red-300 transition-colors" /> 
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 rounded-2xl transition-colors" />
          </motion.button>

          {isMenuVisible && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2, type: "spring" }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col p-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-500/30 min-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-500/20">
                <Volume2 className="h-4 w-4 text-red-400" />
                <p className="text-sm font-bold text-red-400">Guide Audio</p>
              </div>
              
              <Button
                onClick={() => playAudio('fr')}
                className={`w-full justify-start h-10 text-sm mb-2 rounded-xl transition-all ${
                  currentlyPlaying === 'fr' 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                }`}
              >
                <Volume2 className={`mr-2 h-4 w-4 ${currentlyPlaying === 'fr' ? 'text-white' : 'text-red-400'}`} />
                Français (FR)
              </Button>
              
              <Button
                onClick={() => playAudio('ln')}
                className={`w-full justify-start h-10 text-sm mb-2 rounded-xl transition-all ${
                  currentlyPlaying === 'ln' 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                }`}
              >
                <Volume2 className={`mr-2 h-4 w-4 ${currentlyPlaying === 'ln' ? 'text-white' : 'text-red-400'}`} />
                Lingala (LN)
              </Button>
              
              <Button
                onClick={stopAllAudio}
                variant="ghost"
                className={`w-full h-8 text-xs mt-2 rounded-lg transition-all ${
                  currentlyPlaying 
                    ? 'text-red-400 hover:bg-red-900/30' 
                    : 'text-slate-600 cursor-not-allowed hover:bg-transparent'
                }`}
                disabled={!currentlyPlaying}
              >
                {currentlyPlaying ? 'Arrêter la lecture' : 'Aucune lecture en cours'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 pb-32 space-y-12 pt-32">

        {/* Hero Section avec Shield animé */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <div className="relative">
            {/* Cercles de sécurité animés */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 -m-12 border-2 border-red-500/30 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.05, 0.2]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute inset-0 -m-20 border border-red-500/20 rounded-full"
            />
            
            <div className="relative bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-sm p-8 rounded-3xl border border-red-500/30 shadow-2xl shadow-red-900/30">
              <Shield className="h-24 w-24 text-red-500" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black text-white tracking-tight">
              AIDE D'URGENCE
            </h1>
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-lg font-medium">Intervention Prioritaire 24/7</p>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Service d'urgence rapide et sécurisé. Votre sécurité est notre priorité absolue.
            </p>
          </div>
        </motion.div>

        {/* Boutons d'action */}
        <div className="flex flex-col w-full max-w-md gap-6">

          {/* Bouton URGENCE principal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <Link to="/loc/urgence" className="block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="security-button group"
              >
                <div className="security-button-bg" />
                <div className="security-button-content">
                  <div className="flex items-center justify-center gap-3">
                    <div className="relative">
                      <MapPin className="h-7 w-7 relative z-10" />
                      <div className="absolute inset-0 bg-white/50 blur-lg" />
                    </div>
                    <span className="text-2xl font-black tracking-wider">URGENCE</span>
                  </div>
                  <p className="text-xs opacity-90 mt-1">Géolocalisation automatique</p>
                </div>
                <div className="security-button-shine" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Bouton Propriété */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/register-house" className="block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-16 flex items-center justify-center gap-3 bg-slate-900/50 backdrop-blur-sm border-2 border-amber-500/30 hover:border-amber-500/50 rounded-2xl text-white transition-all duration-300 shadow-lg hover:shadow-amber-500/20 group"
              >
                <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                  <Plus className="h-5 w-5 text-amber-400" />
                  <HomeIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-lg block group-hover:text-amber-300 transition-colors">ENREGISTRER</span>
                  <span className="text-xs text-slate-400">Ma propriété</span>
                </div>
              </motion.button>
            </Link>
          </motion.div>

        </div>

        {/* Badges de confiance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-green-500/30">
            <Lock className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400 font-semibold">CRYPTÉ</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-blue-500/30">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-blue-400 font-semibold">CERTIFIÉ</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-400 font-semibold">INSTANTANÉ</span>
          </div>
        </motion.div>
      </main>

      {/* Bouton d'appel flottant amélioré */}
      {showCallButton && (
        <motion.a 
          href="tel:118"
          title="Appeler les pompiers (118)"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-700/50 z-50 group"
        >
          <div className="absolute inset-0 bg-red-500/50 rounded-full blur-xl animate-pulse" />
          <PhoneCall className="h-10 w-10 text-white relative z-10 group-hover:rotate-12 transition-transform" strokeWidth={2} />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-950 animate-pulse" />
        </motion.a>
      )}
      
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 18s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        /* Bouton Sécurité Moderne */
        .security-button {
          position: relative;
          width: 100%;
          height: 80px;
          border: none;
          border-radius: 1.5rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .security-button-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
          transition: all 0.3s ease;
        }

        .security-button:hover .security-button-bg {
          background: linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
        }

        .security-button-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
        }

        .security-button-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .security-button:hover .security-button-shine {
          transform: translateX(100%);
        }

        .security-button::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, #dc2626, #ea580c, #dc2626);
          border-radius: 1.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
          filter: blur(10px);
        }

        .security-button:hover::before {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
        }
