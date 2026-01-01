import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FormStepOne from "@/components/HouseForm/FormStepOne";
import FormStepTwo from "@/components/HouseForm/FormStepTwo";
import FormStepThree from "@/components/HouseForm/FormStepThree";
import FormStepFour from "@/components/HouseForm/FormStepFour";
import FormStepFive from "@/components/HouseForm/FormStepFive";
import { houseFormSchema, HouseFormSchemaType, defaultFormValues } from "@/hooks/useHouseFormSchema";
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
  const [idCardFiles, setIdCardFiles] = useState<{ recto?: File; verso?: File }>({});
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<HouseFormSchemaType>({
    resolver: zodResolver(houseFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Vous devez être connecté pour enregistrer une maison");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const steps = [
    { number: 1, title: "Identité", icon: "👤" },
    { number: 2, title: "Adresse", icon: "📍" },
    { number: 3, title: "Documents", icon: "📄" },
    { number: 4, title: "Détails", icon: "🏠" },
    { number: 5, title: "Sécurité", icon: "🛡️" },
  ];

  const validateCurrentStep = async (): Promise<boolean> => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        if (!values.ownerName?.trim()) {
          toast.error("Le nom du propriétaire est obligatoire");
          return false;
        }
        if (!values.idCardRecto) {
          toast.error("La photo recto de la pièce d'identité est obligatoire");
          return false;
        }
        if (!values.idCardVerso) {
          toast.error("La photo verso de la pièce d'identité est obligatoire");
          return false;
        }
        return true;

      case 2:
        if (!values.city?.trim() || !values.district?.trim() || !values.neighborhood?.trim() || 
            !values.street?.trim() || !values.parcelNumber?.trim()) {
          toast.error("Tous les champs d'adresse sont obligatoires");
          return false;
        }
        if (!values.phone?.trim() || values.phone.length < 8) {
          toast.error("Numéro de téléphone invalide");
          return false;
        }
        return true;

      case 3:
        return true;

      case 4:
        return true;

      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

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

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitStep("Préparation...");

    try {
      const values = form.getValues();
      let rectoUrl = "";
      let versoUrl = "";
      
      const hasRecto = !!idCardFiles.recto;
      const hasVerso = !!idCardFiles.verso;
      const totalUploadSteps = (hasRecto ? 1 : 0) + (hasVerso ? 1 : 0) + 1;
      let completedSteps = 0;

      const uploadFile = async (file: File, path: string, stepName: string): Promise<string> => {
        setSubmitStep(stepName);
        
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/${path}_${Date.now()}.${ext}`;
        
        const startProgress = (completedSteps / totalUploadSteps) * 100;
        const endProgress = ((completedSteps + 1) / totalUploadSteps) * 100;
        
        const progressInterval = setInterval(() => {
          setSubmitProgress(prev => {
            const increment = (endProgress - startProgress) / 20;
            const newValue = prev + increment;
            return newValue < endProgress - 5 ? newValue : prev;
          });
        }, 100);
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(fileName, file);
        
        clearInterval(progressInterval);
        
        if (error) throw error;
        
        completedSteps++;
        setSubmitProgress((completedSteps / totalUploadSteps) * 100);
        
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);
        return urlData.publicUrl;
      };

      if (idCardFiles.recto) {
        rectoUrl = await uploadFile(idCardFiles.recto, 'cni_recto', "Upload CNI recto...");
      }
      
      if (idCardFiles.verso) {
        versoUrl = await uploadFile(idCardFiles.verso, 'cni_verso', "Upload CNI verso...");
      }

      const allDocs = [...values.documentsUrls];
      if (rectoUrl) allDocs.push(rectoUrl);
      if (versoUrl) allDocs.push(versoUrl);

      setSubmitStep("Enregistrement des données...");
      
      const { data, error } = await supabase.from("houses").insert({
        user_id: user.id,
        owner_name: values.ownerName,
        property_type: values.propertyType,
        city: values.city,
        district: values.district,
        neighborhood: values.neighborhood,
        street: values.street,
        parcel_number: values.parcelNumber,
        phone: values.phone,
        building_name: values.buildingName,
        floor_number: values.floorNumber,
        apartment_number: values.apartmentNumber,
        total_floors: values.totalFloors,
        elevator_available: values.elevatorAvailable,
        description: values.description || "Aucune description",
        documents_urls: allDocs,
        photos_urls: values.photosUrls,
        plan_url: values.planUrl,
        number_of_rooms: values.numberOfRooms,
        surface_area: values.surfaceArea,
        construction_year: values.constructionYear,
        heating_type: values.heatingType,
        sensitive_objects: values.sensitiveObjects,
        security_notes: values.securityNotes,
        id_card_recto_url: rectoUrl,
        id_card_verso_url: versoUrl,
      }).select().maybeSingle();

      if (error) throw error;
      
      setSubmitProgress(100);
      setSubmitStep("Terminé !");
      
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("Dossier envoyé avec succès !");

      if (values.planUrl && data) {
        toast.info("Analyse du plan en cours...");
        fetch('https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planUrl: values.planUrl, houseId: data.id }),
        }).catch((err) => console.warn("Analyse plan:", err.message));
      }

      form.reset(defaultFormValues);
      setIdCardFiles({});
      navigate("/");
    } catch (error: any) {
      console.error("Erreur d'enregistrement:", error);
      toast.error(error?.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
      setSubmitProgress(0);
      setSubmitStep("");
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#0f131a] text-white flex flex-col font-sans">
      
      <AnimatePresence>
        <SubmitProgressOverlay 
          progress={submitProgress} 
          currentStep={submitStep} 
          isVisible={submitting} 
        />
      </AnimatePresence>
      
      {/* Header */}
      <header className="sticky top-0 bg-[#0f131a]/95 backdrop-blur-sm z-50 border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="p-2 -ml-2">
            <X className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-sm font-bold text-white tracking-wide">
            Enregistrer un bien
          </h1>
          <div className="w-10" />
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-red-600 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between px-4 py-3">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`flex flex-col items-center ${
                currentStep >= step.number ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                currentStep === step.number 
                  ? "bg-red-500 text-white" 
                  : currentStep > step.number 
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-gray-400"
              }`}>
                {currentStep > step.number ? "✓" : step.icon}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ 
                x: { type: "spring", stiffness: 300, damping: 30 }, 
                opacity: { duration: 0.15 } 
              }}
            >
              {currentStep === 1 && (
                <FormStepOne 
                  form={form} 
                  idCardFiles={idCardFiles} 
                  setIdCardFiles={setIdCardFiles} 
                />
              )}
              {currentStep === 2 && <FormStepTwo form={form} />}
              {currentStep === 3 && <FormStepThree form={form} />}
              {currentStep === 4 && <FormStepFour form={form} />}
              {currentStep === 5 && <FormStepFive form={form} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0f131a]/95 backdrop-blur-sm border-t border-white/10 p-4 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto gap-3">
          {currentStep > 1 ? (
            <Button 
              variant="ghost" 
              onClick={handlePrevious} 
              className="text-gray-400 hover:text-white hover:bg-white/5 h-12 px-4"
            >
              <ChevronLeft className="mr-1 h-5 w-5" /> 
              <span className="hidden sm:inline">Retour</span>
            </Button>
          ) : (
            <div className="w-16" />
          )}

          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext} 
              className="flex-1 max-w-[200px] bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-900/30"
            >
              Continuer
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="flex-1 max-w-[200px] bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-green-900/30" 
              disabled={submitting}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default RegisterHouse;
