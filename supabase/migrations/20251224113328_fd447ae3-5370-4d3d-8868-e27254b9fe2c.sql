-- Ajouter la colonne is_super_admin si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Mettre à jour admin@firesafehomes.com comme super admin approuvé
UPDATE public.profiles 
SET is_approved = true, is_super_admin = true 
WHERE email = 'admin@firesafehomes.com';

-- S'assurer que le super admin a le rôle admin dans user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.email = 'admin@firesafehomes.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  );

-- Créer une fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Politique pour permettre au super admin de gérer les profils
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON public.profiles;
CREATE POLICY "Super admin can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Politique pour permettre au super admin de gérer les rôles
DROP POLICY IF EXISTS "Super admin can manage user roles" ON public.user_roles;
CREATE POLICY "Super admin can manage user roles"
ON public.user_roles
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));