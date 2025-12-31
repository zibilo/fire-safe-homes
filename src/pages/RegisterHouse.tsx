import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

/* ================= UTILITAIRES ANDROID ================= */

const withTimeout = <T,>(promise: Promise<T>, ms = 60000): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);

const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries = 7,
  baseDelay = 1500
): Promise<T> => {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || "";
      const isNetwork =
        err?.isTrusted === true ||
        msg.includes("fetch") ||
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg === "";

      console.warn(`Retry ${attempt}/${maxRetries}`, err);

      if (!isNetwork || attempt === maxRetries) break;
      await new Promise(r => setTimeout(r, baseDelay * attempt));
    }
  }
  throw lastError ?? new Error("Erreur réseau inconnue");
};

/* ================= COMPOSANT ================= */

const RegisterHouse = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStep, setSubmitStep] = useState("");

  const { formData, updateFormData, resetForm } = useHouseForm();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  /* ---------- ANDROID SAFE ---------- */
  useEffect(() => {
    window.onerror = () => true;
    window.onunhandledrejection = () => true;
  }, []);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    if (!loading && !user) {
      toast.error("Connexion requise");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  /* ---------- OFFLINE DRAFT ---------- */
  useEffect(() => {
    const draft = localStorage.getItem("houseDraft");
    if (draft) {
      updateFormData(JSON.parse(draft));
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem("houseDraft", JSON.stringify(formData));
  };

  /* ---------- VALIDATION ---------- */
  const validateStep = (step: number) => {
    if (step === 1 && !formData.ownerName) {
      toast.error("Nom du propriétaire requis");
      return false;
    }
    if (step === 2 && !formData.phone) {
      toast.error("Téléphone requis");
      return false;
    }
    if (
      step === 4 &&
      (!formData.surfaceArea || !formData.numberOfRooms)
    ) {
      toast.error("Champs techniques requis");
      return false;
    }
    return true;
  };

  /* ---------- NAVIGATION ---------- */
  const next = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(s => Math.min(s + 1, totalSteps));
  };

  const prev = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  /* ---------- UPLOAD ---------- */
  const uploadFile = async (file: File, label: string) => {
    setSubmitStep(label);

    return retryOperation(async () => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user!.id}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (error) throw error;

      const { data: url } = supabase.storage
        .from("documents")
        .getPublicUrl(data.path);

      return url.publicUrl;
    });
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    if (submitting || !user) return;
    if (!validateStep(4)) return;

    if (!navigator.onLine) {
      toast.error("Aucune connexion Internet");
      return;
    }

    setSubmitting(true);
    saveDraft();
    setSubmitProgress(0);

    try {
      let docs: string[] = [...formData.documentsUrls];

      if (formData.idCardRectoFile) {
        const url = await withTimeout(
          uploadFile(formData.idCardRectoFile, "Upload CNI recto"),
          60000
        );
        docs.push(url);
        setSubmitProgress(30);
      }

      if (formData.idCardVersoFile) {
        const url = await withTimeout(
          uploadFile(formData.idCardVersoFile, "Upload CNI verso"),
          60000
        );
        docs.push(url);
        setSubmitProgress(60);
      }

      setSubmitStep("Enregistrement...");
      await retryOperation(() =>
        supabase.from("houses").insert({
          user_id: user.id,
          owner_name: formData.ownerName,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          street: formData.street,
          parcel_number: formData.parcelNumber,
          phone: formData.phone,
          documents_urls: docs,
          photos_urls: formData.photosUrls,
          plan_url: formData.planUrl,
          number_of_rooms: formData.numberOfRooms,
          surface_area: formData.surfaceArea,
          construction_year: formData.constructionYear,
          heating_type: formData.heatingType,
          security_notes: formData.securityNotes,
        }),
      );

      setSubmitProgress(100);
      toast.success("Dossier envoyé avec succès");

      localStorage.removeItem("houseDraft");
      resetForm();
      navigate("/");
    } catch (e) {
      console.error(e);
      toast.error(
        "Connexion instable. Les données sont sauvegardées. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <SubmitProgressOverlay
        open={submitting}
        progress={submitProgress}
        step={submitStep}
      />

      <div className="max-w-xl mx-auto p-4">
        <h2 className="text-lg font-bold mb-2">
          Étape {currentStep} / {totalSteps}
        </h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {currentStep === 1 && <StepOne />}
            {currentStep === 2 && <StepTwo />}
            {currentStep === 3 && <StepThree />}
            {currentStep === 4 && <StepFour />}
            {currentStep === 5 && <StepFive />}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prev}>
              Retour
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button onClick={next}>Continuer</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Envoi..." : "Terminer"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterHouse;
        
