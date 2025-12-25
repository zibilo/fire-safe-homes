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
import { Building2, Plus, Trash2, Edit, MapPin, Users, Truck, Ambulance, Download, Navigation, Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";

const FireStations = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", station_type: "CS", status: "active", district: "",
    street: "", city: "", lat: "", lng: "",
    chief_name: "", chief_email: "", chief_whatsapp: "",
    personnel_count: 0, daily_staff_count: 0, vehicles_count: 0, ambulance_available: false
  });

  // --- STATISTIQUES CALCULÉES ---
  const totalStaffToday = stations.reduce((acc, s) => acc + (s.daily_staff_count || 0), 0);
  const stationsUpdatedToday = stations.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.updated_at && s.updated_at.startsWith(today);
  }).length;

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase.from("fire_stations").select("*").order("name");
      if (error) throw error;
      setStations(data || []);
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const updateDailyStaff = async (id: string, value: number) => {
    const { error } = await supabase
      .from("fire_stations")
      .update({ daily_staff_count: value, updated_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) toast.error("Erreur de mise à jour");
    else {
      toast.success("Effectif du jour actualisé");
      fetchStations();
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData(prev => ({ ...prev, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }));
      toast.success("Position capturée");
    }, () => toast.error("Géolocalisation refusée"));
  };

  return (
    <div className="space-y-6 p-4">
      {/* --- SECTION STATISTIQUES (WIDGETS DU JOUR) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-600 uppercase">Mobilisation Totale</p>
                <h3 className="text-3xl font-bold text-blue-900">{totalStaffToday}</h3>
                <p className="text-xs text-blue-700">Agents en service aujourd'hui</p>
              </div>
              <Users className="h-10 w-10 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-600 uppercase">Rapports Reçus</p>
                <h3 className="text-3xl font-bold text-green-900">{stationsUpdatedToday} / {stations.length}</h3>
                <p className="text-xs text-green-700">Casernes à jour ce jour</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-600 uppercase">Capacité Logistique</p>
                <h3 className="text-3xl font-bold text-red-900">{stations.reduce((acc,s) => acc + (s.vehicles_count || 0), 0)}</h3>
                <p className="text-xs text-red-700">Véhicules opérationnels</p>
              </div>
              <Truck className="h-10 w-10 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="text-primary" /> État des Casernes
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2" /> Ajouter une Caserne</Button></DialogTrigger>
          <DialogContent className="max-w-4xl">
             {/* Formulaire similaire au précédent mais avec bouton position directe */}
             {/* ... inclure formData et getCurrentLocation ici ... */}
          </DialogContent>
        </Dialog>
      </div>

      {/* --- TABLEAU DE GESTION QUOTIDIENNE --- */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caserne / District</TableHead>
              <TableHead>Effectif du Jour (À MODIFIER)</TableHead>
              <TableHead>Logistique</TableHead>
              <TableHead>Dernière Mise à Jour</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((s) => (
              <TableRow key={s.id} className={s.daily_staff_count === 0 ? "bg-red-50/50" : ""}>
                <TableCell>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.district}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      className="w-24 border-2 border-primary/20 focus:border-primary font-bold text-lg"
                      defaultValue={s.daily_staff_count}
                      onBlur={(e) => updateDailyStaff(s.id, parseInt(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground">/ {s.personnel_count} total</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex gap-1"><Truck className="h-3 w-3"/> {s.vehicles_count}</Badge>
                    {s.ambulance_available && <Badge className="bg-green-100 text-green-800 border-green-200"><Ambulance className="h-3 w-3"/></Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {s.updated_at ? new Date(s.updated_at).toLocaleString('fr-FR') : "Jamais"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => {/* Fonction Edit */}}><Edit className="h-4 w-4"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default FireStations;
