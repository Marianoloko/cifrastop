ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone);