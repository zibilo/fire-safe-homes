import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔥 FONCTION POUR RAFRAÎCHIR MANUELLEMENT LA SESSION
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔄 Tentative de rafraîchissement de session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erreur refresh session:', error);
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('✅ Session rafraîchie avec succès');
        return true;
      }
      
      console.warn('⚠️ Aucune session retournée après refresh');
      return false;
    } catch (error) {
      console.error('❌ Exception lors du refresh:', error);
      return false;
    }
  };

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        console.log('✅ Session initiale chargée');
      }
    });

    // 🔥 ÉCOUTER LES CHANGEMENTS D'AUTHENTIFICATION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Gérer les différents événements
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Utilisateur connecté');
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 Utilisateur déconnecté');
          toast.error('Session expirée');
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token rafraîchi automatiquement');
          break;
          
        case 'USER_UPDATED':
          console.log('✅ Utilisateur mis à jour');
          break;
          
        case 'PASSWORD_RECOVERY':
          console.log('🔑 Récupération de mot de passe');
          break;
      }
    });

    // 🔥 VÉRIFICATION PÉRIODIQUE DE LA SESSION (toutes les 5 minutes)
    const intervalId = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.warn('⚠️ Session perdue, tentative de rafraîchissement...');
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          console.error('❌ Impossible de rafraîchir la session');
          toast.error('Votre session a expiré. Veuillez vous reconnecter.', {
            duration: 5000,
          });
          setUser(null);
          setSession(null);
        }
      } else {
        // Vérifier si le token expire bientôt (moins de 10 minutes)
        const expiresAt = currentSession.expires_at;
        if (expiresAt) {
          const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
          const tenMinutes = 10 * 60;
          
          if (expiresIn < tenMinutes && expiresIn > 0) {
            console.log(`⏰ Token expire dans ${Math.floor(expiresIn / 60)} minutes, rafraîchissement préventif...`);
            await refreshSession();
          }
        }
      }
    }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (!error) {
        console.log('✅ Inscription réussie');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error) {
        console.log('✅ Connexion réussie');
        navigate("/");
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log('✅ Déconnexion réussie');
      navigate("/auth");
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      refreshSession, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
