import { UseFormReturn, FieldErrors } from "react-hook-form";
import { HouseFormSchemaType } from "@/hooks/useHouseFormSchema";
import { MapPin, Phone, Building, Check } from "lucide-react";

interface FormStepTwoProps {
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
    <label className="text-sm font-semibold text-gray-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
      <input
        {...register(name, type === "number" ? { valueAsNumber: true } : undefined)}
        type={type}
        placeholder={placeholder}
        className={`w-full h-14 px-4 text-base bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all ${icon ? 'pl-12' : ''}`}
      />
    </div>
    {errors[name] && (
      <p className="text-red-400 text-sm">{errors[name]?.message as string}</p>
    )}
  </div>
);

const FormStepTwo = ({ form }: FormStepTwoProps) => {
  const propertyType = form.watch('propertyType');
  const isApartment = propertyType === "apartment";
  const elevatorAvailable = form.watch('elevatorAvailable');
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <InputField 
        name="city" 
        label="Ville" 
        placeholder="Entrez la ville"
        required
        icon={<MapPin className="w-5 h-5" />}
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="district" 
        label="District / Village" 
        placeholder="Entrez le district"
        required
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="neighborhood" 
        label="Quartier" 
        placeholder="Entrez le quartier"
        required
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="street" 
        label="Rue" 
        placeholder="Nom de la rue"
        required
        register={register}
        errors={errors}
      />
      
      <InputField 
        name="parcelNumber" 
        label="Numéro de parcelle" 
        placeholder="Ex: P-1234"
        required
        register={register}
        errors={errors}
      />

      {isApartment && (
        <div className="space-y-4 p-4 bg-[#1a1f2e] rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <Building className="w-5 h-5" />
            <span className="font-semibold">Détails de l'appartement</span>
          </div>
          
          <InputField 
            name="buildingName" 
            label="Nom du bâtiment" 
            placeholder="Tour A, Résidence..."
            register={register}
            errors={errors}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              name="floorNumber" 
              label="Étage" 
              placeholder="3"
              type="number"
              register={register}
              errors={errors}
            />
            <InputField 
              name="apartmentNumber" 
              label="N° Appartement" 
              placeholder="A12"
              register={register}
              errors={errors}
            />
          </div>
          
          <InputField 
            name="totalFloors" 
            label="Étages total" 
            placeholder="10"
            type="number"
            register={register}
            errors={errors}
          />

          <button
            type="button"
            onClick={() => form.setValue('elevatorAvailable', !elevatorAvailable)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              elevatorAvailable 
                ? "border-green-500/50 bg-green-500/10" 
                : "border-white/10 bg-[#0f131a]"
            }`}
          >
            <span className="text-gray-200 font-medium">Ascenseur disponible</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              elevatorAvailable ? "bg-green-500" : "bg-white/10"
            }`}>
              {elevatorAvailable && <Check className="w-4 h-4 text-white" />}
            </div>
          </button>
        </div>
      )}
      
      <InputField 
        name="phone" 
        label="Téléphone" 
        placeholder="+243 XXX XXX XXX"
        required
        type="tel"
        icon={<Phone className="w-5 h-5" />}
        register={register}
        errors={errors}
      />
    </div>
  );
};

export default FormStepTwo;
