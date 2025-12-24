import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isApproved: boolean;
  isSuperAdmin: boolean;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Fonction pour récupérer le profil admin
  const fetchAdminProfile = async (userId: string): Promise<{ profile: AdminUser | null; needsApproval: boolean }> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_approved, is_super_admin, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erreur récupération profil:", error);
        return { profile: null, needsApproval: false };
      }

      // Vérifier si l'utilisateur est admin et approuvé OU super admin
      const isAdmin = profile.role === 'admin';
      const isApproved = profile.is_approved === true;
      const isSuperAdmin = profile.is_super_admin === true;

      if (!isAdmin) {
        return { profile: null, needsApproval: false };
      }

      // Les super admins sont toujours approuvés
      if (!isApproved && !isSuperAdmin) {
        return { profile: null, needsApproval: true };
      }

      return {
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.full_name || 'Administrateur',
          isApproved: isApproved || isSuperAdmin,
          isSuperAdmin: isSuperAdmin
        },
        needsApproval: false
      };
    } catch (error) {
      console.error("Erreur fetchAdminProfile:", error);
      return { profile: null, needsApproval: false };
    }
  };

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            const { profile } = await fetchAdminProfile(session.user.id);
            
            if (profile) {
              setIsAuthenticated(true);
              setAdminUser(profile);
            } else {
              setIsAuthenticated(false);
              setAdminUser(null);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const { profile } = await fetchAdminProfile(session.user.id);
        
        if (profile) {
          setIsAuthenticated(true);
          setAdminUser(profile);
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const { profile, needsApproval } = await fetchAdminProfile(data.user.id);
        
        if (!profile && !needsApproval) {
          await supabase.auth.signOut();
          return { error: "Ce compte n'a pas les droits administrateur" };
        }

        if (needsApproval) {
          await supabase.auth.signOut();
          return { error: "Votre compte administrateur est en attente de validation par le Super Admin" };
        }

        if (profile) {
          setIsAuthenticated(true);
          setAdminUser(profile);
        }
        return {};
      }

      return { error: "Erreur lors de la connexion" };
    } catch (error: any) {
      return { error: error.message || "Une erreur est survenue" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAdminUser(null);
    navigate("/admin/login");
  };

  const isSuperAdmin = adminUser?.isSuperAdmin ?? false;

  return (
    <AdminAuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      adminUser, 
      isSuperAdmin,
      signIn, 
      signOut 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
