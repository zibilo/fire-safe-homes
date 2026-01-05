import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  Bot,
  MapPin,
  Droplets,
  ShieldCheck,
  Building2,
  Shield,
  Bell,
  Settings
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut, adminUser, isSuperAdmin } = useAdminAuth();
  const { counts, markAsRead, totalNotifications } = useAdminNotifications();

  const navigation = [
    { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
    { name: "Utilisateurs", href: "/admin/users", icon: Users, badge: counts.newUsers, badgeType: 'users' as const },
    { name: "Maisons", href: "/admin/houses", icon: Home, badge: counts.newHouses, badgeType: 'houses' as const },
    { name: "Casernes", href: "/admin/fire-stations", icon: Building2 },
    { name: "Points d'eau", href: "/admin/hydrants", icon: Droplets },
    { name: "Géolocalisation", href: "/admin/locate", icon: MapPin, badge: counts.newGeoRequests, badgeType: 'geoRequests' as const },
    { name: "Robot Analyse", href: "/admin/robot-plan", icon: Bot },
    { name: "Blog", href: "/admin/blog", icon: FileText },
    { name: "Statistiques", href: "/admin/stats", icon: BarChart3 },
    { name: "Rapports", href: "/admin/reports", icon: FileText, badge: counts.newReports, badgeType: 'reports' as const },
    { name: "Validation Admins", href: "/admin/validation", icon: ShieldCheck },
    ...(isSuperAdmin ? [
      { name: "Super Admin", href: "/admin/super-admin", icon: Shield },
      { name: "Paramètres", href: "/admin/settings", icon: Settings },
    ] : []),
  ];

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        const badgeCount = (item as any).badge || 0;
        const badgeType = (item as any).badgeType;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => {
              setIsSidebarOpen(false);
              if (badgeType && badgeCount > 0) {
                markAsRead(badgeType);
              }
            }}
          >
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
              {badgeCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 p-0 flex items-center justify-center animate-pulse">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="sr-only">
                  <SheetTitle>Menu de navigation</SheetTitle>
                  <SheetDescription>Menu principal de l'administration</SheetDescription>
                </div>

                <div className="flex flex-col h-full p-6 space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Administration</h2>
                    <p className="text-sm text-muted-foreground">Fire Safe Homes</p>
                  </div>
                  <nav className="flex-1 space-y-2 overflow-y-auto">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Administration</h1>
              {totalNotifications > 0 && (
                <Badge variant="destructive" className="h-6 px-2 animate-bounce">
                  <Bell className="h-3 w-3 mr-1" />
                  {totalNotifications}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {adminUser && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>{adminUser.name}</span>
                {isSuperAdmin && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Super Admin
                  </Badge>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card">
          <div className="flex flex-col h-[calc(100vh-73px)] sticky top-[73px] w-full p-6 space-y-4">
            <nav className="flex-1 space-y-2 overflow-y-auto">
              <NavLinks />
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;