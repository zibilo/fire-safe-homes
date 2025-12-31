import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  CheckCircle,
  Loader2,
  Send,
  ArrowLeft,
  Radio,
  ShieldAlert,
  Siren,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const EMERGENCY_PHONE_NUMBER = '118';

const containerAnim = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.96 }
};

const stateAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10 }
};

const GeoLocate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [smsLink, setSmsLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error' | 'sms-fallback'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // --- ÉTATS DU WIDGET AUDIO ---
  const [isAudioWidgetOpen, setIsAudioWidgetOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Chemins d'audio de démo
  const audioRefFr = useRef(new Audio("/3/téléchargement (11).wav")); 
  const audioRefKit = useRef(new Audio("/3/téléchargement (15).wav")); 
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  // LOGIQUE 1 : Arrêter l'audio au DÉMONTAGE du composant (CLEANUP)
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
      // Utilisé 250ms pour être sûr que l'animation de 0.2s se termine
      const timer = setTimeout(() => { 
        setIsMenuVisible(false);
      }, 250); 
      return () => clearTimeout(timer);
    }
  }, [isAudioWidgetOpen]);

  const toggleAudioWidget = () => {
    if (isAudioWidgetOpen) {
      stopAllAudio();
    }
    setIsAudioWidgetOpen(!isAudioWidgetOpen);
  };
  
  const stopAllAudio = () => {
    audioRefFr.current.pause();
    audioRefFr.current.currentTime = 0;
    audioRefKit.current.pause();
    audioRefKit.current.currentTime = 0;
    setCurrentlyPlaying(null);
  };

  const playAudio = (language) => {
    stopAllAudio(); 

    let audioToPlay;
    let newPlayingState;

    if (language === 'fr') {
      audioToPlay = audioRefFr.current;
      newPlayingState = 'fr';
    } else if (language === 'kit') {
      audioToPlay = audioRefKit.current;
      newPlayingState = 'kit';
    } else {
      return; 
    }

    // Tente de charger et jouer l'audio
    audioToPlay.load(); 
    audioToPlay.play()
      .then(() => {
        setCurrentlyPlaying(newPlayingState);
        audioToPlay.onended = () => {
          setCurrentlyPlaying(null);
        };
      })
      .catch(error => {
        console.error(`Erreur de lecture audio pour ${language}:`, error);
        toast.error("Échec de la lecture audio. Veuillez cliquer à nouveau ou vérifier les paramètres de média.");
        setCurrentlyPlaying(null);
      });
  };
  // --- FIN LOGIQUE WIDGET AUDIO ---

  
  // =========================================================================
  // FONCTION HANDLELOCATE CORRIGÉE (ALIGNEMENT RPC)
  // =========================================================================
  const handleLocate = () => {
    setStatus('locating');
    setErrorMsg('');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Géolocalisation non supportée par votre navigateur.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setTempCoords({ lat: latitude, lng: longitude });

            // Si déconnecté, on active immédiatement le mode SMS
            if (!navigator.onLine) {
                console.warn("RÉSEAU : Aucune connexion Internet détectée. Activation du mode SMS.");
                triggerSMSFallback(latitude, longitude, accuracy);
                return;
            }

            // --- TENTATIVE DE TRANSMISSION SUPABASE AVEC DÉBOGAGE ---
            try {
                // 1. Définition du RPC et du Timeout (15s)
                const rpcPromise = supabase.rpc('update_victim_location', {
                    // C'est la CORRECTION : ALIGNEMENT AVEC LES NOMS p_ DANS LA FONCTION SQL
                    p_request_id: id || 'urgence-anonyme',
                    p_lat: latitude,
                    p_lng: longitude,
                    p_acc: accuracy
                });

                const timeoutPromise = new Promise((_, reject) =>
                    // Utilisez un objet Error pour que le 'catch' puisse le différencier
                    setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 15000) 
                );

                console.log("Supabase RPC : Tentative d'envoi des coordonnées...");

                // 2. Course entre le RPC et le Timeout
                const result = await Promise.race([rpcPromise, timeoutPromise]) as any;
                
                // 3. Gestion de l'erreur Supabase (si l'API a répondu)
                if (result && result.error) {
                    // C'est l'erreur que nous cherchons ! Elle vient de la BDD ou des permissions.
                    console.error("❌ ÉCHEC RPC SUPABASE (Erreur Serveur/BDD) :", result.error);
                    throw result.error; // Renvoie l'erreur au catch
                }
                
                // 4. Succès
                setStatus('success');
                toast.success('Position transmise au QG.');
                console.log(`✅ SUCCÈS : Coordonnées (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) envoyées.`);

            } catch (error) {
                // 5. Gestion des erreurs (Timeout ou Erreur Supabase)
                console.error("Capture Catch :", error);

                if (error && error.message === 'TIMEOUT_ERROR') {
                    console.warn("⌛ ÉCHEC : Le délai de 15 secondes est dépassé (Timeout).");
                    toast.info('Transmission trop lente. Mode SMS activé.');
                } else {
                    // Si ce n'est pas un timeout, c'est l'erreur BDD/RPC remontée ci-dessus.
                    console.error("❌ ÉCHEC : Erreur réseau ou BDD non résolue. Activation du mode SMS.");
                    // Affichons l'erreur BDD/RPC pour le débogage si elle est présente
                    const errorMessage = error.message.includes('DB_ERROR') 
                      ? `Erreur BDD: ${error.message.split('DB_ERROR: ')[1]}` 
                      : 'Erreur inconnue.';
                    
                    toast.info('Erreur de transmission. Mode SMS activé.');
                }
                
                // Active le mode de secours dans tous les cas d'échec de la transmission RPC
                triggerSMSFallback(latitude, longitude, accuracy);
            }
        },
        // --- GESTION DES ERREURS DE GÉOLOCALISATION ---
        (err) => {
            setStatus('error');
            let codeMsg = 'Erreur technique inconnue.';
            if (err.code === 1) codeMsg = 'Autorisation GPS refusée (Veuillez l\'activer dans les paramètres).';
            else if (err.code === 2) codeMsg = 'Signal GPS introuvable (Vérifiez votre couverture).';
            else if (err.code === 3) codeMsg = 'Temps GPS dépassé (Connexion satellite trop longue).';
            
            console.error(`❌ ÉCHEC Géolocalisation (Code ${err.code}) : ${codeMsg}`);
            setErrorMsg(codeMsg);
            toast.error("Échec de la géolocalisation. Réessayez.");
        },
        { enableHighAccuracy: true, timeout: 30000 }
    );
  };
  // =========================================================================
  // FIN FONCTION HANDLELOCATE CORRIGÉE
  // =========================================================================

  const triggerSMSFallback = (lat, lng, acc) => {
    const message = `SOS ${lat},${lng} (±${Math.round(acc)}m) ID:${id || '?'}`;
    setSmsLink(`sms:${EMERGENCY_PHONE_NUMBER}?body=${encodeURIComponent(message)}`);
    setStatus('sms-fallback');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 bg-neutral-950 text-neutral-100 overflow-auto">
      
      {/* RETOUR (Haut Gauche) */}
      <div className="fixed top-4 left-4 z-30">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="icon"
          className="border-red-800 text-red-500 hover:bg-red-900/30"
        >
          <ArrowLeft />
        </Button>
      </div>

      {/* ===== WIDGET AIDE AUDIO (Centré H et Menu en dessous) ===== */}
      <div className="fixed top-4 z-40 left-1/2 -translate-x-1/2"> 
        <AnimatePresence>
          <div className="relative"> 
              
              {/* Bouton HelpCircle (?) (le déclencheur) */}
              <Button
              onClick={toggleAudioWidget}
              className="h-10 w-10 p-0 rounded-full bg-red-900/40 border border-red-700 hover:bg-red-900/60 transition-colors duration-300 shadow-md shadow-red-900/50"
              title="Aide Vocale"
              >
              <HelpCircle className="h-6 w-6 text-red-500" /> 
              </Button>

              {/* Conteneur des options audio (Menu déroulant - UTILISATION DE FRAMER MOTION) */}
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
                  
                  {/* Bouton Kituba/Kinkogo */}
                  <Button
                  onClick={() => playAudio('kit')}
                  className={`
                      w-full justify-start h-8 text-sm transition rounded
                      ${currentlyPlaying === 'kit' ? 'bg-red-700 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}
                  `}
                  >
                  <Volume2 className={`mr-2 h-4 w-4 ${currentlyPlaying === 'kit' ? 'text-white' : 'text-gray-400'}`} />
                  Kituba (KTB)
                  </Button>
                  
                  {/* Bouton Arrêter tout (TOUJOURS PRÉSENT) */}
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
        </AnimatePresence>
      </div>
      {/* ===== FIN WIDGET AIDE AUDIO ===== */}

      {/* CONTAINER */}
      <motion.div
        variants={containerAnim}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-neutral-900 border border-red-900/70 rounded-xl shadow-2xl shadow-red-900/50 p-8"
      >
        {/* HEADER */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-red-900/40 p-4 rounded-full border border-red-700 shadow-lg shadow-red-900/60"
          >
            <Siren className="h-10 w-10 text-red-500" />
          </motion.div>
        </div>

        <h1 className="text-center text-red-500 font-extrabold tracking-widest">
          CENTRE D’URGENCE POMPIERS
        </h1>
        <p className="text-xs text-neutral-400 text-center mt-1 uppercase">
          Transmission prioritaire sécurisée
        </p>

        {/* ÉTATS */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              variants={stateAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8"
            >
              <div className="bg-neutral-800/60 border border-neutral-700 rounded-lg p-4 text-sm mb-6">
                Procédure officielle :
                <br />• Autoriser la localisation
                <br />• Ne pas fermer l’application
                <br />• Transmission automatique
              </div>

              <Button
                onClick={handleLocate}
                className="w-full h-16 bg-red-700 hover:bg-red-800 text-lg font-bold shadow-xl shadow-red-900/70 animate-pulse"
              >
                <MapPin className="mr-2" />
                ENVOYER MA POSITION
              </Button>
            </motion.div>
          )}

          {status === 'locating' && (
            <motion.div
              key="locating"
              variants={stateAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8 text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
              <p className="font-semibold">Localisation en cours…</p>
              <p className="text-xs text-neutral-400 mt-2">
                Connexion satellite
              </p>
            </motion.div>
          )}

          {status === 'success' && tempCoords && (
            <motion.div
              key="success"
              variants={stateAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8 bg-emerald-900/20 border border-emerald-700 rounded-lg p-6 text-center"
            >
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-400 uppercase">
                Position validée
              </p>
              <p className="text-xs text-neutral-300 mt-2 font-mono">
                {tempCoords.lat.toFixed(5)} / {tempCoords.lng.toFixed(5)}
              </p>
              <p className="text-xs text-neutral-400 mt-4">
                Les secours sont en route
              </p>
            </motion.div>
          )}

          {status === 'sms-fallback' && (
            <motion.div
              key="sms"
              variants={stateAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8 bg-amber-900/20 border border-amber-700 rounded-lg p-6 text-center"
            >
              <Radio className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <p className="font-bold text-amber-400">
                Mode SMS d’urgence
              </p>

              <a href={smsLink} className="block mt-4">
                <Button className="w-full h-16 bg-red-700 hover:bg-red-800 text-lg font-bold shadow-xl shadow-red-900/60">
                  <Send className="mr-2" />
                  ENVOYER LE SMS
                </Button>
              </a>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              variants={stateAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-8 bg-red-900/20 border border-red-700 rounded-lg p-6 text-center"
            >
              <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="font-bold text-red-400">Erreur de localisation</p>
              <p className="text-xs text-neutral-300 mt-2">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GeoLocate;
