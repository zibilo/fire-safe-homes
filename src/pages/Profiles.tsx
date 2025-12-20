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
    <div className="h-screen bg-black text-white overflow-hidden relative">

      {/* ===================== HEADER ===================== */}
      <motion.header
        initial={{ transform: "translateZ(0)" }}
        className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 pb-6"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Communauté</h1>
            <p className="text-xs text-gray-400">
              {loading
                ? "Chargement..."
                : `${profiles.length} membres enregistrés`}
            </p>
          </div>

          <div className="w-10 h-10 bg-[#151515] rounded-full flex items-center justify-center border border-white/10">
            <Users className="w-5 h-5 text-[#C41E25]" />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Chercher par nom, quartier..."
            className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </motion.header>

      {/* ===================== MAIN (SCROLL) ===================== */}
      <main
        className="absolute left-0 right-0 overflow-y-auto px-4 pt-6 pb-28"
        style={{
          top: HEADER_HEIGHT,
          bottom: NAVBAR_HEIGHT
        }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-[#C41E25] rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredProfiles.length ? (
                filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#151515] rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold truncate">
                          {profile.name}
                        </h3>
                        <p className="text-xs text-[#C41E25] mb-1">
                          {profile.role}
                        </p>
                        <div className="flex items-center text-xs text-gray-400 gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {profile.district}
                        </div>
                        <p className="text-xs text-gray-300">
                          <b>{profile.housesCount}</b> maison(s)
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Aucun résultat pour "{searchTerm}"
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ===================== NAVBAR ===================== */}
      <motion.nav
        initial={{ transform: "translateZ(0)" }}
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg border-t border-white/5" />
        <ul className="relative flex justify-around items-center h-full max-w-lg mx-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={item.path}
                  className={`flex flex-col items-center ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
};

export default Profiles;
