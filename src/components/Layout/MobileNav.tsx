import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, PlusSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItemsData = [
  { path: "/", label: "Accueil", icon: Home },
  { path: "/profiles", label: "Profils", icon: Users },
  { path: "/blog", label: "Blog", icon: BookOpen },
  { path: "/register-house", label: "Enregistrer", icon: PlusSquare },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-gray-800 safe-area-bottom">
      <ul className="flex justify-around items-center h-16">
        {navItemsData.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className="flex flex-col items-center justify-center gap-1 w-full h-full relative"
              >
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-red-500" : "text-gray-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-indicator"
                    className="absolute bottom-0 w-full h-1 bg-red-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileNav;
