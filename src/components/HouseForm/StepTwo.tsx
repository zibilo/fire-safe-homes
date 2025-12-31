import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";
import { HouseFormData } from "@/lib/houseFormSchema";

const StepTwo = () => {
  const { register, watch, formState: { errors } } = useFormContext<HouseFormData>();
  const isApartment = watch("propertyType") === "apartment";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" {...register("city")} placeholder="Brazzaville" />
          {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="district">District / Village *</Label>
          <Input id="district" {...register("district")} placeholder="Poto-Poto" />
          {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood">Quartier *</Label>
        <Input id="neighborhood" {...register("neighborhood")} placeholder="Plateau des 15 ans" />
        {errors.neighborhood && <p className="text-red-500 text-xs">{errors.neighborhood.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="street">Rue *</Label>
          <Input id="street" {...register("street")} placeholder="Avenue des 3 Martyrs" />
          {errors.street && <p className="text-red-500 text-xs">{errors.street.message}</p>}
        </div>
        <div>
          <Label htmlFor="parcelNumber">Numéro de parcelle *</Label>
          <Input id="parcelNumber" {...register("parcelNumber")} placeholder="N°123" />
          {errors.parcelNumber && <p className="text-red-500 text-xs">{errors.parcelNumber.message}</p>}
        </div>
      </div>

      {isApartment && (
        <>
          {/* ... (Champs spécifiques à l'appartement, refactorisés de la même manière) */}
        </>
      )}

      <div>
        <Label htmlFor="phone">Numéro de téléphone *</Label>
        <Input id="phone" type="tel" {...register("phone")} placeholder="+242 06 123 4567" />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
      </div>
    </div>
  );
};

export default StepTwo;
