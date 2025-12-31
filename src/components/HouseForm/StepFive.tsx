import { useFormContext, Controller } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const StepFive = () => {
  const { control } = useFormContext();

  const sensitiveObjectOptions = [
    { id: "gas", label: "Bouteilles de gaz" },
    { id: "chemicals", label: "Produits chimiques" },
    { id: "fuel", label: "Réservoir de carburant" },
    { id: "electrical", label: "Installation électrique ancienne" },
  ];

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="sensitiveObjects"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>Objets sensibles / dangereux</FormLabel>
            </div>
            {sensitiveObjectOptions.map((item) => (
              <FormField
                key={item.id}
                control={control}
                name="sensitiveObjects"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={item.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(item.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), item.id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value: string) => value !== item.id
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {item.label}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="securityNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes de sécurité supplémentaires</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Ajoutez toute information importante pour les pompiers..."
                className="min-h-[120px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepFive;
