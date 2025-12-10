
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Navigation, Map } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Hydrant {
  id: string;
  matricule: string;
  city: string;
  district: string;
  avenue?: string;
  alley?: string;
  status: string;
  lat: number;
  lng: number;
}

interface HydrantListProps {
  refreshTrigger: number;
  onDelete: () => void;
}

export function HydrantList({ refreshTrigger, onDelete }: HydrantListProps) {
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);

  useEffect(() => {
    fetchHydrants();
  }, [refreshTrigger]);

  const fetchHydrants = async () => {
    const { data } = await supabase.from("view_hydrants_map").select("*").order("matricule");
    if (data) setHydrants(data as any);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce PEI ?")) return;
    await supabase.from("fire_hydrants").delete().eq("id", id);
    fetchHydrants();
    onDelete();
  };

  // Ouvre le GPS
  const openGPS = (lat: number, lng: number) => {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste détaillée des PEI ({hydrants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Adresse (Détails)</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hydrants.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-bold">{h.matricule}</TableCell>
                  
                  {/* Colonne Ville/Quartier */}
                  <TableCell>
                    <div className="font-medium">{h.city}</div>
                    <div className="text-xs text-muted-foreground">{h.district}</div>
                  </TableCell>
                  
                  {/* Colonne Avenue/Ruelle */}
                  <TableCell>
                    {(h.avenue || h.alley) ? (
                        <span className="text-sm">{h.avenue} {h.alley ? `(${h.alley})` : ''}</span>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>

                  <TableCell>
                    <Badge variant={h.status === "functional" ? "default" : "destructive"}>
                      {h.status === "functional" ? "OK" : "HS"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    {/* BOUTON LOCALISER */}
                    <Button variant="outline" size="sm" onClick={() => openGPS(h.lat, h.lng)} title="Localiser">
                        <Navigation className="h-4 w-4 text-blue-600" />
                    </Button>

                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(h.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}