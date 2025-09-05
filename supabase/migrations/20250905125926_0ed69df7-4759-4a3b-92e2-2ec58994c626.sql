-- 1. Remover a política permissiva insegura da tabela saas_conexoes
DROP POLICY IF EXISTS "Permitir todas operações temporariamente" ON public.saas_conexoes;

-- 2. Adicionar políticas RLS seguras para saas_conexoes
CREATE POLICY "Users can view their own chips" 
ON public.saas_conexoes 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own chips" 
ON public.saas_conexoes 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own chips" 
ON public.saas_conexoes 
FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own chips" 
ON public.saas_conexoes 
FOR DELETE 
USING (auth.uid() = usuario_id);

-- 3. Trigger para forçar usuario_id automaticamente no INSERT
CREATE OR REPLACE FUNCTION public.enforce_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.usuario_id := auth.uid();
  IF NEW.usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_user_id_before_insert ON public.saas_conexoes;
CREATE TRIGGER enforce_user_id_before_insert
  BEFORE INSERT ON public.saas_conexoes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_id_on_insert();

-- 4. Triggers para updated_at (verificar se já existem antes de criar)
DROP TRIGGER IF EXISTS update_saas_conexoes_updated_at ON public.saas_conexoes;
CREATE TRIGGER update_saas_conexoes_updated_at
  BEFORE UPDATE ON public.saas_conexoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saas_usuarios_updated_at ON public.saas_usuarios;
CREATE TRIGGER update_saas_usuarios_updated_at
  BEFORE UPDATE ON public.saas_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger para verificar limite de chips antes do INSERT
DROP TRIGGER IF EXISTS check_chip_limit_before_insert ON public.saas_conexoes;
CREATE TRIGGER check_chip_limit_before_insert
  BEFORE INSERT ON public.saas_conexoes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_chip_limit();

-- 6. Criar índice para performance em consultas RLS
CREATE INDEX IF NOT EXISTS idx_saas_conexoes_usuario_id ON public.saas_conexoes(usuario_id);

-- 7. Remover função antiga e criar nova versão segura sem senha_hash
DROP FUNCTION IF EXISTS public.get_user_for_login(text);

CREATE OR REPLACE FUNCTION public.get_user_for_login(p_email text)
RETURNS TABLE(id uuid, nome text, email text, chips_limite integer, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, nome, email, chips_limite, status
  FROM public.saas_usuarios
  WHERE lower(email) = lower(p_email) AND status = 'ativo'
  LIMIT 1;
$function$;

-- 8. Adicionar políticas para saas_usuarios permitir criação de perfis
CREATE POLICY "Users can insert their own profile" 
ON public.saas_usuarios 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.saas_usuarios 
FOR DELETE 
USING (auth.uid() = id);

-- 9. Adicionar constraint único para email (verificar se já existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_email' 
                   AND table_name = 'saas_usuarios') THEN
        ALTER TABLE public.saas_usuarios ADD CONSTRAINT unique_email UNIQUE (email);
    END IF;
END $$;