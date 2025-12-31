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
    // Fond sombre uniforme et plus de ligne
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md px-4 pb-0 pt-2 safe-area-bottom">
      
      <ul className="flex justify-between items-end max-w-md mx-auto w-full h-14"> 
        {navItemsData.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <li key={item.path} className="flex-1 flex justify-center h-full">
              <Link
                to={item.path}
                className="flex flex-col items-center justify-end gap-1 w-full relative group p-1"
              >
                {/* Indicateur actif */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute top-0 w-8 h-1 bg-[#E54B4B] rounded-b-md shadow-md shadow-[#E54B4B]/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  />
                )}

                {/* Icône */}
                <div className="relative z-10 mt-2"> 
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      isActive
                        ? "text-white"
                        : "text-gray-300 group-hover:text-white"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[11px] mt-0.5 font-semibold transition-colors duration-300 relative z-10",
                    isActive 
                      ? "text-[#E54B4B]" 
                      : "text-gray-300"
                  )}
                >
                  {item.label}
                </span>

              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileNav;
