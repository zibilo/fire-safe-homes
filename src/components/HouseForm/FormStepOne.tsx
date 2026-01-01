import { UseFormReturn } from "react-hook-form";
import { HouseFormSchemaType } from "@/hooks/useHouseFormSchema";
import { Building2, Home, Building, CreditCard, Upload, Check, Camera } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface FormStepOneProps {
  form: UseFormReturn<HouseFormSchemaType>;
  idCardFiles: { recto?: File; verso?: File };
  setIdCardFiles: React.Dispatch<React.SetStateAction<{ recto?: File; verso?: File }>>;
}

const FormStepOne = ({ form, idCardFiles, setIdCardFiles }: FormStepOneProps) => {
  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5Mo)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (side === 'recto') {
        form.setValue('idCardRecto', event.target?.result as string);
        setIdCardFiles(prev => ({ ...prev, recto: file }));
      } else {
        form.setValue('idCardVerso', event.target?.result as string);
        setIdCardFiles(prev => ({ ...prev, verso: file }));
      }
    };
    reader.readAsDataURL(file);
  };

  const propertyTypes = [
    { value: "house", label: "Maison", desc: "Villa, duplex ou maison individuelle", icon: Home },
    { value: "apartment", label: "Appartement", desc: "Studio, T2, T3 dans un immeuble", icon: Building },
    { value: "company", label: "Entreprise / ERP", desc: "Bureaux, commerce, école...", icon: Building2 },
  ];

  const idCardRecto = form.watch('idCardRecto');
  const idCardVerso = form.watch('idCardVerso');
  const propertyType = form.watch('propertyType');

  return (
    <div className="space-y-6">
      {/* Nom du propriétaire */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-200">
          Propriétaire / Responsable <span className="text-red-500">*</span>
        </label>
        <input
          {...form.register('ownerName')}
          placeholder="Nom complet ou raison sociale"
          className="w-full h-14 px-4 text-base bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
        />
        {form.formState.errors.ownerName && (
          <p className="text-red-400 text-sm">{form.formState.errors.ownerName.message}</p>
        )}
      </div>

      {/* Carte d'identité */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> 
          Pièce d'identité <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Recto */}
          <button
            type="button"
            onClick={() => rectoInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all min-h-[120px] active:scale-95 ${
              idCardRecto 
                ? "border-green-500/50 bg-green-500/10" 
                : "border-white/20 bg-[#1a1f2e] active:bg-white/5"
            }`}
          >
            <input 
              type="file" 
              ref={rectoInputRef} 
              className="hidden" 
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, 'recto')}
            />
            {idCardRecto ? (
              <>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-400 font-medium">Recto ✓</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400 font-medium">Recto</span>
                <span className="text-xs text-gray-500 mt-1">Appuyer pour ajouter</span>
              </>
            )}
          </button>

          {/* Verso */}
          <button
            type="button"
            onClick={() => versoInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed transition-all min-h-[120px] active:scale-95 ${
              idCardVerso 
                ? "border-green-500/50 bg-green-500/10" 
                : "border-white/20 bg-[#1a1f2e] active:bg-white/5"
            }`}
          >
            <input 
              type="file" 
              ref={versoInputRef} 
              className="hidden" 
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, 'verso')}
            />
            {idCardVerso ? (
              <>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-400 font-medium">Verso ✓</span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400 font-medium">Verso</span>
                <span className="text-xs text-gray-500 mt-1">Appuyer pour ajouter</span>
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        {(idCardRecto || idCardVerso) && (
          <div className="flex gap-2 mt-2">
            {idCardRecto && (
              <img src={idCardRecto} alt="Recto" className="h-16 rounded-lg border border-white/10 object-cover" />
            )}
            {idCardVerso && (
              <img src={idCardVerso} alt="Verso" className="h-16 rounded-lg border border-white/10 object-cover" />
            )}
          </div>
        )}
      </div>

      {/* Type de propriété */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200">
          Type de propriété <span className="text-red-500">*</span>
        </label>
        
        <div className="space-y-2">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = propertyType === type.value;
            
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => form.setValue('propertyType', type.value as "house" | "apartment" | "company")}
                className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isSelected 
                    ? "border-red-500 bg-red-500/10" 
                    : "border-white/10 bg-[#1a1f2e] active:bg-white/5"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                  isSelected ? "bg-red-500/20" : "bg-white/5"
                }`}>
                  <Icon className={`w-6 h-6 ${isSelected ? "text-red-400" : "text-gray-400"}`} />
                </div>
                <div className="text-left flex-1">
                  <span className={`block font-bold text-base ${isSelected ? "text-white" : "text-gray-200"}`}>
                    {type.label}
                  </span>
                  <span className="text-xs text-gray-500">{type.desc}</span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FormStepOne;
