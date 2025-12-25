-- Delete the orphan profile that has no matching auth user
DELETE FROM public.profiles WHERE email = 'admin@firesafehomes.com';

-- After the user signs up via /admin/register, we'll need to set them as super admin
-- Create a function to auto-set super admin for admin@firesafehomes.com
CREATE OR REPLACE FUNCTION public.auto_set_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@firesafehomes.com' THEN
    NEW.is_super_admin := true;
    NEW.is_approved := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set super admin on profile insert
DROP TRIGGER IF EXISTS auto_set_super_admin_trigger ON public.profiles;
CREATE TRIGGER auto_set_super_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_super_admin();