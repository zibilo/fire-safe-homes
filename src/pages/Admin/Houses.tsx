import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Trash2, MapPin, Home, Building2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { HouseDetailsDialog, HouseDetails } from "@/components/Admin/HouseDetailsDialog";
import { toast } from "sonner"; // Importez toast pour les notifications

// Interface locale pour l'affichage groupé
interface UserHouses {
  userId: string;
  userName: string;
  userEmail: string;
  houses: HouseDetails[];
}

const Houses = () => {
  const [userHouses, setUserHouses] = useState<UserHouses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<HouseDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer toutes les maisons
      const { data: houses, error: housesError } = await supabase
        .from("houses")
        .select("*, user_id")
        .order("created_at", { ascending: false });

      if (housesError) throw housesError;

      const housesGrouped: { [key: string]: UserHouses } = {};
      const userIds = houses.map(h => h.user_id);

      // 2. Récupérer tous les profils en une seule requête (optimisation)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles.map(p => [p.id, p]));


      // 3. Grouper les maisons par utilisateur
      for (const house of houses || []) {
        const profile = profilesMap.get(house.user_id);
        const userName = profile?.full_name || profile?.email || "Utilisateur inconnu";
        const userEmail = profile?.email || "";

        if (!housesGrouped[house.user_id]) {
          housesGrouped[house.user_id] = {
            userId: house.user_id,
            userName: userName,
            userEmail: userEmail,
            houses: [],
          };
        }
        housesGrouped[house.user_id].houses.push(house as unknown as HouseDetails);
      }

      setUserHouses(Object.values(housesGrouped));
    } catch (err) {
      console.error("Error fetching houses:", err);
      setError("Erreur lors du chargement des maisons");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (house: HouseDetails) => {
    setSelectedHouse(house);
    setDetailsDialogOpen(true);
  };

  // NOUVELLE FONCTION : Supprimer une maison
  const handleDeleteHouse = async (houseId: string, street: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la maison à l'adresse: ${street} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', houseId);

      if (error) throw error;
      
      toast.success(`Maison supprimée : ${street}`);
      // Rafraîchir la liste après la suppression
      fetchHouses(); 

    } catch (err) {
      console.error('Error deleting house:', err);
      toast.error("Échec de la suppression de la maison.");
    }
  };

  const filteredUserHouses = userHouses.filter(
    (user) =>
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.houses.some(
        (house) =>
          (house.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (house.city || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestion des maisons</h1>
        <Card className="p-6 shadow-card border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des biens</h1>
        <p className="text-muted-foreground mt-2">
          Consulter les dossiers, plans et pièces d'identité.
        </p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, ville ou rue..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUserHouses.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredUserHouses.map((user) => (
              <AccordionItem
                key={user.userId}
                value={user.userId}
                className="border border-border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-fire flex items-center justify-center text-white font-semibold">
                      {user.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{user.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.houses.length} bien(s) enregistré(s)
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  {user.houses.map((house) => (
                    <div
                      key={house.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-smooth bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center">
                          {house.property_type === 'company' ? (
                             <Building2 className="h-6 w-6 text-blue-500" />
                          ) : (
                             <Home className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {house.street}, {house.neighborhood}
                            </h4>
                            <Badge variant={house.property_type === 'company' ? "default" : "secondary"}>
                                {house.property_type === 'company' ? 'Entreprise' : (house.property_type === 'house' ? 'Maison' : 'Appartement')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {house.city}
                            </span>
                            {/* Badge "Doc CNI inclus" supprimé ici */}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(house)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4 mr-2" /> Détails
                        </Button>
                        {/* BOUTON SUPPRIMER AJOUTÉ ICI */}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteHouse(house.id, `${house.street}, ${house.city}`)}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          aria-label={`Supprimer le bien ${house.street}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun dossier trouvé.</p>
          </div>
        )}
      </Card>

      {selectedHouse && (
        <HouseDetailsDialog
          house={selectedHouse}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          // Note : La fonction de suppression pourrait également être passée ici si vous vouliez
          // ajouter un bouton de suppression dans la modale HouseDetailsDialog
        />
      )}
    </div>
  );
};

export default Houses;
