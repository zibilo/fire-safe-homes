import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { HouseFormData } from "@/lib/houseFormSchema";

const StepFour = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<HouseFormData>();

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="rooms">Nombre de pièces</Label>
        <Input
          id="rooms"
          type="number"
          {...register("numberOfRooms", { valueAsNumber: true })}
          placeholder="5"
        />
        {errors.numberOfRooms && <p className="text-red-500 text-xs">{errors.numberOfRooms.message}</p>}
      </div>

      <div>
        <Label htmlFor="surface">Surface (m²)</Label>
        <Input
          id="surface"
          type="number"
          {...register("surfaceArea", { valueAsNumber: true })}
          placeholder="120"
        />
        {errors.surfaceArea && <p className="text-red-500 text-xs">{errors.surfaceArea.message}</p>}
      </div>

      <div>
        <Label htmlFor="year">Année de construction</Label>
        <Input
          id="year"
          type="number"
          {...register("constructionYear", { valueAsNumber: true })}
          placeholder="2010"
        />
        {errors.constructionYear && <p className="text-red-500 text-xs">{errors.constructionYear.message}</p>}
      </div>

      <div>
        <Label htmlFor="heating">Type de chauffage</Label>
        <Select
          defaultValue={watch("heatingType")}
          onValueChange={(value) => setValue("heatingType", value, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electric">Électrique</SelectItem>
            <SelectItem value="gas">Gaz</SelectItem>
            <SelectItem value="fuel">Fioul</SelectItem>
            <SelectItem value="wood">Bois</SelectItem>
            <SelectItem value="heat-pump">Pompe à chaleur</SelectItem>
          </SelectContent>
        </Select>
        {errors.heatingType && <p className="text-red-500 text-xs">{errors.heatingType.message}</p>}
      </div>
    </div>
  );
};

export default StepFour;
