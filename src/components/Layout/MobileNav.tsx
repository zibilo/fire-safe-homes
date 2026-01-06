import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Définition des libellés et des chemins
const navItemsData = [
  { path: "/", label: "Accueil", icon: Home },
  { path: "/profiles", label: "Profils", icon: Users },
  { path: "/blog", label: "Actus", icon: BookOpen },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <>
      {/* Navigation mobile optimisée Android */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/5">
        {/* Safe area padding pour les appareils à encoche */}
        <div className="safe-area-bottom">
          <ul className="flex justify-around items-center max-w-md mx-auto w-full h-16 px-2"> 
            {navItemsData.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <li key={item.path} className="flex-1 flex justify-center">
                  <Link
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 w-full py-2 px-3 rounded-xl transition-all duration-200 touch-manipulation",
                      "active:scale-95 active:bg-white/5",
                      "min-h-[48px]" // Material Design touch target
                    )}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Indicateur actif */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="absolute -top-0.5 w-10 h-1 bg-primary rounded-full shadow-lg shadow-primary/50"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Icône avec hardware acceleration */}
                    <div className="relative z-10 transform-gpu"> 
                      <item.icon
                        className={cn(
                          "w-6 h-6 transition-all duration-200",
                          isActive
                            ? "text-primary scale-110"
                            : "text-gray-400"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-200",
                        isActive 
                          ? "text-primary" 
                          : "text-gray-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      
      {/* Spacer pour éviter que le contenu soit caché derrière la nav */}
      <div className="md:hidden h-20 safe-area-bottom" />
    </>
  );
};

export default MobileNav;
