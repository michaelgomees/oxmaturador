import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import oxLogo from '@/assets/ox-logo.png';
// Temporariamente usando a logo atual até conseguir baixar a nova

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Usar a função RPC para buscar usuário
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_for_login', { p_email: email });

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        toast({
          title: "Erro de Login",
          description: "Erro interno do sistema.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!userData || userData.length === 0) {
        toast({
          title: "Erro de Login",
          description: "Usuário não encontrado ou inativo.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const user = userData[0];

      // Verificar senha (comparando com o campo senha_hash da tabela)
      if (password !== user.senha_hash) {
        toast({
          title: "Erro de Login",
          description: "Credenciais inválidas.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Salvar dados do usuário no localStorage para sessão
      localStorage.setItem('ox-user-session', JSON.stringify({
        id: user.id,
        nome: user.nome,
        email: user.email,
        chips_limite: user.chips_limite,
        status: user.status
      }));

      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${user.nome}!`,
        variant: "default"
      });

      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="w-full max-w-md relative z-10">

        <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-xl">
          <CardHeader className="text-center space-y-4">
            {/* Logo e Título */}
            <div className="flex items-center justify-center gap-3">
              <img 
                src={oxLogo} 
                alt="OX Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  OX Maturador
                </h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestão</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-xl">Fazer Login</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>


              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Fazer Login"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Desenvolvido com 💚 pela equipe OX Maturador
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;