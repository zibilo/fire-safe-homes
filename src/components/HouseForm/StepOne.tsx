import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Home, Building, CreditCard, Upload, Check } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";
import { HouseFormData } from "@/lib/houseFormSchema";

const StepOne = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<HouseFormData>();
  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  const idCardRectoFile = watch("idCardRectoFile");
  const idCardVersoFile = watch("idCardVersoFile");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5Mo)");
      return;
    }

    const fieldName = side === 'recto' ? "idCardRectoFile" : "idCardVersoFile";
    setValue(fieldName, file, { shouldValidate: true });
  };

  return (
    <div className="space-y-8 pb-4">
      <div className="space-y-3">
        <Label htmlFor="ownerName">Propriétaire / Responsable *</Label>
        <Input
          id="ownerName"
          {...register("ownerName")}
          placeholder="Nom complet ou raison sociale"
          className="h-12 text-lg"
        />
        {errors.ownerName && <p className="text-red-500 text-xs">{errors.ownerName.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>Pièce d'identité / Passeport *</Label>
        <div className="grid grid-cols-2 gap-4">
          {/* ... (votre code pour l'upload de fichier, mais en utilisant `idCardRectoFile` et `idCardVersoFile` de `watch`) */}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Type de propriété *</Label>
        <RadioGroup
          onValueChange={(value) => setValue("propertyType", value as "house" | "apartment" | "company", { shouldValidate: true })}
          defaultValue={watch("propertyType")}
          className="grid grid-cols-1 gap-3"
        >
          {/* ... (votre code pour les RadioGroupItems) */}
        </RadioGroup>
        {errors.propertyType && <p className="text-red-500 text-xs">{errors.propertyType.message}</p>}
      </div>
    </div>
  );
};

export default StepOne;
