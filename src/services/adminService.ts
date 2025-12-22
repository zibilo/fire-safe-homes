import { supabase } from "@/integrations/supabase/client";

export const adminService = {
  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Total Maisons
      const { count: totalHouses } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true });

      // 2. Total Utilisateurs
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 3. Maisons en attente
      const { count: pendingHouses } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 4. Maisons approuvées
      const { count: approvedHouses } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // 5. Maisons avec analyse
      const { count: housesWithAnalysis } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true })
        .not('plan_analysis', 'is', null);

      // 6. Maisons récentes
      const { data: recentHousesData, error: recentError } = await supabase
        .from('houses')
        .select(`
          id, street, city, status, created_at,
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) console.error("Erreur recentHouses:", recentError);

      // Calcul croissance
      const { count: recentHousesCount } = await supabase
        .from('houses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const houseGrowth = (totalHouses && recentHousesCount)
        ? Math.round((recentHousesCount / totalHouses) * 100)
        : 0;

      // Formatage
      const formattedRecentHouses = recentHousesData?.map((h: any) => {
        const profile = Array.isArray(h.profiles) ? h.profiles[0] : h.profiles;
        
        return {
          id: h.id,
          // MAPPING : On dit à l'UI que l'adresse c'est la rue
          address: h.street,
          city: h.city,
          status: h.status,
          created_at: h.created_at,
          user: {
            name: profile?.full_name || 'Inconnu',
            email: profile?.email || 'N/A'
          }
        };
      }) || [];

      return {
        totalHouses: totalHouses || 0,
        totalUsers: totalUsers || 0,
        pendingHouses: pendingHouses || 0,
        approvedHouses: approvedHouses || 0,
        housesWithAnalysis: housesWithAnalysis || 0,
        recentHouses: formattedRecentHouses,
        growth: {
          houses: houseGrowth,
          users: 0, 
        },
      };
    } catch (error) {
      console.error('[AdminService] Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // ------------------------------------------
  // HOUSES MANAGEMENT
  // ------------------------------------------
  async getHouses(searchQuery?: string) {
    try {
      let query = supabase
        .from('houses')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        // Filtre sur 'street' ou 'city'
        query = query.or(`street.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedHouses = data.map((house: any) => {
        const parseJson = (val: any) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
          }
          return val || [];
        };

        const profileData = Array.isArray(house.profiles) ? house.profiles[0] : house.profiles;

        return {
          ...house,
          // Mapping street -> address
          address: house.street,
          
          photos_urls: parseJson(house.photos_urls),
          documents_urls: parseJson(house.documents_urls),
          plan_analysis: typeof house.plan_analysis === 'string'
            ? JSON.parse(house.plan_analysis)
            : house.plan_analysis,

          user: profileData ? {
            id: profileData.id,
            name: profileData.full_name || 'Utilisateur sans nom',
            email: profileData.email || 'Email inconnu',
            role: 'user'
          } : {
            id: 'unknown',
            name: 'Utilisateur supprimé',
            email: 'N/A',
            role: 'user'
          }
        };
      });

      return { houses: formattedHouses };
    } catch (error) {
      console.error('[AdminService] Error fetching houses:', error);
      throw error;
    }
  },

  async deleteHouse(id: string | number) {
    try {
      const { error } = await supabase.from('houses').delete().eq('id', String(id));
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  },

  // ------------------------------------------
  // USERS MANAGEMENT
  // ------------------------------------------
  async getUsers(searchQuery?: string) {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedUsers = await Promise.all(data.map(async (profile: any) => {
        // NOTE: Ceci ne récupère que le COUNT, pas les maisons et articles réels
        const { count } = await supabase
          .from('houses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        return {
          id: profile.id,
          name: profile.full_name || 'Sans nom',
          email: profile.email,
          role: 'user',
          created_at: new Date(profile.created_at || Date.now()).getTime() / 1000,
          updated_at: new Date(profile.updated_at || Date.now()).getTime() / 1000,
          housesCount: count || 0,
          houses: [], // Ces champs sont vides ici et devront être remplis séparément
          blogPosts: [] // Ces champs sont vides ici et devront être remplis séparément
        };
      }));

      return { users: formattedUsers };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  // NOUVELLE FONCTION : Supprimer l'utilisateur
  async deleteUser(userId: string) {
    // 🚨 AVERTISSEMENT DE SÉCURITÉ : La suppression d'utilisateur via cette méthode
    // nécessite l'utilisation de la clé `service_role` de Supabase
    // et doit impérativement être exécutée dans un environnement backend sécurisé (Edge Function, Serverless, etc.).
    // Si ce code est exécuté directement dans le navigateur avec la clé "anon", il échouera.
    
    try {
      // Étape 1 : Supprimer l'utilisateur de l'authentification
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        // Ne lance pas d'erreur critique si l'utilisateur est déjà supprimé (souvent le cas)
        if (authError.message.includes('User not found')) {
            console.warn(`User ${userId} not found in Auth, continuing cleanup.`);
        } else {
            throw authError;
        }
      }

      // Étape 2 (Facultatif) : Les RLS et les règles de CASCADE DELETE devraient gérer la suppression des
      // enregistrements dans `profiles`, `houses`, etc.
      // Si ce n'est pas le cas, vous devez ajouter des commandes DELETE ici :
      // 
      // Exemple pour supprimer le profil manuellement (si RLS est mal configuré) :
      // const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
      // if (profileError) console.error("Erreur suppression profil:", profileError);


      return { success: true, message: `Utilisateur ${userId} supprimé.` };
    } catch (error) {
      console.error('Error deleting user:', error);
      // Renvoyer l'erreur pour que la notification toast fonctionne
      throw new Error(`Échec de la suppression de l'utilisateur: ${(error as Error).message}`); 
    }
  },

  // ------------------------------------------
  // BLOG MANAGEMENT
  // ------------------------------------------
  async getBlogPosts(searchQuery?: string) {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { posts: data || [] };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  },

  async createBlogPost(data: any) {
    try {
      const { data: newPost, error } = await supabase
        .from('blog_posts')
        .insert([{
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          views: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return newPost;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  },

  async updateBlogPost(id: string | number, data: any) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      if (data.status === 'published' && !data.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data: updatedPost, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', String(id))
        .select()
        .single();

      if (error) throw error;
      return updatedPost;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  },

  async deleteBlogPost(id: string | number) {
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', String(id));
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  },
};
