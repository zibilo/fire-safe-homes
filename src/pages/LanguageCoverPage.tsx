import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";

/* ------------------ CONFIGURATION ------------------ */
// Nom de l'image de fond stockée dans le dossier /public
const BACKGROUND_IMAGE_PATH = "/3/pompier-arfican-uniforme-homme-se-prepare-travailler-guy-hummer_1157-46897.jpg"; 

const AUDIO_FILES: { [k: string]: string } = {
  fr: "/1/1.wav",
  ln: "/2/2.wav",
};

const LanguageCoverPage: React.FC = () => {
  const navigate = useNavigate();

  /* -------- AUDIO STATE -------- */
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const playAudio = (file: string, lang: string) => {
    
    // --- ÉTAPE 1: GESTION DE LA PAUSE/REPRISE DU MÊME SON ---
    if (currentAudio && selectedLang === lang) {
      // Le même bouton est cliqué, on bascule la lecture
      if (isAudioPlaying) {
        currentAudio.pause();
        setIsAudioPlaying(false);
      } else {
        currentAudio.play().catch(error => console.error("Erreur de reprise audio:", error));
        setIsAudioPlaying(true);
      }
      return;
    }

    // --- ÉTAPE 2: ARRÊT DE L'AUDIO PRÉCÉDENT (si différent) ---
    if (currentAudio) {
      currentAudio.pause();
      // On réinitialise l'objet pour s'assurer qu'il n'y a pas de référence orpheline.
      // Cela force la création d'un nouvel objet pour le nouveau son.
      setCurrentAudio(null); 
    }

    // --- ÉTAPE 3: DÉMARRAGE DU NOUVEL AUDIO ---
    const audio = new Audio(file);
    audio.volume = 1;
    audio.play().then(() => {
      setCurrentAudio(audio);
      setSelectedLang(lang);
      setIsAudioPlaying(true);

      // S'assurer que l'état se met à jour quand le son est fini
      audio.onended = () => {
        setCurrentAudio(null);
        setIsAudioPlaying(false);
        setSelectedLang(null);
      };
    }).catch(error => {
        console.error("Échec du démarrage audio:", error);
        // Afficher un message d'erreur si le démarrage échoue
    });
  };

  /* -------- NAVIGATION -------- */
  const handleNavigation = () => {
    localStorage.setItem("app_language", selectedLang || "fr");
    localStorage.setItem("cover_page_viewed", "true");
    // Arrêt définitif avant la navigation
    if (currentAudio) currentAudio.pause();
    navigate("/home", { replace: true });
  };

  // --- HELPER UI ---
  const AudioButtonIcon = ({ lang }: { lang: string }) =>
    selectedLang === lang && isAudioPlaying ? (
      <PauseCircle className="w-7 h-7" />
    ) : (
      <PlayCircle className="w-7 h-7" />
    );

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">

      {/* BACKGROUND IMAGE REMPLACÉ */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_PATH}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      {/* DIMMER OVERLAY */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* SKIP BUTTON (Gardé, car il n'était pas lié à la vidéo) */}
      <button
        onClick={handleNavigation}
        className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full 
                   bg-white/10 border border-white/30 flex items-center justify-center"
      >
        <ChevronsRight className="text-white" />
      </button>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-[92%] max-w-sm p-7 rounded-3xl 
                   bg-white/12 backdrop-blur-xl border border-white/20"
      >

        {/* 🌍 ICON TRADUCTION ANIMÉE */}
        <motion.div
          className="flex justify-center mb-4"
          animate={{
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 10px rgba(0,200,255,0.4)",
                "0 0 25px rgba(255,80,80,0.6)",
                "0 0 10px rgba(0,200,255,0.4)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-white/15 
                       flex items-center justify-center border border-white/30"
          >
            🌍
          </motion.div>
        </motion.div>

        <p className="text-gray-200 text-sm mb-6 text-center">
          Sélectionnez votre langue
          <br />
          <span className="text-xs opacity-80">
            Traduction vocale intelligente
          </span>
        </p>

        {/* LANGUES */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-black/25">
            <Button onClick={() => playAudio(AUDIO_FILES.ln, "ln")} size="icon">
              <AudioButtonIcon lang="ln" />
            </Button>
            <span className="text-white">Lingala</span>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-black/25">
            <Button onClick={() => playAudio(AUDIO_FILES.fr, "fr")} size="icon">
              <AudioButtonIcon lang="fr" />
            </Button>
            <span className="text-white">Français</span>
          </div>
        </div>

        {selectedLang && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleNavigation}
              className="w-14 h-14 rounded-full bg-white border-4 border-red-500 
                         flex items-center justify-center"
            >
              <ChevronsRight className="text-red-500 w-8 h-8" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LanguageCoverPage;
