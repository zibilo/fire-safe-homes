import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const StepThree = () => {
  const { control, setValue } = useFormContext();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [planPreview, setPlanPreview] = useState<string | null>(null);

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

      setValue("planUrl", urlData.publicUrl, { shouldValidate: true });
      setPlanPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : urlData.publicUrl);

      toast.success('Plan téléchargé avec succès');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removePlan = () => {
    setValue("planUrl", undefined, { shouldValidate: true });
    setPlanPreview(null);
    toast.success('Plan retiré');
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description de la propriété *</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Décrivez votre propriété..."
                className="min-h-[120px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="planUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plan de la maison (recommandé)</FormLabel>
            <div className="text-sm text-muted-foreground mb-2">
              Téléchargez un plan pour une analyse automatique par IA
            </div>
            {planPreview ? (
              <div className="relative border-2 border-primary/20 rounded-lg p-4 bg-card">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removePlan}
                >
                  <X className="h-4 w-4" />
                </Button>
                {planPreview.startsWith('blob:') ? (
                  <img
                    src={planPreview}
                    alt="Plan preview"
                    className="w-full h-48 object-contain rounded"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Plan PDF téléchargé</p>
                      <a href={planPreview} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Voir le fichier</a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <FormControl>
                  <input
                    type="file"
                    id="plan-upload"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handlePlanUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </FormControl>
                <label
                  htmlFor="plan-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  )}
                  <p className="text-muted-foreground">
                    {uploading
                      ? 'Téléchargement...'
                      : 'Cliquez pour sélectionner un plan (JPG, PNG, PDF)'}
                  </p>
                  <p className="text-xs text-muted-foreground">Max 10MB</p>
                </label>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepThree;
