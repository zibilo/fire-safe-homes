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

const RegisterHouse = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const totalSteps = 5;
  const [submitting, setSubmitting] = useState(false);
  
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
    { number: 1, title: "Identité & Bien" }, // Titre mis à jour
    { number: 2, title: "Adresse complète" },
    { number: 3, title: "Documents & Infos" },
    { number: 4, title: "Caractéristiques" },
    { number: 5, title: "Sécurité" },
  ];

  // --- VALIDATION STRICTE PAR ÉTAPE ---
  const validateStep = (step: number) => {
    switch (step) {
      case 1: // Identité
        if (!formData.ownerName?.trim()) {
            toast.error("Le nom du propriétaire est obligatoire.");
            return false;
        }
        // Validation CNI
        if (!formData.idCardRecto) {
            toast.error("La photo recto de la pièce d'identité est obligatoire.");
            return false;
        }
        if (!formData.idCardVerso) {
            toast.error("La photo verso de la pièce d'identité est obligatoire.");
            return false;
        }
        return true;

      case 2: // Adresse
        if (!formData.city?.trim() || !formData.district?.trim() || !formData.neighborhood?.trim() || !formData.street?.trim() || !formData.parcelNumber?.trim()) {
            toast.error("Tous les champs d'adresse sont obligatoires.");
            return false;
        }
        if (!formData.phone?.trim()) {
             toast.error("Le numéro de téléphone est obligatoire.");
             return false;
        }
        return true;

      case 3: // Documents (Description facultative)
        // On peut laisser le plan optionnel ou le rendre obligatoire selon besoin
        return true;

      case 4: // Détails techniques (Tout obligatoire)
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
    // Vérification avant de passer
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

    // Dernière validation
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      // 1. Upload des images CNI si elles existent en tant que File
      let rectoUrl = "";
      let versoUrl = "";

      // Fonction helper d'upload
      const uploadFile = async (file: File | undefined, path: string) => {
        if (!file) return null;
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/${path}_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
        return urlData.publicUrl;
      };

      if (formData.idCardRectoFile) {
         rectoUrl = await uploadFile(formData.idCardRectoFile, 'cni_recto') || "";
      }
      if (formData.idCardVersoFile) {
         versoUrl = await uploadFile(formData.idCardVersoFile, 'cni_verso') || "";
      }

      // 2. Insertion des documents dans la liste globale (pour garder la compatibilité base)
      const allDocs = [...formData.documentsUrls];
      if (rectoUrl) allDocs.push(rectoUrl);
      if (versoUrl) allDocs.push(versoUrl);

      // 3. Insertion en base
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
        description: formData.description || "Aucune description", // Valeur par défaut
        documents_urls: allDocs, // Inclut la CNI
        photos_urls: formData.photosUrls,
        plan_url: formData.planUrl,
        number_of_rooms: formData.numberOfRooms,
        surface_area: formData.surfaceArea,
        construction_year: formData.constructionYear,
        heating_type: formData.heatingType,
        sensitive_objects: formData.sensitiveObjects,
        security_notes: formData.securityNotes,
      }).select().single();

      if (error) throw error;

      toast.success("Dossier envoyé avec succès !");

      // Analyse IA (si plan)
      if (formData.planUrl && data) {
        toast.info("Analyse du plan en cours...");
        fetch('https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planUrl: formData.planUrl, houseId: data.id })
        }).catch(console.error);
      }

      resetForm();
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de l'envoi : " + (error.message || "Inconnue"));
    } finally {
      setSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="h-screen bg-[#10141D] text-white flex flex-col font-sans overflow-hidden">
      
      {/* HEADER FIXE */}
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
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 pb-28">
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
            <Button onClick={handleSubmit} className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20" disabled={submitting}>
              {submitting ? "Envoi..." : "Terminer l'inscription"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterHouse;
