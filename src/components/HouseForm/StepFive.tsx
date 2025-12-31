import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";
import { HouseFormData } from "@/lib/houseFormSchema";

const StepFive = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<HouseFormData>();

  const sensitiveObjectOptions = [
    { id: "gas", label: "Bouteilles de gaz" },
    { id: "chemicals", label: "Produits chimiques" },
    { id: "fuel", label: "Réservoir de carburant" },
    { id: "electrical", label: "Installation électrique ancienne" },
  ];

  const toggleSensitiveObject = (objectId: string) => {
    const currentObjects = watch("sensitiveObjects") || [];
    const updated = currentObjects.includes(objectId)
      ? currentObjects.filter((id) => id !== objectId)
      : [...currentObjects, objectId];
    setValue("sensitiveObjects", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Objets sensibles / dangereux</Label>
        <div className="space-y-3">
          {sensitiveObjectOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={watch("sensitiveObjects")?.includes(option.id)}
                onCheckedChange={() => toggleSensitiveObject(option.id)}
              />
              <label htmlFor={option.id} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes de sécurité supplémentaires</Label>
        <Textarea
          id="notes"
          {...register("securityNotes")}
          placeholder="Ajoutez toute information importante pour les pompiers..."
          className="min-h-[120px]"
        />
        {errors.securityNotes && <p className="text-red-500 text-xs">{errors.securityNotes.message}</p>}
      </div>
    </div>
  );
};

export default StepFive;
