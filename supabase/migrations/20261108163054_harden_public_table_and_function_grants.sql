REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

REVOKE INSERT, UPDATE, DELETE ON public.providers FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;