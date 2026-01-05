import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  MapPin,
  Users,
  Truck,
  Ambulance,
  Download,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";

interface FireStation {
  id: string;
  name: string;
  station_type: string;
  status: string;
  district: string;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  chief_name: string | null;
  chief_email: string | null;
  chief_whatsapp: string | null;
  personnel_count: number;
  vehicles_count: number;
  ambulance_available: boolean;
  created_at: string;
}

const FireStations = () => {
  const [stations, setStations] = useState<FireStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<FireStation | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    station_type: "CS",
    status: "active",
    district: "",
    street: "",
    city: "",
    postal_code: "",
    lat: "",
    lng: "",
    chief_name: "",
    chief_email: "",
    chief_whatsapp: "",
    personnel_count: 0,
    vehicles_count: 0,
    ambulance_available: false,
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from("fire_stations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStations(data || []);
    } catch {
      toast.error("Erreur de chargement des casernes");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     📍 GEOLOCALISATION GPS
  ========================= */
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        }));
        toast.success("Position GPS récupérée");
      },
      () => {
        toast.error("Impossible de récupérer la position");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      station_type: "CS",
      status: "active",
      district: "",
      street: "",
      city: "",
      postal_code: "",
      lat: "",
      lng: "",
      chief_name: "",
      chief_email: "",
      chief_whatsapp: "",
      personnel_count: 0,
      vehicles_count: 0,
      ambulance_available: false,
    });
    setEditingStation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
    };

    try {
      if (editingStation) {
        await supabase
          .from("fire_stations")
          .update(payload)
          .eq("id", editingStation.id);
        toast.success("Caserne mise à jour");
      } else {
        await supabase.from("fire_stations").insert([payload]);
        toast.success("Caserne ajoutée");
      }
      setDialogOpen(false);
      resetForm();
      fetchStations();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (station: FireStation) => {
    setEditingStation(station);
    setFormData({
      ...station,
      lat: station.lat?.toString() || "",
      lng: station.lng?.toString() || "",
    } as any);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette caserne ?")) return;
    await supabase.from("fire_stations").delete().eq("id", id);
    toast.success("Caserne supprimée");
    fetchStations();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Casernes de Pompiers
        </h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle caserne
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStation ? "Modifier" : "Ajouter"} une caserne
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input value={formData.lat} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={formData.lng} />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                className="w-full flex gap-2"
              >
                <MapPin className="h-4 w-4" />
                Récupérer la position GPS automatiquement
              </Button>

              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>District</TableHead>
                <TableHead>GPS</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {stations.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.district}</TableCell>
                  <TableCell className="text-xs">
                    {s.lat}, {s.lng}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(s)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FireStations;
                                                                           
