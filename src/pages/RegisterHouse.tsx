import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { houseSchema } from "@/schemas/houseSchema";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StepOne from "@/components/HouseForm/StepOne";
import StepTwo from "@/components/HouseForm/StepTwo";
import StepThree from "@/components/HouseForm/StepThree";
import StepFour from "@/components/HouseForm/StepFour";
import StepFive from "@/components/HouseForm/StepFive";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubmitProgressOverlay } from "@/components/ui/upload-progress";

type FormData = z.infer<typeof houseSchema>;

const RegisterHouse = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const totalSteps = 5;

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStep, setSubmitStep] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const methods = useForm<FormData>({
    resolver: zodResolver(houseSchema),
    mode: "onChange",
  });

  const { trigger, handleSubmit } = methods;

  const steps = [
    { number: 1, title: "Identité & Bien", fields: ["ownerName", "idCardRecto", "idCardVerso", "propertyType"] },
    { number: 2, title: "Adresse", fields: ["city", "district", "neighborhood", "street", "parcelNumber", "phone"] },
    { number: 3, title: "Description", fields: ["description"] },
    { number: 4, title: "Caractéristiques", fields: [] },
    { number: 5, title: "Sécurité", fields: [] },
  ];

  const handleNext = async () => {
    const fields = steps[currentStep - 1].fields;
    const output = await trigger(fields as any, { shouldFocus: true });

    if (!output) return;

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

  const onSubmit = async (formData: FormData) => {
    if (!user) {
        toast.error("Vous devez être connecté pour soumettre le formulaire.");
        return;
    }
    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitStep("Vérification de la session...");

    try {
        // Rafraîchir la session pour éviter les erreurs de token expiré
        const { error: sessionError } = await supabase.auth.refreshSession();
        if (sessionError) throw new Error("Votre session a expiré. Veuillez vous reconnecter.");

        setSubmitStep("Préparation...");

        const uploadFile = async (file: File, path: string) => {
            const ext = file.name.split('.').pop();
            const fileName = `${user.id}/${path}_${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, file);
            if (error) throw error;
            return supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl;
        };

        setSubmitStep("Téléchargement du recto...");
        const idCardRectoUrl = await uploadFile(formData.idCardRecto[0], 'cni_recto');
        setSubmitProgress(50);

        setSubmitStep("Téléchargement du verso...");
        const idCardVersoUrl = await uploadFile(formData.idCardVerso[0], 'cni_verso');
        setSubmitProgress(75);

        setSubmitStep("Enregistrement des données...");
        const { error: insertError } = await supabase.from("houses").insert({
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
            description: formData.description,
            documents_urls: [idCardRectoUrl, idCardVersoUrl],
            plan_url: formData.planUrl,
            number_of_rooms: formData.numberOfRooms,
            surface_area: formData.surfaceArea,
            construction_year: formData.constructionYear,
            heating_type: formData.heatingType,
            sensitive_objects: formData.sensitiveObjects,
            security_notes: formData.securityNotes,
        });

        if (insertError) throw insertError;

        setSubmitProgress(100);
        setSubmitStep("Terminé !");
        await new Promise(resolve => setTimeout(resolve, 500));

        toast.success("Maison enregistrée avec succès !");
        navigate("/");

    } catch (error: any) {
        let errorMessage = "Erreur lors de la soumission.";
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'isTrusted' in error) {
            errorMessage = "Problème de connexion. Veuillez rafraîchir la page et réessayer.";
        }
        toast.error(errorMessage);
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
    <FormProvider {...methods}>
      <div className="h-screen bg-[#10141D] text-white flex flex-col font-sans overflow-hidden">

        <AnimatePresence>
          <SubmitProgressOverlay
            progress={submitProgress}
            currentStep={submitStep}
            isVisible={submitting}
          />
        </AnimatePresence>

        {/* HEADER */}
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

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 pb-28">
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
                  {currentStep === 1 && <StepOne />}
                  {currentStep === 2 && <StepTwo />}
                  {currentStep === 3 && <StepThree />}
                  {currentStep === 4 && <StepFour />}
                  {currentStep === 5 && <StepFive />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex-none bg-[#10141D] border-t border-white/10 p-4 px-6 z-50">
            <div className="flex items-center justify-between max-w-xl mx-auto w-full gap-4">
              {currentStep > 1 ? (
                <Button type="button" variant="ghost" onClick={handlePrevious} className="text-gray-400 hover:text-white hover:bg-white/5 pl-0 pr-4">
                  <ChevronLeft className="mr-1 h-5 w-5" /> Retour
                </Button>
              ) : <div className="w-20"></div>}

              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20">
                  Continuer
                </Button>
              ) : (
                <Button type="submit" className="bg-[#C41E25] hover:bg-[#a0181e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-red-900/20" disabled={submitting}>
                  {submitting ? "Envoi..." : "Terminer l'inscription"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default RegisterHouse;
