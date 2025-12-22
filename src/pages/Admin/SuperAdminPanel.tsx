import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Trash2, Key, UserX, MapPin, Home, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface GeoRequest {
  id: string;
  phone_number: string | null;
  status: string | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
}

interface House {
  id: string;
  owner_name: string;
  street: string;
  city: string;
  created_at: string;
}

const SuperAdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [geoRequests, setGeoRequests] = useState<GeoRequest[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, geoRes, housesRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }),
        supabase.from("geo_requests").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("houses").select("id, owner_name, street, city, created_at").order("created_at", { ascending: false }).limit(50)
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (geoRes.data) setGeoRequests(geoRes.data as GeoRequest[]);
      if (housesRes.data) setHouses(housesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeoHistory = async () => {
    if (!confirm("Supprimer TOUT l'historique de géolocalisation ? Cette action est irréversible.")) return;
    
    try {
      const { error } = await supabase.from("geo_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Historique supprimé");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur suppression");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Supprimer définitivement l'utilisateur ${email} ? Ses données seront perdues.`)) return;
    
    try {
      // Supprimer le profil (les maisons seront orphelines mais peuvent rester)
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      toast.success("Profil supprimé. Compte auth intact (supprimer via Supabase Dashboard).");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleDeleteHouse = async (houseId: string, address: string) => {
    if (!confirm(`Supprimer la maison : ${address} ?`)) return;
    
    try {
      const { error } = await supabase.from("houses").delete().eq("id", houseId);
      if (error) throw error;
      toast.success("Maison supprimée");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleSendResetPassword = async () => {
    if (!resetEmail) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin/login`
      });
      if (error) throw error;
      toast.success(`Email de réinitialisation envoyé à ${resetEmail}`);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erreur envoi email");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-destructive" />
          Panneau Super Admin
        </h1>
        <p className="text-muted-foreground mt-1">Actions réservées au Super Administrateur</p>
      </div>

      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">Zone Dangereuse</p>
          <p className="text-sm text-muted-foreground">Les actions ici sont irréversibles. Utilisez avec précaution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réinitialisation mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Réinitialiser mot de passe
            </CardTitle>
            <CardDescription>Envoyer un email de réinitialisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="email@admin.com" 
                value={resetEmail} 
                onChange={e => setResetEmail(e.target.value)} 
              />
              <Button onClick={handleSendResetPassword} disabled={!resetEmail}>
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suppression historique géoloc */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-destructive" /> Historique Géolocalisation
            </CardTitle>
            <CardDescription>{geoRequests.length} demandes enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeleteGeoHistory} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer tout l'historique
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" /> Gestion des utilisateurs
            </CardTitle>
            <CardDescription>{profiles.length} profils</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(profile.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteUser(profile.id, profile.email)}
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

      {/* Suppression maisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" /> Suppression de maisons
          </CardTitle>
          <CardDescription>{houses.length} dernières maisons</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {houses.map(house => (
                <TableRow key={house.id}>
                  <TableCell className="font-medium">{house.owner_name}</TableCell>
                  <TableCell>{house.street}, {house.city}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(house.created_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteHouse(house.id, `${house.street}, ${house.city}`)}
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

export default SuperAdminPanel;
