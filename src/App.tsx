import React, { lazy, Suspense, useEffect } from "react";
import OneSignal from 'react-onesignal';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

// --- IMPORTS STATIQUES (Doivent être en haut) ---
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import RegisterHouse from "./pages/RegisterHouse";
import Auth from "./pages/Auth";
import GeoLocate from "./pages/Public/GeoLocate";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import MobileNav from "./components/Layout/MobileNav";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";

// Pages Admin
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import Users from "./pages/Admin/Users";
import Houses from "./pages/Admin/Houses";
import Hydrants from "./pages/Admin/Hydrants";
import ManualLocate from "./pages/Admin/ManualLocate";
import BlogManagement from "./pages/Admin/BlogManagement";
import Stats from "./pages/Admin/Stats";
import Reports from "./pages/Admin/Reports";
import PlanAnalysisRobot from "./pages/Admin/PlanAnalysisRobot";

// --- IMPORTS LAZY (Après les imports statiques) ---
// 🆕 Page de Couverture pour le choix de la langue
const LanguageCoverPage = lazy(() => import("./pages/LanguageCoverPage"));

const queryClient = new QueryClient();

/* --- 🌟 NOUVEAU COMPOSANT : GESTIONNAIRE DE ROUTE INITIALE 🌟 --- */
const InitialRouteHandler = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const hasViewedCover = localStorage.getItem("cover_page_viewed");
        
        // Si l'utilisateur a déjà vu la page, on le redirige vers /home
        if (hasViewedCover === "true") {
            navigate("/home", { replace: true }); 
        } 
        // Sinon, il reste sur "/" qui affiche LanguageCoverPage
    }, [navigate]);

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#10141D] flex items-center justify-center text-white">Chargement...</div>}>
            <LanguageCoverPage />
        </Suspense>
    );
};

const App = () => {
  
  // ✅ INITIALISATION ONESIGNAL
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          // 👇 VOTRE ID EST ICI
          appId: "2e492b85-f706-48ae-9943-dda545a9792c",
          
          // Options de configuration
          safari_web_id: "web.onesignal.auto.2e492b85-f706-48ae-9943-dda545a9792c",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
            prenotify: false,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'S\'abonner aux notifications',
              'tip.state.subscribed': 'Vous êtes abonné',
              'tip.state.blocked': 'Notifications bloquées',
              'message.prenotify': 'Cliquez pour vous abonner',
              'message.action.subscribed': 'Merci de vous être abonné!',
              'message.action.resubscribed': 'Vous êtes de nouveau abonné',
              'message.action.unsubscribed': 'Vous ne recevrez plus de notifications',
              'message.action.subscribing': 'Abonnement en cours...',
              'dialog.main.title': 'Gérer les notifications',
              'dialog.main.button.subscribe': 'S\'ABONNER',
              'dialog.main.button.unsubscribe': 'SE DÉSABONNER',
              'dialog.blocked.title': 'Débloquer les notifications',
              'dialog.blocked.message': 'Suivez ces instructions pour autoriser les notifications:'
            }
          },
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: 'sw.js',
        });
        console.log("✅ OneSignal Initialisé");
      } catch (error) {
        console.error("❌ Erreur init OneSignal:", error);
      }
    };

    initOneSignal();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HoverReceiver />
        <BrowserRouter>
          <AuthProvider>
            <AdminAuthProvider>
              <Routes>
                
                {/* 1. 🥇 ROUTE RACINE : GESTIONNAIRE INTELLIGENT */}
                <Route
                    path="/"
                    element={<InitialRouteHandler />}
                />
                
                {/* 2. PAGE DE COUVERTURE (ACCÈS DIRECT) */}
                <Route
                    path="/lang-cover"
                    element={
                        <Suspense fallback={<div>Chargement...</div>}>
                            <LanguageCoverPage />
                        </Suspense>
                    }
                />
                
                {/* 3. ROUTE PUBLIQUE SPÉCIALE (Géolocalisation Victime) */}
                <Route path="/loc/:id" element={<GeoLocate />} />

                {/* 4. ROUTES PUBLIQUES CLASSIQUES - HOME EST MAINTENANT SUR /home */}
                <Route
                  path="/home"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <Home />
                      <Footer />
                      <MobileNav />
                    </div>
                  }
                />
                <Route
                  path="/profiles"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <Profiles />
                      <Footer />
                      <MobileNav />
                    </div>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <Blog />
                      <Footer />
                      <MobileNav />
                    </div>
                  }
                />
                <Route
                  path="/blog/:slug"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <BlogPost />
                      <Footer />
                      <MobileNav />
                    </div>
                  }
                />
                
                {/* --- ROUTE ENREGISTREMENT (SANS MobileNav) --- */}
                <Route
                  path="/register-house"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <RegisterHouse />
                    </div>
                  }
                />
                
                <Route path="/auth" element={<Auth />} />

                {/* --- ADMIN LOGIN --- */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* --- ADMIN DASHBOARD (PROTECTED) --- */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="houses" element={<Houses />} />
                  <Route path="hydrants" element={<Hydrants />} />
                  <Route path="locate" element={<ManualLocate />} />
                  <Route path="blog" element={<BlogManagement />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="robot-plan" element={<PlanAnalysisRobot />} />
                </Route>

                {/* CATCH-ALL */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;