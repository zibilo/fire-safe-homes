import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { path: "/home", label: "Accueil", icon: Home },
  { path: "/profiles", label: "Profils", icon: Users },
  { path: "/blog", label: "Blog", icon: BookOpen },
];

const MobileNav = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-border" />
        
        <div className="relative safe-area-bottom">
          <ul className="flex items-center justify-around max-w-md mx-auto h-16 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/home" && location.pathname === "/");

              return (
                <li key={item.path} className="relative">
                  <Link
                    to={item.path}
                    className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300"
                  >
                    {/* Active background pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-2xl"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}

                    {/* Icon */}
                    <motion.div
                      animate={{ 
                        scale: isActive ? 1.1 : 1,
                        y: isActive ? -2 : 0 
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative z-10"
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </motion.div>

                    {/* Label */}
                    <motion.span
                      animate={{ opacity: isActive ? 1 : 0.7 }}
                      className={cn(
                        "text-[10px] mt-1 font-medium relative z-10 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </li>
              );
            })}

            {/* Theme toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 active:scale-95"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-500" />
                  )}
                </motion.div>
                <span className="text-[10px] mt-1 font-medium text-muted-foreground">
                  {theme === "dark" ? "Jour" : "Nuit"}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Spacer */}
      <div className="md:hidden h-20 safe-area-bottom" />
    </>
  );
};

export default MobileNav;
