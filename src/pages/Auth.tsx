import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Flame, Loader2, ArrowLeft, Mail, Lock, User, CheckCircle, XCircle, Home, Truck, Bell, Siren } from "lucide-react";

// --- INFOS ADMINISTRATEUR ---
const ADMIN_CONTACT_NUMBER = "+33 1 23 45 67 89"; // Remplacez par le vrai numéro
const ADMIN_CONTACT_EMAIL = "support@securepompiers.com"; // Remplacez par le vrai email

// --- CONFIGURATION DU CAPTCHA D'ORDRE DE CLIC ---
const ICON_OPTIONS = [
    { id: 1, name: "Maison", Icon: Home, color: "text-blue-400" },
    { id: 2, name: "Camion", Icon: Truck, color: "text-green-400" },
    { id: 3, name: "Cloche", Icon: Bell, color: "text-yellow-400" },
    { id: 4, name: "Sirène", Icon: Siren, color: "text-red-400" },
];

// Fonction pour générer une séquence de clic aléatoire
const generateCaptchaSequence = () => {
    const sequence = [];
    const availableIds = [...ICON_OPTIONS.map(i => i.id)];

    // Choisir 3 éléments uniques pour la séquence cible
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableIds.length);
        const selectedId = availableIds[randomIndex];
        sequence.push(selectedId);
        // Retirer l'ID choisi pour garantir l'unicité
        availableIds.splice(randomIndex, 1);
    }

    // Créer la consigne lisible par l'utilisateur
    const instructionNames = sequence.map(id => ICON_OPTIONS.find(i => i.id === id)?.name || 'Icône').join(', ');
    const instruction = `Veuillez cliquer dans l'ordre : ${instructionNames}`;

    return { instruction, sequence };
};

const Auth = () => {
  const navigate = useNavigate();
  
  // États du formulaire
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Champs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // --- ÉTATS DU CAPTCHA DE CLIC ---
  const [captchaData, setCaptchaData] = useState(generateCaptchaSequence());
  const [currentClicks, setCurrentClicks] = useState<number[]>([]);
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [attempted, setAttempted] = useState(false); 

  // Regénérer le CAPTCHA au changement de mode ou après une tentative échouée
  useEffect(() => {
      resetCaptcha();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  // Vérification de la séquence lorsque le nombre de clics atteint la longueur de la séquence cible
  useEffect(() => {
    if (currentClicks.length === captchaData.sequence.length && attempted) {
        verifyCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentClicks]);


  const resetCaptcha = () => {
      setCaptchaData(generateCaptchaSequence());
      setCurrentClicks([]);
      setCaptchaSolved(false);
      setAttempted(false);
  };
  
  const handleIconClick = (id: number) => {
    if (captchaSolved) return;
    setAttempted(true);

    const newClicks = [...currentClicks, id];
    setCurrentClicks(newClicks);
  };

  const verifyCaptcha = () => {
      // Comparer la séquence de clics avec la séquence cible
      const isCorrect = captchaData.sequence.every((val, index) => val === currentClicks[index]);
      
      if (isCorrect) {
          setCaptchaSolved(true);
          toast.success("Vérification de sécurité réussie !");
      } else {
          setCaptchaSolved(false);
          toast.error("Séquence de clic incorrecte. Réessayez.");
          setTimeout(() => resetCaptcha(), 1000); 
      }
      return isCorrect;
  };

  // --- LOGIQUE POP-UP MOT DE PASSE OUBLIÉ ---
  const handleForgotPasswordClick = (e: React.MouseEvent) => {
      e.preventDefault();

      toast.error("Accès Restreint", {
          description: (
              <div className="flex flex-col space-y-2 text-sm">
                  <p>Pour des raisons de sécurité, veuillez contacter l'administrateur afin de réinitialiser votre mot de passe manuellement.</p>
                  <p className="font-medium mt-1">
                      Téléphone : <a href={`tel:${ADMIN_CONTACT_NUMBER}`} className="text-red-300 underline">{ADMIN_CONTACT_NUMBER}</a>
                      <br/>
                      Email : <a href={`mailto:${ADMIN_CONTACT_EMAIL}`} className="text-red-300 underline">{ADMIN_CONTACT_EMAIL}</a>
                  </p>
              </div>
          ),
          duration: 10000, 
          className: "bg-[#1F2433] border-white/10 text-white", 
      });
  };

  // --- LOGIQUE DE SOUMISSION DU FORMULAIRE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VÉRIFICATION DU CAPTCHA FINALE 
    if (!captchaSolved) {
        toast.warning("Veuillez compléter la vérification de sécurité en cliquant sur les icônes.");
        return;
    }

    setLoading(true);

    try {
      // 🔹 1. LOGIQUE DE CONNEXION / 🔹 2. LOGIQUE D'INSCRIPTION
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
        if (error) throw error;
        toast.success("Bon retour parmi nous !");
        navigate("/home");
      } 
      else {
        if (!fullName.trim()) { setLoading(false); return toast.warning("Veuillez entrer votre nom complet."); }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: { data: { full_name: fullName, }, },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error(error);
      let message = "Une erreur est survenue.";
      if (error.message.includes("Invalid login")) message = "Email ou mot de passe incorrect.";
      if (error.message.includes("already registered")) message = "Cet email est déjà utilisé.";
      if (error.message.includes("password")) message = "Le mot de passe doit faire au moins 6 caractères.";
      toast.error(message);
    } finally {
      setLoading(false);
      resetCaptcha(); 
    }
  };


  // --- RENDU ---
  return (
    <div 
        className="min-h-screen bg-[#10141D] flex items-center justify-center p-4 relative"
    >
      
      {/* Bouton Retour */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Carte d'Authentification */}
      <Card className="w-full max-w-md bg-[#1F2433] border-white/10 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-2 border border-red-500/20">
            <Flame className="w-8 h-8 text-[#C41E25]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? "Connexion" : "Inscription"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin 
              ? "Accédez à votre espace sécurisé" 
              : "Rejoignez le réseau Secure Pompiers"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Champ Nom (Uniquement si Inscription) */}
            {!isLogin && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="fullName" className="text-gray-300">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="fullName"
                    placeholder="Jean Dupont"
                    className="pl-10 bg-[#10141D] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#C41E25]"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  className="pl-10 bg-[#10141D] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#C41E25]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                {isLogin && (
                    <a 
                        href="#" 
                        onClick={handleForgotPasswordClick} // <-- LIGNE CORRIGÉE
                        className="text-xs text-[#C41E25] hover:text-red-400"
                    >
                        Mot de passe oublié ?
                    </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-[#10141D] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#C41E25]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* --- IMPLÉMENTATION DU CAPTCHA D'ORDRE DE CLIC (DIY) --- */}
            <div className="space-y-3 pt-4">
                <Label className="text-gray-300 flex flex-col items-start gap-1">
                    <span className="font-semibold text-sm">Vérification de sécurité :</span>
                    <span className="text-sm font-light text-white italic">{captchaData.instruction}</span>
                </Label>
                
                <div className="flex justify-between items-center gap-2">
                    {ICON_OPTIONS.map((item) => {
                        const clickIndex = currentClicks.indexOf(item.id);
                        const isClicked = clickIndex !== -1;
                        const isCompleted = captchaSolved && isClicked;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleIconClick(item.id)}
                                disabled={captchaSolved || currentClicks.length >= captchaData.sequence.length}
                                className={`
                                    relative w-1/4 h-16 flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out
                                    border ${isClicked ? 'border-2' : 'border-dashed border-white/10'}
                                    ${isCompleted ? 'bg-green-600/30 border-green-500' : 
                                      isClicked ? 'bg-[#C41E25]/30 border-[#C41E25]' : 
                                      'bg-[#10141D] hover:bg-white/5'}
                                    ${captchaSolved ? 'cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <item.Icon className={`w-8 h-8 ${item.color} ${isCompleted ? 'text-white' : ''}`} />
                                <span className={`text-xs mt-1 ${isCompleted ? 'text-white' : 'text-gray-400'}`}>
                                    {item.name}
                                </span>
                                {isClicked && (
                                    <div className={`absolute top-[-8px] right-[-8px] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white 
                                        ${isCompleted ? 'bg-green-600' : 'bg-[#C41E25]'}`}>
                                        {clickIndex + 1}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                 <div className="mt-2 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    {captchaSolved ? (
                        <> <CheckCircle className="w-4 h-4 text-green-500" /> Vérification Validée </>
                    ) : (
                        <> <XCircle className="w-4 h-4 text-gray-500" /> Statut : {currentClicks.length}/{captchaData.sequence.length} clics </>
                    )}
                </div>
            </div>
            {/* --- FIN CAPTCHA --- */}


            {/* Bouton de Soumission */}
            <Button 
                type="submit" 
                className="w-full bg-[#C41E25] hover:bg-[#a0181e] text-white font-bold h-11 mt-6"
                disabled={loading || !captchaSolved} 
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Se connecter" : "Créer un compte"
              )}
            </Button>

          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">
              {isLogin ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#C41E25] hover:text-red-400 font-semibold hover:underline transition-all"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;