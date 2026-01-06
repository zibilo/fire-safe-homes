import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  X,
  Home,
  User,
  ChevronRight,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import MobileNav from "@/components/Layout/MobileNav";
import Navbar from "@/components/Layout/Navbar";

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
   Component
======================= */
const Profiles = () => {
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
        .select("id, full_name, email, role");

      if (error) throw error;

      const { data: housesData } = await supabase
        .from("houses")
        .select("user_id, district");

      const enriched: ProfileData[] = (users || []).map(user => {
        const userHouses = housesData?.filter(h => h.user_id === user.id) || [];
        const districts = [...new Set(userHouses.map(h => h.district))];
        
        return {
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Utilisateur",
          role: user.role || "Citoyen",
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

  /* =======================
     Animations
  ======================= */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.25 }
    }
  };

  /* =======================
     Render
  ======================= */
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header - Sticky & Mobile optimized */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Communauté
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {loading ? "Chargement..." : `${profiles.length} membre${profiles.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ml-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Search Input - Touch optimized */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full h-12 bg-card border border-border rounded-2xl pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all touch-manipulation"
              style={{ fontSize: '16px' }}
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors touch-manipulation"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto w-full">
          {loading ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-[76px] bg-card rounded-2xl animate-pulse border border-border"
                />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Aucun membre trouvé
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Essayez avec un autre terme de recherche
              </p>
            </motion.div>
          ) : (
            /* Profile List */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {filteredProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  variants={itemVariants}
                  layout
                  className="group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card hover:bg-accent/50 rounded-2xl border border-border transition-all duration-200 active:scale-[0.98] cursor-pointer touch-manipulation">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/20 flex-shrink-0">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm sm:text-base">
                        {profile.name
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                          {profile.name}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] sm:text-xs px-2 py-0.5 h-5 flex-shrink-0 bg-primary/10 text-primary border-0"
                        >
                          {profile.role}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{profile.district}</span>
                        </span>
                        <span className="flex items-center gap-1.5 flex-shrink-0">
                          <Home className="h-3 w-3" />
                          <span>{profile.housesCount} maison{profile.housesCount !== 1 ? "s" : ""}</span>
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Android Compatibility Styles */}
      <style>{`
        /* Support for dynamic viewport height (Android Chrome) */
        @supports (min-height: 100dvh) {
          .min-h-screen {
            min-height: 100dvh;
          }
        }
        
        /* Smooth momentum scrolling */
        main {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Better touch targets for Android */
        @media (pointer: coarse) {
          button, a, [role="button"], .touch-manipulation {
            min-height: 44px;
          }
        }
        
        /* Remove blue highlight on Android tap */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Prevent overscroll bounce on Android */
        html, body {
          overscroll-behavior: none;
        }
        
        /* Safe area padding for notched devices */
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
};

export default Profiles;
