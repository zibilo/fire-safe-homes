import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home },
    { path: "/profiles", icon: Users },
    { path: "/blog", icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#10141D]/95 backdrop-blur-lg border-t border-white/10 px-6 pb-4 pt-2 safe-area-bottom">
      <ul className="flex justify-between items-end max-w-md mx-auto w-full h-14">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <li key={item.path} className="flex-1 flex justify-center h-full">
              <Link
                to={item.path}
                className="flex flex-col items-center justify-end gap-1 w-full relative group"
              >
                {/* Nouveau fond animé premium & centré */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute bottom-3 w-16 h-10 bg-[#350a0a]/80 rounded-2xl border border-white/10 shadow-lg shadow-black/30 z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  />
                )}

                {/* Icône */}
                <div className="relative z-10 mb-0.5">
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-200"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-300 relative z-10",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                ></span>

                {/* Petit point rouge */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-[#C41E25] rounded-full"
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
