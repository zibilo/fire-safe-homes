import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  User, 
  Home, 
  MapPin, 
  FileText, 
  Clock,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'user' | 'house' | 'geo' | 'report';
  title: string;
  description: string;
  created_at: string;
  read: boolean;
}

interface NotificationCenterProps {
  totalCount: number;
  onMarkAllRead: () => void;
}

export const NotificationCenter = ({ totalCount, onMarkAllRead }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    
    try {
      // Fetch recent profiles (new users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent houses
      const { data: houses } = await supabase
        .from('houses')
        .select('id, owner_name, street, city, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent geo requests
      const { data: geoRequests } = await supabase
        .from('geo_requests')
        .select('id, phone_number, lat, lng, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_type, generated_at')
        .order('generated_at', { ascending: false })
        .limit(10);

      const allNotifications: Notification[] = [];

      // Add user notifications
      profiles?.forEach(profile => {
        allNotifications.push({
          id: `user-${profile.id}`,
          type: 'user',
          title: 'Nouvel utilisateur inscrit',
          description: profile.full_name || profile.email,
          created_at: profile.created_at || new Date().toISOString(),
          read: false
        });
      });

      // Add house notifications
      houses?.forEach(house => {
        allNotifications.push({
          id: `house-${house.id}`,
          type: 'house',
          title: 'Nouvelle maison enregistrée',
          description: `${house.owner_name} - ${house.street}, ${house.city}`,
          created_at: house.created_at || new Date().toISOString(),
          read: false
        });
      });

      // Add geo notifications
      geoRequests?.forEach(geo => {
        allNotifications.push({
          id: `geo-${geo.id}`,
          type: 'geo',
          title: 'Nouvelle position partagée',
          description: geo.phone_number ? `Téléphone: ${geo.phone_number}` : `Position: ${geo.lat?.toFixed(4)}, ${geo.lng?.toFixed(4)}`,
          created_at: geo.created_at || new Date().toISOString(),
          read: geo.status === 'resolved'
        });
      });

      // Add report notifications
      reports?.forEach(report => {
        allNotifications.push({
          id: `report-${report.id}`,
          type: 'report',
          title: 'Nouveau rapport généré',
          description: `Type: ${report.report_type}`,
          created_at: report.generated_at,
          read: false
        });
      });

      // Sort by date
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications.slice(0, 30));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Listen for real-time updates
  useEffect(() => {
    const channels = [
      supabase
        .channel('notification-profiles')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
          if (open) fetchNotifications();
        })
        .subscribe(),
      
      supabase
        .channel('notification-houses')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'houses' }, () => {
          if (open) fetchNotifications();
        })
        .subscribe(),
      
      supabase
        .channel('notification-geo')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'geo_requests' }, () => {
          if (open) fetchNotifications();
        })
        .subscribe(),
      
      supabase
        .channel('notification-reports')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => {
          if (open) fetchNotifications();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [open]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'house':
        return <Home className="h-4 w-4 text-green-500" />;
      case 'geo':
        return <MapPin className="h-4 w-4 text-red-500" />;
      case 'report':
        return <FileText className="h-4 w-4 text-purple-500" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'user':
        return 'bg-blue-500/10';
      case 'house':
        return 'bg-green-500/10';
      case 'geo':
        return 'bg-red-500/10';
      case 'report':
        return 'bg-purple-500/10';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            {totalCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  onMarkAllRead();
                }}
                className="text-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    notification.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full ${getBgColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
