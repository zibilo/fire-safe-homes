import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home as HomeIcon, 
  User, 
  Users, 
  BookOpen, 
  Shield, 
  Search,
  MapPin,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

// Interface pour typer les données Supabase
interface ProfileData {
  id: string;
  name: string; // full_name dans la DB
  role: string; // role dans user_roles ou 'Citoyen' par défaut
  housesCount: number;
  district: string; // Récupéré depuis la première maison de l'user
  avatar_url: string | null;
}

const Profiles = () => {
  const location = useLocation();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les profils réels
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer tous les profils
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email
        `);

      if (error) throw error;

      // 2. Pour chaque profil, récupérer ses infos enrichies (maisons, role)
      // Note: Idéalement, cela devrait être une View SQL pour la perf, mais on fait simple ici.
      const enrichedProfiles = await Promise.all((users || []).map(async (user) => {
        
        // Compter les maisons
        const { count } = await supabase
          .from('houses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Récupérer le district de la première maison (pour afficher une loc)
        const { data: house } = await supabase
          .from('houses')
          .select('district')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        // Récupérer le rôle (si table user_roles existe, sinon mock)
        // Ici on mocke pour l'instant sauf si tu as une table roles
        const role = "Citoyen"; 

        return {
          id: user.id,
          name: user.full_name || user.email?.split('@')[0] || "Utilisateur",
          role: role,
          housesCount: count || 0,
          district: house?.district || "Non renseigné",
          avatar_url: null // ou user.avatar_url si ajouté plus tard
        };
      }));

      setProfiles(enrichedProfiles);
    } catch (err) {
      console.error("Erreur chargement profils:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const navItems = [
    { path: "/", icon: HomeIcon, label: "" },
    { path: "/profiles", icon: Users, label: "" },
    { path: "/blog", icon: BookOpen, label: "" },
  ];

  // Filtrage
  const filteredProfiles = profiles.filter((profile) => {
    const term = searchTerm.toLowerCase();
    return (
      profile.name.toLowerCase().includes(term) ||
      profile.district.toLowerCase().includes(term)
    );
  });

  // Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#10141D] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-20 bg-[#10141D]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 pb-6">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Communauté</h1>
                <p className="text-xs text-gray-400">
                  {loading ? "Chargement..." : `${profiles.length} membres enregistrés`}
                </p>
            </div>
            <div className="w-10 h-10 bg-[#1F2433] rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                <Users className="w-5 h-5 text-[#C41E25]" />
            </div>
        </div>

        {/* Recherche */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Chercher par nom, quartier..." 
                className="w-full bg-[#1F2433] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-[#C41E25]/50 transition-colors placeholder:text-gray-600 text-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
        </div>
      </header>

      {/* 2. Contenu */}
      <main className="flex-1 px-4 pb-32 pt-6 overflow-y-auto">
        
        {loading ? (
             <div className="flex justify-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C41E25]"></div>
             </div>
        ) : (
            <motion.div 
            key={searchTerm}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
            <AnimatePresence mode="popLayout">
                {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                    <motion.div 
                    layout
                    key={profile.id} 
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#1F2433] rounded-2xl p-4 border border-white/5 shadow-lg relative overflow-hidden group hover:border-[#C41E25]/30 transition-colors"
                    >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C41E25]/0 via-[#C41E25]/5 to-[#C41E25]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-[#10141D] shadow-md">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-[#2A3042] text-gray-300">
                                {profile.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-base font-semibold text-white truncate pr-2">{profile.name}</h3>
                                <p className="text-xs text-[#C41E25] font-medium mb-1">{profile.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                            <MapPin className="w-3 h-3" />
                            <span>{profile.district}</span>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-[#10141D] border border-white/5 px-3 py-1.5 rounded-lg">
                            <div className="w-5 h-5 rounded-full bg-[#350a0a] flex items-center justify-center">
                                <HomeIcon className="w-3 h-3 text-[#C41E25]" />
                            </div>
                            <span className="text-xs font-medium text-gray-300">
                                <span className="text-white font-bold">{profile.housesCount}</span> maison{profile.housesCount > 1 ? 's' : ''}
                            </span>
                        </div>
                        </div>
                    </div>
                    </motion.div>
                ))
                ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-12 flex flex-col items-center"
                >
                    <div className="w-16 h-16 bg-[#1F2433] rounded-full flex items-center justify-center mb-4 border border-white/5">
                    <Search className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-white font-medium mb-1">Aucun résultat</h3>
                    <p className="text-gray-500 text-sm">
                    Aucun profil ne correspond à "{searchTerm}"
                    </p>
                </motion.div>
                )}
            </AnimatePresence>
            </motion.div>
        )}
      </main>

      {/* 3. Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="absolute inset-0 bg-[#10141D]/90 backdrop-blur-lg border-t border-white/5 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]"></div>
        <ul className="relative flex justify-around items-center h-20 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1">
                <Link to={item.path} className="flex flex-col items-center justify-center w-full h-full relative group">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute top-2 w-12 h-8 bg-[#350a0a] rounded-full border border-[#C41E25]/30 shadow-[0_0_15px_rgba(196,30,37,0.3)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`relative z-10 p-1 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}
                  >
                    <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive ? 'text-white translate-y-0' : 'text-gray-500 translate-y-1'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                     <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-2 w-1 h-1 bg-[#C41E25] rounded-full"
                     />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Profiles;