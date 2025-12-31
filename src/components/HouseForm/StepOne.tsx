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
    <div className="space-y-8 pb-4">

      {/* Nom du propriétaire */}
      <div className="space-y-3">
        <Label htmlFor="ownerName" className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          Propriétaire / Responsable *
        </Label>
        <Input
          id="ownerName"
          value={formData.ownerName}
          onChange={(e) => updateFormData({ ownerName: e.target.value })}
          placeholder="Nom complet ou raison sociale"
          className="h-12 text-lg bg-[#1F2433] border-white/10 text-white"
          required
        />
      </div>

      {/* Carte d'identité (Recto / Verso) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Carte d'identité / Passeport *
        </Label>

        <div className="grid grid-cols-2 gap-4">
            {/* Recto */}
            <div
                onClick={() => rectoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 ${
                    formData.idCardRecto ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                }`}
            >
                <input
                    type="file"
                    ref={rectoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'recto')}
                />
                {formData.idCardRecto ? (
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

            {/* Verso */}
            <div
                onClick={() => versoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 ${
                    formData.idCardVerso ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-white/30 hover:bg-white/5"
                }`}
            >
                <input
                    type="file"
                    ref={versoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'verso')}
                />
                {formData.idCardVerso ? (
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
        </div>
        {formData.idCardRecto && (
            <div className="mt-2">
                <img src={formData.idCardRecto} alt="Aperçu Recto" className="h-20 rounded-md border border-white/10 object-cover inline-block mr-2" />
                {formData.idCardVerso && (
                    <img src={formData.idCardVerso} alt="Aperçu Verso" className="h-20 rounded-md border border-white/10 object-cover inline-block" />
                )}
            </div>
        )}
      </div>

      {/* Type de propriété */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-300 uppercase tracking-wider">
            Type de propriété *
        </Label>

        <RadioGroup
          value={formData.propertyType}
          onValueChange={(value) =>
            updateFormData({ propertyType: value as "house" | "apartment" | "company" })
          }
          className="grid grid-cols-1 gap-3"
        >
            {/* Maison */}
            <Label
                htmlFor="house"
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.propertyType === "house"
                    ? "border-[#C41E25] bg-[#C41E25]/10 ring-1 ring-[#C41E25]"
                    : "border-white/10 bg-[#1F2433] hover:border-white/30"
                }`}
            >
                <RadioGroupItem value="house" id="house" className="sr-only" />
                <div className="bg-white/5 p-2 rounded-full mr-3">
                    <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="block font-bold text-white text-base">Maison</span>
                    <span className="text-[10px] text-gray-400">Villa, duplex ou maison individuelle</span>
                </div>
            </Label>

            {/* Appartement */}
            <Label
                htmlFor="apartment"
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.propertyType === "apartment"
                    ? "border-[#C41E25] bg-[#C41E25]/10 ring-1 ring-[#C41E25]"
                    : "border-white/10 bg-[#1F2433] hover:border-white/30"
                }`}
            >
                <RadioGroupItem value="apartment" id="apartment" className="sr-only" />
                <div className="bg-white/5 p-2 rounded-full mr-3">
                    <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="block font-bold text-white text-base">Appartement</span>
                    <span className="text-[10px] text-gray-400">Studio, T2, T3 dans un immeuble</span>
                </div>
            </Label>

            {/* Entreprise */}
            <Label
                htmlFor="company"
                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.propertyType === "company"
                    ? "border-[#C41E25] bg-[#C41E25]/10 ring-1 ring-[#C41E25]"
                    : "border-white/10 bg-[#1F2433] hover:border-white/30"
                }`}
            >
                <RadioGroupItem value="company" id="company" className="sr-only" />
                <div className="bg-white/5 p-2 rounded-full mr-3">
                    <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="block font-bold text-white text-base">Entreprise / ERP</span>
                    <span className="text-[10px] text-gray-400">Bureaux, commerce, école...</span>
                </div>
            </Label>

        </RadioGroup>
      </div>
    </div>
  );
};

export default StepOne;