import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HouseFormData } from "@/hooks/useHouseForm";
import { Building2, Home, Building, CreditCard, Upload, Check } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface StepOneProps {
  formData: HouseFormData;
  updateFormData: (updates: Partial<HouseFormData>) => void;
}

const StepOne = ({ formData, updateFormData }: StepOneProps) => {
  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5Mo)");
      return;
    }

    // Prévisualisation locale
    const reader = new FileReader();
    reader.onload = (event) => {
      if (side === 'recto') {
        updateFormData({ 
            idCardRecto: event.target?.result as string,
            idCardRectoFile: file
        });
      } else {
        updateFormData({ 
            idCardVerso: event.target?.result as string,
            idCardVersoFile: file
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Nom du propriétaire */}
          <div className="space-y-2">
            <Label htmlFor="ownerName" className="text-sm font-semibold text-gray-300">
              Propriétaire / Responsable *
            </Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => updateFormData({ ownerName: e.target.value })}
              placeholder="Ex: Jean Dupont"
              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* Type de propriété */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-300">
                Type de bien *
            </Label>
            <RadioGroup
              value={formData.propertyType}
              onValueChange={(value) => updateFormData({ propertyType: value as "house" | "apartment" | "company" })}
              className="flex gap-2"
            >
              {[
                { value: "house", label: "Maison", icon: Home },
                { value: "apartment", label: "Appart.", icon: Building },
                { value: "company", label: "Société", icon: Building2 },
              ].map(({ value, label, icon: Icon }) => (
                <Label
                  key={value}
                  htmlFor={value}
                  className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all h-20 ${
                      formData.propertyType === value
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Pièce d'identité *
            </Label>
            <div className="grid grid-cols-2 gap-3">
                {[
                  { side: "recto", label: "Recto", ref: rectoInputRef, data: formData.idCardRecto },
                  { side: "verso", label: "Verso", ref: versoInputRef, data: formData.idCardVerso },
                ].map(({ side, label, ref: inputRef, data }) => (
                  <div
                      key={side}
                      onClick={() => inputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-28 ${
                          data ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                      }`}
                  >
                      <input
                          type="file"
                          ref={inputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, side as 'recto'|'verso')}
                      />
                      {data ? (
                          <>
                              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center mb-1.5">
                                  <Check className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-xs text-green-400 font-medium">{label} ajouté</span>
                          </>
                      ) : (
                          <>
                              <Upload className="w-5 h-5 text-gray-400 mb-1.5" />
                              <span className="text-xs text-gray-400 text-center">Ajouter {label}</span>
                          </>
                      )}
                  </div>
                ))}
            </div>
            {formData.idCardRecto && (
              <div className="mt-2 flex gap-2">
                  <img src={formData.idCardRecto} alt="Aperçu Recto" className="h-12 w-1/2 object-cover rounded-md border border-white/10" />
                  {formData.idCardVerso && (
                      <img src={formData.idCardVerso} alt="Aperçu Verso" className="h-12 w-1/2 object-cover rounded-md border border-white/10" />
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepOne;