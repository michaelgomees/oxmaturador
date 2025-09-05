-- Remover usuário duplicado da tabela saas_usuarios para permitir recadastro correto
DELETE FROM saas_usuarios WHERE email = 'michael@email.com';