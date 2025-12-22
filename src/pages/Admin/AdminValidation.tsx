import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, CheckCircle, XCircle, Loader2, UserCheck, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PendingAdmin {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  matricule: string | null;
  is_approved: boolean | null;
  created_at: string | null;
}

export default function AdminValidation() {
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingAdmins(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      // 1. Approuver le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Ajouter le rôle admin dans user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast.success("Administrateur approuvé avec succès !");
      fetchPendingAdmins();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de l'approbation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user', is_approved: false })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Demande rejetée");
      fetchPendingAdmins();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors du rejet");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#C41E25]" />
          <div>
            <h1 className="text-2xl font-bold">Validation des Administrateurs</h1>
            <p className="text-muted-foreground">Gérez les demandes d'accès administrateur</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchPendingAdmins} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Demandes en attente ({pendingAdmins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name || '-'}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{admin.matricule || '-'}</Badge>
                    </TableCell>
                    <TableCell>{admin.phone || '-'}</TableCell>
                    <TableCell>
                      {admin.created_at 
                        ? new Date(admin.created_at).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                        En attente
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(admin.id)}
                        disabled={processingId === admin.id}
                      >
                        {processingId === admin.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approuver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(admin.id)}
                        disabled={processingId === admin.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Refuser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
