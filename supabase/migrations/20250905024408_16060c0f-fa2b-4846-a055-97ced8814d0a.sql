-- Habilitar RLS nas tabelas (caso ainda não esteja)
ALTER TABLE public.saas_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_conexoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para saas_usuarios
-- Usuários podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON public.saas_usuarios;
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON public.saas_usuarios 
FOR SELECT 
USING (id = auth.uid());

-- Usuários podem atualizar apenas seus próprios dados
DROP POLICY IF EXISTS "Usuários podem atualizar seus dados" ON public.saas_usuarios;
CREATE POLICY "Usuários podem atualizar seus dados" 
ON public.saas_usuarios 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Políticas RLS para saas_conexoes
-- Usuários podem ver apenas suas próprias conexões
DROP POLICY IF EXISTS "Usuários podem ver suas conexões" ON public.saas_conexoes;
CREATE POLICY "Usuários podem ver suas conexões" 
ON public.saas_conexoes 
FOR SELECT 
USING (usuario_id = auth.uid());

-- Usuários podem inserir conexões apenas para si mesmos
DROP POLICY IF EXISTS "Usuários podem criar suas conexões" ON public.saas_conexoes;
CREATE POLICY "Usuários podem criar suas conexões" 
ON public.saas_conexoes 
FOR INSERT 
WITH CHECK (usuario_id = auth.uid());

-- Usuários podem atualizar apenas suas próprias conexões
DROP POLICY IF EXISTS "Usuários podem atualizar suas conexões" ON public.saas_conexoes;
CREATE POLICY "Usuários podem atualizar suas conexões" 
ON public.saas_conexoes 
FOR UPDATE 
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Usuários podem deletar apenas suas próprias conexões
DROP POLICY IF EXISTS "Usuários podem deletar suas conexões" ON public.saas_conexoes;
CREATE POLICY "Usuários podem deletar suas conexões" 
ON public.saas_conexoes 
FOR DELETE 
USING (usuario_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_saas_usuarios_updated_at ON public.saas_usuarios;
CREATE TRIGGER update_saas_usuarios_updated_at
  BEFORE UPDATE ON public.saas_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saas_conexoes_updated_at ON public.saas_conexoes;
CREATE TRIGGER update_saas_conexoes_updated_at
  BEFORE UPDATE ON public.saas_conexoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar limite de chips
CREATE OR REPLACE FUNCTION public.check_chip_limit()
RETURNS TRIGGER AS $$
DECLARE
  chips_usados INTEGER;
  limite INTEGER;
BEGIN
  -- Contar chips existentes do usuário
  SELECT COUNT(*) INTO chips_usados
  FROM public.saas_conexoes
  WHERE usuario_id = NEW.usuario_id AND status = 'ativo';
  
  -- Buscar limite do usuário
  SELECT chips_limite INTO limite
  FROM public.saas_usuarios
  WHERE id = NEW.usuario_id;
  
  -- Verificar se não excede o limite
  IF chips_usados >= limite THEN
    RAISE EXCEPTION 'Limite de chips atingido. Máximo permitido: %', limite;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para verificar limite antes de inserir
DROP TRIGGER IF EXISTS check_chip_limit_trigger ON public.saas_conexoes;
CREATE TRIGGER check_chip_limit_trigger
  BEFORE INSERT ON public.saas_conexoes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_chip_limit();