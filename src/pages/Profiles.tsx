import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  Users,
  BookOpen,
  Search,
  MapPin,
  X,
  PhoneCall,
  HelpCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

/* =======================
   Types
======================= */
interface ProfileData {
  id: string;
  name: string;
  role: string;
  housesCount: number;
  district: string;
  avatar_url: string | null;
}

/* =======================
   Constants (layout)
======================= */
const HEADER_HEIGHT = 120; // px
const NAVBAR_HEIGHT = 80;  // px

/* =======================
   Component
======================= */
const Profiles = () => {
  const location = useLocation();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /* =======================
     Effects
  ======================= */
  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProfiles(
      profiles.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.district.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, profiles]);

  /* =======================
     Data fetch
  ======================= */
  const fetchProfiles = async () => {
    try {
      setLoading(true);

      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (error) throw error;

      const enriched = await Promise.all(
        (users || []).map(async user => {
          const { count } = await supabase
            .from("houses")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { data: house } = await supabase
            .from("houses")
            .select("district")
            .eq("user_id", user.id)
            .limit(1)
            .single();

          return {
            id: user.id,
            name:
              user.full_name ||
              user.email?.split("@")[0] ||
              "Utilisateur",
            role: "Citoyen",
            housesCount: count || 0,
            district: house?.district || "Non renseigné",
            avatar_url: null
          };
        })
      );

      setProfiles(enriched);
    } catch (e) {
      console.error("Erreur chargement profils", e);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Navigation
  ======================= */
  const navItems = [
    { path: "/", icon: HomeIcon, label: "Accueil" },
    { path: "/profiles", icon: Users, label: "Membres" },
    { path: "/blog", icon: BookOpen, label: "Blog" },
    { path: "/appeler", icon: PhoneCall, label: "Appeler" },
    { path: "/aide", icon: HelpCircle, label: "Aide" }
  ];

  /* =======================
     Animations
  ======================= */
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  /* =======================
     Render
  ======================= */
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-24">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tighter mb-2">
            Communauté FireSafe
          </h1>
          <p className="text-gray-400">
            {loading ? "Chargement des membres..." : `${profiles.length} membres protègent leur communauté.`}
          </p>
          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Chercher un membre par nom ou quartier..."
              className="w-full bg-gray-900/80 border border-gray-700 rounded-full py-3 pl-12 pr-10 text-base text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-red-500 rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredProfiles.length ? (
                  filteredProfiles.map((profile, index) => (
                    <motion.div
                      key={profile.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                      className="bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-red-500/50 transition-colors"
                    >
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4 border-4 border-gray-700">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-800 text-lg">
                            {profile.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-lg truncate w-full">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-red-500 mb-2">
                          {profile.role}
                        </p>
                        <div className="flex items-center text-xs text-gray-400 gap-1.5 mb-3">
                          <MapPin className="w-3.5 h-3.5" />
                          {profile.district}
                        </div>
                        <p className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
                          <b>{profile.housesCount}</b> maison(s) enregistrée(s)
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-gray-500">
                    <p>Aucun membre trouvé pour "{searchTerm}"</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profiles;
