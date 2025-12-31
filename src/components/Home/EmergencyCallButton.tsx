import { useState, useEffect } from "react";
import { PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const EmergencyCallButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href="tel:118"
          title="Appeler le 118"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 150 }}
          className="fixed bottom-24 right-6 w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 z-50"
        >
          <PhoneCall className="h-8 w-8 text-white" />
        </motion.a>
      )}
    </AnimatePresence>
  );
};