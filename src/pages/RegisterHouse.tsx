import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepOne from "@/components/HouseForm/StepOne";
import StepTwo from "@/components/HouseForm/StepTwo";
import StepThree from "@/components/HouseForm/StepThree";
import StepFour from "@/components/HouseForm/StepFour";
import StepFive from "@/components/HouseForm/StepFive";
import { useHouseForm } from "@/hooks/useHouseForm";
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
  
  const { formData, updateFormData, resetForm } = useHouseForm();
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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.ownerName?.trim()) {
            toast.error("Le nom du propriétaire est obligatoire.");
            return false;
        }
        if (!formData.idCardRecto) {
            toast.error("La photo recto de la pièce d'identité est obligatoire.");
            return false;
        }
        if (!formData.idCardVerso) {
            toast.error("La photo verso de la pièce d'identité est obligatoire.");
            return false;
        }
        return true;

      case 2:
        if (!formData.city?.trim() || !formData.district?.trim() || !formData.neighborhood?.trim() || !formData.street?.trim() || !formData.parcelNumber?.trim()) {
            toast.error("Tous les champs d'adresse sont obligatoires.");
            return false;
        }
        if (!formData.phone?.trim()) {
             toast.error("Le numéro de téléphone est obligatoire.");
             return false;
        }
        return true;

      case 3:
        return true;

      case 4:
        if (!formData.numberOfRooms || !formData.surfaceArea || !formData.constructionYear) {
            toast.error("Surface, nombre de pièces et année sont obligatoires.");
            return false;
        }
        if (!formData.heatingType) {
            toast.error("Le type de chauffage/énergie est obligatoire.");
            return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

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
    if (!validateStep(4)) return;

    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitStep("Préparation...");
    
    const retryOperation = async <T,>(
      operation: () => Promise<T>,
      maxRetries: number = 5,
      delay: number = 2000
    ): Promise<T> => {
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error: any) {
          lastError = error;
          const errorMsg = error?.message || error?.toString() || 'Unknown error';
          console.warn(`Tentative ${attempt}/${maxRetries} échouée:`, errorMsg);
          
          // Si c'est une erreur réseau ou "isTrusted", on réessaie
          const isNetworkError = 
            errorMsg.includes('fetch') || 
            errorMsg.includes('network') || 
            errorMsg.includes('Failed to fetch') ||
            errorMsg.includes('NetworkError') ||
            errorMsg.includes('timeout') ||
            error?.isTrusted === true ||
            (typeof error === 'object' && 'isTrusted' in error);
          
          if (attempt < maxRetries && isNetworkError) {
            setSubmitStep(`Reconnexion... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          } else if (!isNetworkError) {
            // Si ce n'est pas une erreur réseau, on ne réessaie pas
            throw error;
          }
        }
      }
      throw lastError;
    };

    try {
      let rectoUrl = "";
      let versoUrl = "";
      
      // Calculer le nombre total d'étapes pour le pourcentage
      const hasRecto = !!formData.idCardRectoFile;
      const hasVerso = !!formData.idCardVersoFile;
      const totalUploadSteps = (hasRecto ? 1 : 0) + (hasVerso ? 1 : 0) + 1; // +1 pour l'insertion DB
      let completedSteps = 0;

      const uploadFileWithProgress = async (
        file: File, 
        path: string,
        stepName: string
      ): Promise<string> => {
        setSubmitStep(stepName);
        
        return retryOperation(async () => {
          const ext = file.name.split('.').pop();
          const fileName = `${user.id}/${path}_${Date.now()}.${ext}`;
          
          // Simuler progression pendant l'upload
          const startProgress = (completedSteps / totalUploadSteps) * 100;
          const endProgress = ((completedSteps + 1) / totalUploadSteps) * 100;
          
          // Animation de progression
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
        });
      };

      if (formData.idCardRectoFile) {
        rectoUrl = await uploadFileWithProgress(
          formData.idCardRectoFile, 
          'cni_recto',
          "Upload CNI recto..."
        );
      }
      
      if (formData.idCardVersoFile) {
        versoUrl = await uploadFileWithProgress(
          formData.idCardVersoFile, 
          'cni_verso',
          "Upload CNI verso..."
        );
      }

      const allDocs = [...formData.documentsUrls];
      if (rectoUrl) allDocs.push(rectoUrl);
      if (versoUrl) allDocs.push(versoUrl);

      setSubmitStep("Enregistrement des données...");
      
      const insertHouse = async () => {
        const { data, error } = await supabase.from("houses").insert({
          user_id: user.id,
          owner_name: formData.ownerName,
          property_type: formData.propertyType,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          street: formData.street,
          parcel_number: formData.parcelNumber,
          phone: formData.phone,
          building_name: formData.buildingName,
          floor_number: formData.floorNumber,
          apartment_number: formData.apartmentNumber,
          total_floors: formData.totalFloors,
          elevator_available: formData.elevatorAvailable,
          description: formData.description || "Aucune description",
          documents_urls: allDocs,
          photos_urls: formData.photosUrls,
          plan_url: formData.planUrl,
          number_of_rooms: formData.numberOfRooms,
          surface_area: formData.surfaceArea,
          construction_year: formData.constructionYear,
          heating_type: formData.heatingType,
          sensitive_objects: formData.sensitiveObjects,
          security_notes: formData.securityNotes,
        }).select().maybeSingle();

        if (error) throw error;
        return data;
      };

      const data = await retryOperation(insertHouse);
      
      setSubmitProgress(100);
      setSubmitStep("Terminé !");
      
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("Dossier envoyé avec succès !");

      if (formData.planUrl && data) {
        toast.info("Analyse du plan en cours...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        fetch('https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planUrl: formData.planUrl, houseId: data.id }),
          signal: controller.signal
        })
        .catch((err) => console.warn("Analyse plan en arrière-plan:", err.message))
        .finally(() => clearTimeout(timeoutId));
      }

      resetForm();
      navigate("/");
    } catch (error: any) {
      console.error("Erreur d'enregistrement:", error);
      
      let errorMessage = "Erreur lors de l'envoi";
      const errorStr = error?.message || error?.toString() || '';
      
      if (
        errorStr.includes('fetch') || 
        errorStr.includes('network') || 
        errorStr.includes('Failed to fetch') ||
        errorStr.includes('NetworkError') ||
        error?.isTrusted === true ||
        (typeof error === 'object' && 'isTrusted' in error)
      ) {
        errorMessage = "Problème de connexion réseau. Vérifiez votre connexion Internet et réessayez.";
      } else if (errorStr.includes('timeout')) {
        errorMessage = "La requête a pris trop de temps. Réessayez.";
      } else if (errorStr) {
        errorMessage = errorStr;
      }
      
      toast.error(errorMessage);
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
    <div className="min-h-screen bg-[#10141D] text-white flex flex-col font-sans">
      
      {/* Progress Overlay */}
      <AnimatePresence>
        <SubmitProgressOverlay 
          progress={submitProgress} 
          currentStep={submitStep} 
          isVisible={submitting} 
        />
      </AnimatePresence>
      
      {/* HEADER FIXE */}
      <div className="flex-shrink-0 bg-[#10141D] z-50">
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
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-grow overflow-y-auto relative p-6 pb-28">
        <div className="mb-8 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
             {currentStep === 1 && "Identité du propriétaire"}
             {currentStep === 2 && "Localisation du bien"}
             {currentStep === 3 && "Documents techniques"}
             {currentStep === 4 && "Caractéristiques"}
             {currentStep === 5 && "Sûreté & Risques"}
          </h2>
          <p className="text-sm text-gray-400 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#C41E25]"></span>
             Tous les champs marqués d'un * sont obligatoires
          </p>
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
                className="w-full"
            >
                {currentStep === 1 && <StepOne formData={formData} updateFormData={updateFormData} />}
                {currentStep === 2 && <StepTwo formData={formData} updateFormData={updateFormData} />}
                {currentStep === 3 && <StepThree formData={formData} updateFormData={updateFormData} />}
                {currentStep === 4 && <StepFour formData={formData} updateFormData={updateFormData} />}
                {currentStep === 5 && <StepFive formData={formData} updateFormData={updateFormData} />}
            </motion.div>
            </AnimatePresence>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 bg-[#10141D] border-t border-white/10 p-4 px-6 z-50">
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
            <Button onClick={() => handleSubmit()} className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20" disabled={submitting}>
              {submitting ? "Envoi..." : "Terminer l'inscription"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterHouse;
