-- Function to fetch a user for login bypassing RLS safely
CREATE OR REPLACE FUNCTION public.get_user_for_login(p_email text)
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  senha_hash text,
  chips_limite integer,
  status text
) AS $$
  SELECT id, nome, email, senha_hash, chips_limite, status
  FROM public.saas_usuarios
  WHERE lower(email) = lower(p_email) AND status = 'ativo'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_for_login(text) TO anon, authenticated;