-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add profile_id column to accomplishments table
ALTER TABLE public.accomplishments 
ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Migrate existing accomplishments to use profile_id
-- First create profiles for existing users in accomplishments
INSERT INTO public.profiles (user_id, display_name)
SELECT DISTINCT user_id, 'User' as display_name
FROM public.accomplishments
WHERE user_id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Update accomplishments to reference profiles
UPDATE public.accomplishments 
SET profile_id = p.id
FROM public.profiles p
WHERE public.accomplishments.user_id = p.user_id;

-- Make profile_id NOT NULL after migration
ALTER TABLE public.accomplishments 
ALTER COLUMN profile_id SET NOT NULL;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own accomplishments" ON public.accomplishments;
DROP POLICY IF EXISTS "Users can insert their own accomplishments" ON public.accomplishments;

-- Drop the old user_id column from accomplishments
ALTER TABLE public.accomplishments 
DROP COLUMN user_id;

-- Create new RLS policies for accomplishments using profile_id
CREATE POLICY "Users can view their own accomplishments" 
ON public.accomplishments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = accomplishments.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own accomplishments" 
ON public.accomplishments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = accomplishments.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Add update and delete policies for accomplishments
CREATE POLICY "Users can update their own accomplishments" 
ON public.accomplishments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = accomplishments.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own accomplishments" 
ON public.accomplishments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = accomplishments.profile_id 
    AND profiles.user_id = auth.uid()
  )
);