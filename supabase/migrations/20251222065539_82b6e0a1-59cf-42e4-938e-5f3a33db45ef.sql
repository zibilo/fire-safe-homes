-- Ajouter les colonnes manquantes à fire_stations
ALTER TABLE public.fire_stations 
ADD COLUMN IF NOT EXISTS station_type TEXT DEFAULT 'CS',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS personnel_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vehicles_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ambulance_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Activer RLS pour geo_requests si pas déjà fait
ALTER TABLE public.geo_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent supprimer les geo_requests
CREATE POLICY "Admins can manage geo_requests" ON public.geo_requests
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique pour lecture publique des geo_requests
CREATE POLICY "Public can read geo_requests" ON public.geo_requests
FOR SELECT USING (true);

-- Politique pour insertion publique (pour les victimes)
CREATE POLICY "Anyone can create geo_requests" ON public.geo_requests
FOR INSERT WITH CHECK (true);

-- Politique pour mise à jour publique (pour les victimes qui mettent à jour leur position)
CREATE POLICY "Anyone can update geo_requests" ON public.geo_requests
FOR UPDATE USING (true);

-- Activer realtime pour houses
ALTER PUBLICATION supabase_realtime ADD TABLE houses;