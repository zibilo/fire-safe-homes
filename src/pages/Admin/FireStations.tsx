import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Trash2, Edit, MapPin, Users, Truck, Ambulance, Download } from "lucide-react";
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
    ambulance_available: false
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
    } catch (error) {
      console.error(error);
      toast.error("Erreur chargement casernes");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", station_type: "CS", status: "active", district: "",
      street: "", city: "", postal_code: "", lat: "", lng: "",
      chief_name: "", chief_email: "", chief_whatsapp: "",
      personnel_count: 0, vehicles_count: 0, ambulance_available: false
    });
    setEditingStation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      station_type: formData.station_type,
      status: formData.status,
      district: formData.district,
      street: formData.street || null,
      city: formData.city || null,
      postal_code: formData.postal_code || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      chief_name: formData.chief_name || null,
      chief_email: formData.chief_email || null,
      chief_whatsapp: formData.chief_whatsapp || null,
      personnel_count: formData.personnel_count,
      vehicles_count: formData.vehicles_count,
      ambulance_available: formData.ambulance_available,
    };

    try {
      if (editingStation) {
        const { error } = await supabase
          .from("fire_stations")
          .update(payload)
          .eq("id", editingStation.id);
        if (error) throw error;
        toast.success("Caserne mise à jour");
      } else {
        const { error } = await supabase
          .from("fire_stations")
          .insert([payload]);
        if (error) throw error;
        toast.success("Caserne ajoutée");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchStations();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur");
    }
  };

  const handleEdit = (station: FireStation) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      station_type: station.station_type || "CS",
      status: station.status || "active",
      district: station.district,
      street: station.street || "",
      city: station.city || "",
      postal_code: station.postal_code || "",
      lat: station.lat?.toString() || "",
      lng: station.lng?.toString() || "",
      chief_name: station.chief_name || "",
      chief_email: station.chief_email || "",
      chief_whatsapp: station.chief_whatsapp || "",
      personnel_count: station.personnel_count || 0,
      vehicles_count: station.vehicles_count || 0,
      ambulance_available: station.ambulance_available || false
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette caserne ?")) return;
    
    try {
      const { error } = await supabase.from("fire_stations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Caserne supprimée");
      fetchStations();
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleExport = () => {
    const data = stations.map(s => ({
      "Nom": s.name,
      "Type": s.station_type,
      "Statut": s.status,
      "District": s.district,
      "Ville": s.city,
      "Chef": s.chief_name,
      "Téléphone": s.chief_whatsapp,
      "Email": s.chief_email,
      "Effectif": s.personnel_count,
      "Véhicules": s.vehicles_count,
      "Ambulance": s.ambulance_available ? "Oui" : "Non",
      "Latitude": s.lat,
      "Longitude": s.lng
    }));
    exportToExcel(data, "casernes");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Casernes de Pompiers
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des centres de secours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Caserne
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStation ? "Modifier" : "Ajouter"} une caserne</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la caserne *</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Caserne Centrale" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type de centre *</Label>
                    <Select value={formData.station_type} onValueChange={v => setFormData({...formData, station_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSP">CSP (Principal)</SelectItem>
                        <SelectItem value="CS">CS (Secondaire)</SelectItem>
                        <SelectItem value="CPI">CPI (Première Intervention)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>District *</Label>
                    <Input required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="Bacongo" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Rue</Label>
                    <Input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="Rue..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Brazzaville" />
                  </div>
                  <div className="space-y-2">
                    <Label>Code Postal</Label>
                    <Input value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} placeholder="-4.2634" />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} placeholder="15.2429" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Responsable</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du chef</Label>
                      <Input value={formData.chief_name} onChange={e => setFormData({...formData, chief_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={formData.chief_whatsapp} onChange={e => setFormData({...formData, chief_whatsapp: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={formData.chief_email} onChange={e => setFormData({...formData, chief_email: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Ressources</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Effectif personnel</Label>
                      <Input type="number" min="0" value={formData.personnel_count} onChange={e => setFormData({...formData, personnel_count: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Véhicules</Label>
                      <Input type="number" min="0" value={formData.vehicles_count} onChange={e => setFormData({...formData, vehicles_count: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch checked={formData.ambulance_available} onCheckedChange={v => setFormData({...formData, ambulance_available: v})} />
                      <Label>Ambulance disponible</Label>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">{editingStation ? "Mettre à jour" : "Enregistrer"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caserne</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Chef</TableHead>
                <TableHead>Ressources</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : stations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune caserne enregistrée</TableCell></TableRow>
              ) : (
                stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell>
                      <div className="font-medium">{station.name}</div>
                      {station.city && <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{station.city}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{station.station_type}</Badge></TableCell>
                    <TableCell>{station.district}</TableCell>
                    <TableCell>
                      <div className="text-sm">{station.chief_name || "-"}</div>
                      {station.chief_whatsapp && <div className="text-xs text-muted-foreground">{station.chief_whatsapp}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{station.personnel_count}</span>
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{station.vehicles_count}</span>
                        {station.ambulance_available && <Ambulance className="h-4 w-4 text-green-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={station.status === "active" ? "default" : "secondary"}>
                        {station.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(station)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(station.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FireStations;
