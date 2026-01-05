import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationCounts {
  newUsers: number;
  newReports: number;
  newHouses: number;
  newGeoRequests: number;
}

export const useAdminNotifications = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    newUsers: 0,
    newReports: 0,
    newHouses: 0,
    newGeoRequests: 0,
  });

  const [lastChecked, setLastChecked] = useState({
    users: localStorage.getItem("lastUserCheck") || new Date().toISOString(),
    reports: localStorage.getItem("lastReportCheck") || new Date().toISOString(),
    houses: localStorage.getItem("lastHouseCheck") || new Date().toISOString(),
    geoRequests: localStorage.getItem("lastGeoCheck") || new Date().toISOString(),
  });

  useEffect(() => {
    // Écoute des nouveaux utilisateurs (profiles)
    const usersChannel = supabase
      .channel('profiles-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const newUser = payload.new as any;
          toast.info("Nouvel utilisateur inscrit", {
            description: `${newUser.full_name || newUser.email}`,
            duration: 5000,
          });
          setCounts(prev => ({ ...prev, newUsers: prev.newUsers + 1 }));
        }
      )
      .subscribe();

    // Écoute des nouveaux rapports
    const reportsChannel = supabase
      .channel('reports-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const newReport = payload.new as any;
          toast.info("Nouveau rapport généré", {
            description: `Type: ${newReport.report_type}`,
            duration: 5000,
          });
          setCounts(prev => ({ ...prev, newReports: prev.newReports + 1 }));
        }
      )
      .subscribe();

    // Écoute des nouvelles maisons
    const housesChannel = supabase
      .channel('houses-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'houses' },
        (payload) => {
          const newHouse = payload.new as any;
          toast.info("Nouvelle maison enregistrée", {
            description: `${newHouse.owner_name} - ${newHouse.street}, ${newHouse.city}`,
            duration: 5000,
          });
          setCounts(prev => ({ ...prev, newHouses: prev.newHouses + 1 }));
        }
      )
      .subscribe();

    // Écoute des nouvelles demandes de géolocalisation
    const geoChannel = supabase
      .channel('geo-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'geo_requests' },
        (payload) => {
          const newGeo = payload.new as any;
          toast.warning("Nouvelle demande de géolocalisation", {
            description: `Téléphone: ${newGeo.phone_number || 'Non spécifié'}`,
            duration: 8000,
          });
          setCounts(prev => ({ ...prev, newGeoRequests: prev.newGeoRequests + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(housesChannel);
      supabase.removeChannel(geoChannel);
    };
  }, []);

  const markAsRead = (type: 'users' | 'reports' | 'houses' | 'geoRequests') => {
    const now = new Date().toISOString();
    
    switch (type) {
      case 'users':
        setCounts(prev => ({ ...prev, newUsers: 0 }));
        localStorage.setItem("lastUserCheck", now);
        break;
      case 'reports':
        setCounts(prev => ({ ...prev, newReports: 0 }));
        localStorage.setItem("lastReportCheck", now);
        break;
      case 'houses':
        setCounts(prev => ({ ...prev, newHouses: 0 }));
        localStorage.setItem("lastHouseCheck", now);
        break;
      case 'geoRequests':
        setCounts(prev => ({ ...prev, newGeoRequests: 0 }));
        localStorage.setItem("lastGeoCheck", now);
        break;
    }
    
    setLastChecked(prev => ({ ...prev, [type]: now }));
  };

  const totalNotifications = counts.newUsers + counts.newReports + counts.newHouses + counts.newGeoRequests;

  return { counts, markAsRead, totalNotifications };
};
