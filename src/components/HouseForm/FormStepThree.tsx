import { UseFormReturn } from "react-hook-form";
import { HouseFormSchemaType } from "@/hooks/useHouseFormSchema";
import { useState } from "react";
import { Upload, FileText, X, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FormStepThreeProps {
  form: UseFormReturn<HouseFormSchemaType>;
}

const FormStepThree = ({ form }: FormStepThreeProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [planPreview, setPlanPreview] = useState<string | null>(form.watch('planUrl') || null);

  const handlePlanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format non supporté. Utilisez JPG, PNG ou PDF');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 10MB)');
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('house-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('house-plans')
        .getPublicUrl(data.path);

      form.setValue('planUrl', urlData.publicUrl);
      setPlanPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : 'pdf');
      
      toast.success('Plan téléchargé avec succès');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const removePlan = () => {
    form.setValue('planUrl', undefined);
    setPlanPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-200">
          Description de la propriété
        </label>
        <textarea
          {...form.register('description')}
          placeholder="Décrivez votre propriété (accès, particularités...)"
          rows={4}
          className="w-full px-4 py-3 text-base bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
        />
      </div>

      {/* Plan upload */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200">
          Plan de la maison
        </label>
        <p className="text-xs text-gray-500">
          Téléchargez un plan pour une analyse automatique par IA
        </p>

        {planPreview ? (
          <div className="relative border-2 border-green-500/30 rounded-2xl p-4 bg-green-500/5">
            <button
              type="button"
              onClick={removePlan}
              className="absolute top-3 right-3 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
            
            {planPreview !== 'pdf' ? (
              <img
                src={planPreview}
                alt="Plan"
                className="w-full h-40 object-contain rounded-xl"
              />
            ) : (
              <div className="flex items-center gap-3 py-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Plan PDF téléchargé</p>
                  <p className="text-sm text-gray-400">Analyse après enregistrement</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handlePlanUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center transition-all active:bg-white/5">
              {uploading ? (
                <Loader2 className="h-12 w-12 text-red-400 animate-spin mx-auto mb-3" />
              ) : (
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              )}
              <p className="text-gray-300 font-medium">
                {uploading ? 'Téléchargement...' : 'Appuyer pour ajouter un plan'}
              </p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG ou PDF (max 10MB)</p>
            </div>
          </label>
        )}
      </div>

      {/* Photos placeholder */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200">
          Photos supplémentaires
        </label>
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center bg-[#1a1f2e]">
          <Camera className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Fonctionnalité à venir
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormStepThree;
