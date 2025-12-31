import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const StepTwo = () => {
  const { control, watch } = useFormContext();
  const propertyType = watch("propertyType");
  const isApartment = propertyType === "apartment";

  const addressFields = [
    { name: "city", label: "Ville *", placeholder: "Entrez la ville" },
    { name: "district", label: "District / Village *", placeholder: "Entrez le district ou village" },
    { name: "neighborhood", label: "Quartier *", placeholder: "Entrez le quartier" },
    { name: "street", label: "Rue *", placeholder: "Entrez la rue" },
    { name: "parcelNumber", label: "Numéro de la parcelle *", placeholder: "Entrez le numéro de parcelle" },
    { name: "phone", label: "Numéro de téléphone *", placeholder: "+242 06 123 4567", type: "tel" },
  ];

  const apartmentFields = [
    { name: "buildingName", label: "Nom du bâtiment", placeholder: "Tour A, Résidence..." },
    { name: "floorNumber", label: "Étage", placeholder: "3", type: "number" },
    { name: "apartmentNumber", label: "Numéro d'appartement", placeholder: "A12" },
    { name: "totalFloors", label: "Nombre d'étages total", placeholder: "10", type: "number" },
  ];


  return (
    <div className="space-y-6">
      {addressFields.map(({ name, label, placeholder, type }) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={placeholder} type={type || 'text'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      {isApartment && (
        <>
          {apartmentFields.map(({ name, label, placeholder, type }) => (
            <FormField
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={placeholder} type={type || 'text'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={control}
            name="elevatorAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Ascenseur disponible
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};

export default StepTwo;
