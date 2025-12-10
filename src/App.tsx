import React, { lazy, Suspense, useEffect } from "react";
import OneSignal from 'react-onesignal'; // ✅ Import OneSignal
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

// Pages Publiques
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import RegisterHouse from "./pages/RegisterHouse";
import Auth from "./pages/Auth";
import GeoLocate from "./pages/Public/GeoLocate";

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

import NotFound from "./pages/NotFound";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import MobileNav from "./components/Layout/MobileNav";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";

const queryClient = new QueryClient();

const App = () => {
  
  // ✅ INITIALISATION ONESIGNAL
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "2e492b85-f706-48ae-9943-dda545a9792c",
          safari_web_id: "web.onesignal.auto.2ccd5ae7-3528-4a1e-96f6-138881299499",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false, // On utilise votre bouton personnalisé
          },
          // Important pour que ça marche avec Vite et votre sw.ts
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
                {/* --- ROUTE PUBLIQUE SPÉCIALE (Géolocalisation Victime) --- */}
                <Route path="/loc/:id" element={<GeoLocate />} />

                {/* --- ROUTES PUBLIQUES CLASSIQUES --- */}
                <Route
                  path="/"
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