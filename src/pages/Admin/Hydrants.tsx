import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Filter, Download } from "lucide-react";
import FireHydrantMap from "@/components/FireHydrantMap";
import { AddHydrantDialog } from "@/components/Admin/AddHydrantDialog";
import { HydrantList } from "@/components/Admin/HydrantList";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

const Hydrants = () => {
  // Cette variable sert à forcer le rechargement des composants
  const [refreshKey, setRefreshKey] = useState(0);

  // Appelé quand on Ajoute OU quand on Supprime
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase.from("view_hydrants_map").select("*");
      if (error) throw error;
      
      const exportData = (data || []).map(h => ({
        "Matricule": h.matricule,
        "Avenue": h.avenue,
        "Ruelle": h.alley,
        "District": h.district,
        "Ville": h.city,
        "Statut": h.status,
        "Débit (L/s)": h.flow_rate_ls,
        "Latitude": h.lat,
        "Longitude": h.lng,
        "Détails": h.details
      }));
      
      exportToExcel(exportData, "bornes_incendie");
      toast.success("Export terminé");
    } catch (error) {
      toast.error("Erreur export");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Droplets className="h-8 w-8 text-blue-500" />
            Points d'eau incendie
          </h1>
          <p className="text-muted-foreground mt-1">
            Cartographie et inventaire des bornes (PEI).
          </p>
        </div>
        <div className="flex gap-2">
             <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
             </Button>
             <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filtres
             </Button>
             
             {/* Le bouton d'ajout déclenche le refresh */}
             <AddHydrantDialog onSuccess={handleDataChange} />
        </div>
      </div>

      {/* 1. LA CARTE (Prend toute la largeur) */}
      <Card className="p-1 border-0 shadow-lg overflow-hidden">
           {/* La clé 'key' force le composant à se recharger si refreshKey change */}
           <FireHydrantMap key={`map-${refreshKey}`} />
      </Card>

      {/* 2. LE TABLEAU (En dessous) */}
      <div className="grid grid-cols-1">
        <HydrantList 
            refreshTrigger={refreshKey} 
            onDelete={handleDataChange} 
        />
      </div>
    </div>
  );
};

export default Hydrants;