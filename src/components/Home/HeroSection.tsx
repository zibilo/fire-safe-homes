import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Plus, HomeIcon } from "lucide-react";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center space-y-4"
      >
        <Shield className="h-24 w-24 text-red-500" strokeWidth={1} />
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">
          Alerte Incendie
        </h1>
        <p className="text-base md:text-lg text-gray-400 max-w-md">
          Votre connexion directe avec les services d'urgence. Signalez un incendie ou enregistrez votre propriété pour une meilleure protection.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row w-full max-w-sm mx-auto gap-4 mt-8"
      >
        <Link to="/loc/urgence" className="flex-1">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-900/40"
          >
            <MapPin className="mr-3 h-6 w-6" />
            Urgence Incendie
          </Button>
        </Link>
        <Link to="/register-house" className="flex-1">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg font-bold border-gray-700 bg-gray-900/50 hover:bg-gray-800/70 text-gray-300 rounded-xl"
          >
            <HomeIcon className="mr-3 h-6 w-6" />
            Enregistrer
          </Button>
        </Link>
      </motion.div>
    </main>
  );
};