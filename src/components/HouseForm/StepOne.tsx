import { useFormContext, Controller } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2, Home, Building, CreditCard, Upload, Check } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const StepOne = () => {
  const { control, setValue, watch } = useFormContext();

  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'recto' | 'verso',
    field: any
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5Mo)");
      return;
    }

    field.onChange(e.target.files);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === 'recto') setRectoPreview(result);
      else setVersoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 pb-4">

      <FormField
        control={control}
        name="ownerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-300 uppercase tracking-wider">
              Propriétaire / Responsable *
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Nom complet ou raison sociale"
                className="h-12 text-lg bg-[#1F2433] border-white/10 text-white"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Carte d'identité / Passeport *
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="idCardRecto"
            render={({ field }) => (
              <FormItem>
                 <div
                    onClick={() => rectoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 ${
                        rectoPreview ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                    }`}
                >
                  <FormControl>
                    <input
                        type="file"
                        ref={rectoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'recto', field)}
                    />
                  </FormControl>
                  {rectoPreview ? (
                      <>
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                              <Check className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs text-green-400 font-medium">Recto ajouté</span>
                      </>
                  ) : (
                      <>
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-400">Ajouter Recto</span>
                      </>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="idCardVerso"
            render={({ field }) => (
              <FormItem>
                <div
                  onClick={() => versoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 ${
                      versoPreview ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <FormControl>
                    <input
                      type="file"
                      ref={versoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'verso', field)}
                    />
                  </FormControl>
                  {versoPreview ? (
                     <>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs text-green-400 font-medium">Verso ajouté</span>
                    </>
                  ) : (
                    <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">Ajouter Verso</span>
                    </>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={control}
        name="propertyType"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-sm font-medium text-gray-300 uppercase tracking-wider">
              Type de propriété *
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-3"
              >
                {[
                  { value: "house", label: "Maison", desc: "Villa, duplex ou maison individuelle", icon: Home },
                  { value: "apartment", label: "Appartement", desc: "Studio, T2, T3 dans un immeuble", icon: Building },
                  { value: "company", label: "Entreprise / ERP", desc: "Bureaux, commerce, école...", icon: Building2 },
                ].map(({ value, label, desc, icon: Icon }) => (
                  <FormItem key={value}>
                    <FormControl>
                      <RadioGroupItem value={value} id={value} className="sr-only" />
                    </FormControl>
                    <Label
                      htmlFor={value}
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                        field.value === value
                          ? "border-[#C41E25] bg-[#C41E25]/10 ring-1 ring-[#C41E25]"
                          : "border-white/10 bg-[#1F2433] hover:border-white/30"
                      }`}
                    >
                      <div className="bg-white/5 p-2 rounded-full mr-3">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="block font-bold text-white text-base">{label}</span>
                        <span className="text-[10px] text-gray-400">{desc}</span>
                      </div>
                    </Label>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepOne;
