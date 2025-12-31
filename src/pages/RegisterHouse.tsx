import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { houseFormSchema, HouseFormData } from "@/lib/houseFormSchema";

import StepOne from "@/components/HouseForm/StepOne";
import StepTwo from "@/components/HouseForm/StepTwo";
import StepThree from "@/components/HouseForm/StepThree";
import StepFour from "@/components/HouseForm/StepFour";
import StepFive from "@/components/HouseForm/StepFive";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubmitProgressOverlay } from "@/components/ui/upload-progress";

const RegisterHouse = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const totalSteps = 5;
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStep, setSubmitStep] = useState("");

  const methods = useForm<HouseFormData>({
    resolver: zodResolver(houseFormSchema),
    mode: "onChange",
  });

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Vous devez être connecté pour enregistrer une maison");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const steps = [
    { number: 1, title: "Identité & Bien" },
    { number: 2, title: "Adresse complète" },
    { number: 3, title: "Documents & Infos" },
    { number: 4, title: "Caractéristiques" },
    { number: 5, title: "Sécurité" },
  ];

  const stepFields: (keyof HouseFormData)[][] = [
    ['ownerName', 'propertyType'],
    ['city', 'district', 'neighborhood', 'street', 'parcelNumber', 'phone'],
    [],
    ['numberOfRooms', 'surfaceArea', 'constructionYear', 'heatingType'],
    [],
  ];

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep - 1];
    const isValid = await methods.trigger(fieldsToValidate);

    if (!isValid) {
      toast.error("Veuillez corriger les erreurs avant de continuer.");
      return;
    }

    if (currentStep < totalSteps) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (formData: HouseFormData) => {
    if (!user) return;

    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitStep("Préparation...");

    // ... (Votre logique de retryOperation reste la même)

    try {
      const rectoUrl = "";
      const versoUrl = "";

      const hasRecto = !!formData.idCardRectoFile;
      const hasVerso = !!formData.idCardVersoFile;
      // ... (Votre logique d'upload et d'insertion reste la même, en utilisant `formData`)

      toast.success("Dossier envoyé avec succès !");
      methods.reset();
      navigate("/");
    } catch (error: unknown) {
      console.error("Erreur d'enregistrement:", error);
      const message = error instanceof Error ? error.message : "Une erreur est survenue.";
      toast.error(message);
    } finally {
      setSubmitting(false);
      setSubmitProgress(0);
      setSubmitStep("");
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <FormProvider {...methods}>
      <div className="h-screen bg-[#10141D] text-white flex flex-col font-sans overflow-hidden">
        <AnimatePresence>
          <SubmitProgressOverlay
            progress={submitProgress}
            currentStep={submitStep}
            isVisible={submitting}
          />
        </AnimatePresence>

        <div className="flex-none bg-[#10141D] z-50">
          <div className="flex items-center px-4 h-14 border-b border-white/5">
            <Link to="/">
              <X className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white transition-colors" />
            </Link>
            <h1 className="ml-4 text-sm font-bold text-white tracking-widest uppercase">
              Étape {currentStep} / {totalSteps} : {steps[currentStep - 1].title}
            </h1>
          </div>
          <div className="w-full h-1 bg-[#1F2433]">
            <motion.div
              className="h-full bg-[#C41E25]"
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 pb-28">
          <div className="mb-8 max-w-xl mx-auto">
             {/* ... (Titre et sous-titre) */}
          </div>

          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              >
                {currentStep === 1 && <StepOne />}
                {currentStep === 2 && <StepTwo />}
                {currentStep === 3 && <StepThree />}
                {currentStep === 4 && <StepFour />}
                {currentStep === 5 && <StepFive />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-none bg-[#10141D] border-t border-white/10 p-4 px-6 z-50">
          <div className="flex items-center justify-between max-w-xl mx-auto w-full gap-4">
            {currentStep > 1 ? (
               <Button variant="ghost" onClick={handlePrevious} className="text-gray-400 hover:text-white hover:bg-white/5 pl-0 pr-4">
                 <ChevronLeft className="mr-1 h-5 w-5" /> Retour
               </Button>
            ) : <div className="w-20"></div>}

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20">
                Continuer
              </Button>
            ) : (
              <Button onClick={methods.handleSubmit(handleSubmit)} className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20" disabled={submitting}>
                {submitting ? "Envoi..." : "Terminer l'inscription"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default RegisterHouse;
