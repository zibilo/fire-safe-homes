-- Add matricule column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS matricule TEXT;

-- Update RLS policy to allow admins to view all profiles for validation
CREATE POLICY "Admins can view all profiles for validation"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));