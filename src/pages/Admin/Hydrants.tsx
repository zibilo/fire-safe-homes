import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Filter } from "lucide-react";
import FireHydrantMap from "@/components/FireHydrantMap";
import { AddHydrantDialog } from "@/components/Admin/AddHydrantDialog";
import { HydrantList } from "@/components/Admin/HydrantList"; // Import du tableau

const Hydrants = () => {
  // Cette variable sert à forcer le rechargement des composants
  const [refreshKey, setRefreshKey] = useState(0);

  // Appelé quand on Ajoute OU quand on Supprime
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
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