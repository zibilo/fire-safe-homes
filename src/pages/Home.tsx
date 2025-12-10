import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Shield, 
  Plus, 
  Home as HomeIcon, 
  Users, 
  BookOpen 
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#10141D] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* 1. Header du haut */}
      <header className="flex justify-between items-center px-6 py-4 sticky top-0 z-20 bg-[#10141D]/90 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight">Secure Pompiers</h1>
        <Link to="/register-house">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Plus className="w-6 h-6 text-gray-300" />
            </button>
        </Link>
      </header>

      {/* 2. Contenu Principal */}
      {/* pb-24 ajusté car le footer est plus petit */}
      <main className="flex-1 px-4 pb-24 flex flex-col gap-6 overflow-y-auto">
        
        {/* Carte "État du système" */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1F2433] rounded-2xl p-4 flex items-center justify-between shadow-lg border border-white/5"
        >
          <span className="font-semibold text-sm text-gray-200">État du système</span>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-red-500 rounded-full border-l-transparent border-b-transparent border-r-transparent rotate-45"></div>
              <span className="text-[10px] font-bold text-red-400">ON</span>
            </div>
            <span className="text-gray-400 text-xs">Actif</span>
          </div>
        </motion.div>

        {/* Carte Principale (Rouge Bordeaux) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gradient-to-b from-[#350a0a] to-[#220505] rounded-[2rem] p-8 flex-1 flex flex-col items-center text-center shadow-2xl relative border border-white/5 min-h-[400px] justify-center"
        >
          
          {/* Illustration */}
          <div className="mb-8 relative group cursor-pointer">
            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
            <Shield className="w-32 h-32 text-white/90 drop-shadow-xl transform -rotate-y-12 group-hover:scale-105 transition-all duration-500" strokeWidth={1} />
          </div>

          {/* Titre */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            Protégez votre foyer<br />Dont de Lg-consultingue engeneri 
          </h2>

          {/* Description */}
          <p className="text-white/70 text-sm md:text-base mb-8 leading-relaxed max-w-xs mx-auto">
            Système de gestion et prévention des incendies.
          </p>

          {/* Bouton Principal */}
          <Link to="/register-house" className="w-full max-w-xs">
            <Button 
              className="w-full bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-full h-12 font-semibold text-base shadow-lg shadow-red-900/50 transition-all transform active:scale-95"
            >
              Enregistrer une maison
            </Button>
          </Link>

          {/* Lien Secondaire */}
          <div className="mt-6">
             <Link to="/blog" className="text-xs text-white/50 hover:text-white transition-colors underline">
               Comment ça marche ?
             </Link>
          </div>

        </motion.div>
      </main>

      {/* 3. Bouton Flottant (FAB) */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="fixed bottom-20 right-6 z-20"
      >
        <Link to="/register-house">
          <button className="w-14 h-14 bg-[#C41E25] rounded-full flex items-center justify-center shadow-xl shadow-black/40 hover:bg-[#a0181e] active:scale-90 transition-all">
            <Plus className="w-8 h-8 text-white" />
          </button>
        </Link>
      </motion.div>

      {/* 4. Barre de Navigation Mobile - Version Compacte */}
   

    </div>
  );
};

export default Home;
