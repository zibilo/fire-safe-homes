import { UseFormReturn, FieldErrors } from "react-hook-form";
import { HouseFormSchemaType } from "@/hooks/useHouseFormSchema";
import { Home, Ruler, Calendar, Flame, Check } from "lucide-react";

interface FormStepFourProps {
  form: UseFormReturn<HouseFormSchemaType>;
}

interface InputFieldProps {
  name: keyof HouseFormSchemaType;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  icon?: React.ReactNode;
  register: UseFormReturn<HouseFormSchemaType>["register"];
  errors: FieldErrors<HouseFormSchemaType>;
}

const InputField = ({ 
  name, 
  label, 
  placeholder, 
  required = false,
  type = "text",
  icon,
  register,
  errors
}: InputFieldProps) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
      {icon}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...register(name, type === "number" ? { valueAsNumber: true } : undefined)}
      type={type}
      inputMode={type === "number" ? "numeric" : undefined}
      placeholder={placeholder}
      className="w-full h-14 px-4 text-base bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
    />
    {errors[name] && (
      <p className="text-red-400 text-sm">{errors[name]?.message as string}</p>
    )}
  </div>
);

const FormStepFour = ({ form }: FormStepFourProps) => {
  const heatingType = form.watch('heatingType');
  const { register, formState: { errors } } = form;

  const heatingOptions = [
    { value: "electric", label: "Électrique", icon: "⚡" },
    { value: "gas", label: "Gaz", icon: "🔥" },
    { value: "fuel", label: "Fioul", icon: "🛢️" },
    { value: "wood", label: "Bois", icon: "🪵" },
    { value: "heat-pump", label: "Pompe à chaleur", icon: "❄️" },
    { value: "solar", label: "Solaire", icon: "☀️" },
  ];

  return (
    <div className="space-y-5">
      <InputField 
        name="numberOfRooms" 
        label="Nombre de pièces" 
        placeholder="5"
        type="number"
        icon={<Home className="w-4 h-4 text-gray-400" />}
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="surfaceArea" 
        label="Surface (m²)" 
        placeholder="120"
        type="number"
        icon={<Ruler className="w-4 h-4 text-gray-400" />}
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="constructionYear" 
        label="Année de construction" 
        placeholder="2010"
        type="number"
        icon={<Calendar className="w-4 h-4 text-gray-400" />}
        register={register}
        errors={errors}
      />

      {/* Type de chauffage/énergie */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-gray-400" />
          Type d'énergie / Chauffage
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          {heatingOptions.map((option) => {
            const isSelected = heatingType === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue('heatingType', option.value)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                  isSelected 
                    ? "border-red-500 bg-red-500/10" 
                    : "border-white/10 bg-[#1a1f2e] active:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{option.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-red-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FormStepFour;
