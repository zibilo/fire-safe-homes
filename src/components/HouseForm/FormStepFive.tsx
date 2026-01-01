import { UseFormReturn } from "react-hook-form";
import { HouseFormSchemaType } from "@/hooks/useHouseFormSchema";
import { AlertTriangle, Check, ShieldAlert } from "lucide-react";

interface FormStepFiveProps {
  form: UseFormReturn<HouseFormSchemaType>;
}

const FormStepFive = ({ form }: FormStepFiveProps) => {
  const sensitiveObjects = form.watch('sensitiveObjects') || [];

  const sensitiveOptions = [
    { id: "gas", label: "Bouteilles de gaz", icon: "🔥", color: "orange" },
    { id: "chemicals", label: "Produits chimiques", icon: "⚗️", color: "purple" },
    { id: "fuel", label: "Réservoir de carburant", icon: "⛽", color: "red" },
    { id: "electrical", label: "Installation électrique ancienne", icon: "⚡", color: "yellow" },
    { id: "weapons", label: "Armes / Explosifs", icon: "💣", color: "red" },
    { id: "animals", label: "Animaux dangereux", icon: "🐕", color: "amber" },
  ];

  const toggleObject = (objectId: string) => {
    const current = sensitiveObjects;
    const updated = current.includes(objectId)
      ? current.filter((id) => id !== objectId)
      : [...current, objectId];
    form.setValue('sensitiveObjects', updated);
  };

  return (
    <div className="space-y-6">
      {/* Alerte */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-200 font-medium">
            Informations de sécurité importantes
          </p>
          <p className="text-xs text-amber-200/70 mt-1">
            Ces informations aideront les pompiers en cas d'intervention
          </p>
        </div>
      </div>

      {/* Objets sensibles */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Objets sensibles / dangereux
        </label>
        
        <div className="grid grid-cols-1 gap-2">
          {sensitiveOptions.map((option) => {
            const isSelected = sensitiveObjects.includes(option.id);
            
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleObject(option.id)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                  isSelected 
                    ? "border-red-500 bg-red-500/10" 
                    : "border-white/10 bg-[#1a1f2e] active:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {option.label}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isSelected 
                    ? "bg-red-500 border-red-500" 
                    : "border-white/20 bg-transparent"
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes de sécurité */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-200">
          Notes de sécurité supplémentaires
        </label>
        <textarea
          {...form.register('securityNotes')}
          placeholder="Ajoutez toute information importante pour les pompiers (accès difficile, personnes à mobilité réduite, etc.)"
          rows={4}
          className="w-full px-4 py-3 text-base bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
};

export default FormStepFive;
