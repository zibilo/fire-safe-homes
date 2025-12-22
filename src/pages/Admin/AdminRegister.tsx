import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminRegister() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    matricule: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Création du compte Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            matricule: formData.matricule,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // 2. Mise à jour du profil avec matricule et demande de rôle admin
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            matricule: formData.matricule,
            role: 'admin',
            is_approved: false
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;

        setSuccess(true);
        toast.success("Demande envoyée au Super Admin !");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#10141D] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-l-4 border-green-600">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Demande Enregistrée !</h2>
            <p className="text-gray-600">
              Votre compte administrateur a été créé avec succès.
              <br/><br/>
              <strong>Statut : En attente de validation.</strong>
              <br/>
              Le Super Admin doit activer votre accès avant que vous puissiez vous connecter au tableau de bord.
            </p>
            <Button onClick={() => navigate('/admin/login')} className="w-full bg-[#1F2433]">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10141D] flex items-center justify-center p-4 relative">
      {/* Bouton retour */}
      <Link to="/admin/login" className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Retour Login
      </Link>

      <Card className="max-w-lg w-full shadow-2xl border-white/10 bg-[#1F2433] text-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
            <Shield className="w-8 h-8 text-[#C41E25]" />
          </div>
          <CardTitle className="text-2xl font-bold">Demande d'Accès Admin</CardTitle>
          <p className="text-gray-400 text-sm">Réservé au personnel autorisé</p>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/50 text-yellow-500">
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>
              Toute inscription est soumise à vérification par le Commandement.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom Complet</Label>
                <Input 
                  className="bg-[#10141D] border-white/10 text-white"
                  placeholder="Capitaine..." 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input 
                  className="bg-[#10141D] border-white/10 text-white"
                  placeholder="M-12345" 
                  required
                  value={formData.matricule}
                  onChange={e => setFormData({...formData, matricule: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Professionnel</Label>
              <Input 
                type="email"
                className="bg-[#10141D] border-white/10 text-white"
                placeholder="nom@pompiers.cg" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                className="bg-[#10141D] border-white/10 text-white"
                placeholder="06..." 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input 
                type="password"
                className="bg-[#10141D] border-white/10 text-white"
                placeholder="••••••••" 
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full bg-[#C41E25] hover:bg-red-700 h-12 text-lg font-bold mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Envoyer ma demande"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
