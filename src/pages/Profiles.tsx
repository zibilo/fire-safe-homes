import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Home, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import MobileNav from "@/components/Layout/MobileNav";
import Navbar from "@/components/Layout/Navbar";

interface ProfileData {
  id: string;
  name: string;
  housesCount: number;
  district: string;
  avatar_url: string | null;
}

const Profiles = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const fetchProfiles = async () => {
    try {
      setLoading(true);

      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "moderator"]);

      const adminIds = new Set((adminRoles || []).map(r => r.user_id));

      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_super_admin");

      if (error) throw error;

      const { data: housesData } = await supabase
        .from("houses")
        .select("user_id, district");

      const standardUsers = (users || []).filter(user => 
        !adminIds.has(user.id) && 
        user.role !== "admin" && 
        user.role !== "moderator" &&
        !user.is_super_admin
      );

      const enriched: ProfileData[] = standardUsers.map(user => {
        const userHouses = housesData?.filter(h => h.user_id === user.id) || [];
        const districts = [...new Set(userHouses.map(h => h.district))];
        
        return {
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Utilisateur",
          housesCount: userHouses.length,
          district: districts[0] || "Non renseigné",
          avatar_url: null
        };
      });

      setProfiles(enriched);
      setFilteredProfiles(enriched);
    } catch (e) {
      console.error("Erreur chargement profils", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-6 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Communauté</h1>
          <p className="text-sm text-muted-foreground mb-5">
            {loading ? "Chargement..." : `${profiles.length} membre${profiles.length !== 1 ? "s" : ""} enregistrés`}
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full h-12 bg-card border border-border rounded-2xl pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              style={{ fontSize: "16px" }}
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 py-4 pb-28">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-card rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">Aucun membre trouvé</p>
              <p className="text-sm text-muted-foreground">Essayez un autre terme</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="space-y-3"
            >
              {filteredProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {profile.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {profile.housesCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Profiles;
