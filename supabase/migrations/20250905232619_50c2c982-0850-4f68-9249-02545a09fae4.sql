-- Remove a foreign key constraint desnecessária entre saas_conexoes e saas_usuarios
-- já que estamos usando auth.uid() do Supabase Auth que não precisa referenciar saas_usuarios

-- Primeiro, vamos verificar se existe a constraint
DO $$ 
BEGIN
    -- Remove a constraint se ela existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'saas_conexoes_usuario_id_fkey' 
        AND table_name = 'saas_conexoes'
    ) THEN
        ALTER TABLE public.saas_conexoes DROP CONSTRAINT saas_conexoes_usuario_id_fkey;
    END IF;
END $$;