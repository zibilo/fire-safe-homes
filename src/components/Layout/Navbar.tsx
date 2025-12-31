import { Link } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationButton } from "@/components/NotificationButton";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-red-500" strokeWidth={1.5} />
            <span className="font-bold text-2xl text-white">FireSafe</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/">Accueil</NavLink>
            <NavLink to="/profiles">Profils</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/register-house">Enregistrer</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <NotificationButton />
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 hidden sm:block">
                  {user.email}
                </span>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-800"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                <Link to="/auth">Connexion</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
