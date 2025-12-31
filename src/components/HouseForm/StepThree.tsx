import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { HouseFormData } from "@/lib/houseFormSchema";
// ... (autres imports)

const StepThree = () => {
  const { register, formState: { errors } } = useFormContext<HouseFormData>();

  // ... (votre logique d'upload de plan peut rester ici, mais elle devra utiliser `setValue` de react-hook-form)

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Description de la propriété</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Décrivez votre propriété..."
          className="min-h-[120px]"
        />
        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
      </div>

      {/* ... (votre JSX pour l'upload de plan, adapté pour react-hook-form) */}

      {/* ... (votre JSX pour l'upload de photos) */}
    </div>
  );
};

export default StepThree;
