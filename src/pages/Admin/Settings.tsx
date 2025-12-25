import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Key, Shield, User, Lock } from "lucide-react";

const Settings = () => {
  const { adminUser } = useAdminAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Pour le super admin: réinitialiser le mot de passe d'un autre utilisateur
  const [targetEmail, setTargetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!targetEmail) {
      toast.error("Veuillez entrer l'email de l'utilisateur");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin/login`
      });

      if (error) throw error;

      toast.success(`Email de réinitialisation envoyé à ${targetEmail}`);
      setTargetEmail("");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos paramètres de compte et de sécurité
        </p>
      </div>

      <Separator />

      {/* Informations du compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du compte
          </CardTitle>
          <CardDescription>
            Vos informations de compte actuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Nom</Label>
              <p className="font-medium">{adminUser?.name || "Non défini"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{adminUser?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Rôle</Label>
              <p className="font-medium flex items-center gap-2">
                {adminUser?.isSuperAdmin ? (
                  <>
                    <Shield className="h-4 w-4 text-primary" />
                    Super Administrateur
                  </>
                ) : (
                  "Administrateur"
                )}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Statut</Label>
              <p className="font-medium text-green-600">Approuvé</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changer son mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Changer mon mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={loading}
              className="w-fit"
            >
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Super Admin uniquement */}
      {adminUser?.isSuperAdmin && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Key className="h-5 w-5" />
              Réinitialisation de mot de passe (Super Admin)
            </CardTitle>
            <CardDescription>
              Envoyez un email de réinitialisation de mot de passe à un administrateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="targetEmail">Email de l'administrateur</Label>
                <Input
                  id="targetEmail"
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <Button 
                onClick={handleSendPasswordReset} 
                disabled={resetLoading}
                variant="outline"
                className="w-fit"
              >
                {resetLoading ? "Envoi..." : "Envoyer l'email de réinitialisation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
