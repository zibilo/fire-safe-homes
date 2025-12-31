import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StepFour = () => {
  const { control } = useFormContext();

  const fields = [
    { name: "numberOfRooms", label: "Nombre de pièces", placeholder: "5", type: "number" },
    { name: "surfaceArea", label: "Surface (m²)", placeholder: "120", type: "number" },
    { name: "constructionYear", label: "Année de construction", placeholder: "2010", type: "number" },
  ];

  const heatingOptions = [
    { value: "electric", label: "Électrique" },
    { value: "gas", label: "Gaz" },
    { value: "fuel", label: "Fioul" },
    { value: "wood", label: "Bois" },
    { value: "heat-pump", label: "Pompe à chaleur" },
  ];

  return (
    <div className="space-y-6">
      {fields.map(({ name, label, placeholder, type }) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={placeholder} type={type} onChange={e => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      <FormField
        control={control}
        name="heatingType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type de chauffage</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {heatingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepFour;
