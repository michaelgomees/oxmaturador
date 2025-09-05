import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Connection {
  id: string;
  nome: string;
  config: any; // Usando any para compatibilidade com o Supabase Json type
  status: string;
  created_at: string;
  updated_at: string;
  usuario_id: string;
}

export interface EvolutionInstance {
  instanceName: string;
  qrCode: string;
  status: 'open' | 'close' | 'connecting';
  connectionState: 'online' | 'offline';
}

export const useConnections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Buscar conexões do banco de dados
  const fetchConnections = async () => {
    if (!user?.id) {
      console.log('Sem usuário autenticado, não buscando conexões');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Buscando conexões para usuário:', user.id);
      const { data, error } = await supabase
        .from('saas_conexoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Conexões encontradas:', data);
      setConnections(data || []);
    } catch (error) {
      console.error('Erro ao buscar conexões:', error);
      toast({
        title: "Erro ao carregar conexões",
        description: "Não foi possível carregar suas conexões.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Criar nova conexão
  const createConnection = async (connectionData: { nome: string; descricao?: string }) => {
    if (!user?.id) return false;

    try {
      // Ler configuração da Evolution API (endpoint obrigatorio)
      const evolutionConfigStr = localStorage.getItem('ox-evolution-api');
      if (!evolutionConfigStr) {
        toast({
          title: "Configuração da Evolution ausente",
          description: "Defina o endpoint da Evolution em APIs > Evolution API.",
          variant: "destructive",
        });
        return false;
      }
      const apiConfig = JSON.parse(evolutionConfigStr);
      if (!apiConfig.endpoint) {
        toast({
          title: "Endpoint não configurado",
          description: "Informe o endpoint da Evolution API antes de criar a conexão.",
          variant: "destructive",
        });
        return false;
      }

      // Gerar nome da instância
      const sanitizedName = connectionData.nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const instanceName = `ox_${sanitizedName || 'connection'}_${Date.now().toString().slice(-6)}`;

      // Criar instância na Evolution via Edge Function
      const { data: evoCreate, error: evoErr } = await supabase.functions.invoke('evolution-create-instance', {
        body: { baseUrl: apiConfig.endpoint, instanceName },
      });
      if (evoErr || !evoCreate?.success) {
        console.error('Falha ao criar instância Evolution:', evoErr || evoCreate);
        toast({
          title: "Erro ao criar instância",
          description: "Não foi possível criar a instância no Evolution.",
          variant: "destructive",
        });
        return false;
      }

      const config = {
        descricao: connectionData.descricao || '',
        aiModel: 'ChatGPT',
        status: 'aguardando_qr',
        telefone: null,
        evolutionInstance: instanceName,
        evolutionConfig: {
          endpoint: apiConfig.endpoint,
          instanceName: instanceName,
        },
      };

      console.log('Criando nova conexão e salvando no banco:', connectionData);

      const { data, error } = await supabase
        .from('saas_conexoes')
        .insert({
          nome: connectionData.nome,
          config: config,
          usuario_id: user.id,
          status: 'ativo',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conexão criada com sucesso!",
        description: `${connectionData.nome} foi criada e está pronta para leitura do QR Code.`,
      });

      if (data) {
        setConnections(prev => [data, ...prev]);
      }

      await fetchConnections();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar conexão:', error);

      if (error.message?.includes('Limite de chips atingido')) {
        toast({
          title: "Limite de conexões atingido",
          description: `Você atingiu o limite de ${userProfile.chips_limite} conexões.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conexão",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Atualizar conexão
  const updateConnection = async (connectionId: string, updates: Partial<Connection>) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .update(updates)
        .eq('id', connectionId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast({
        title: "Conexão atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      await fetchConnections();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar conexão:', error);
      toast({
        title: "Erro ao atualizar conexão",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Deletar conexão
  const deleteConnection = async (connectionId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .delete()
        .eq('id', connectionId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast({
        title: "Conexão removida",
        description: "A conexão foi removida com sucesso.",
      });

      await fetchConnections();
      return true;
    } catch (error) {
      console.error('Erro ao deletar conexão:', error);
      toast({
        title: "Erro ao remover conexão",
        description: "Não foi possível remover a conexão.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Criar instância no Evolution API
  const createEvolutionInstance = async (connectionId: string) => {
    try {
      const evolutionConfigStr = localStorage.getItem('ox-evolution-api');
      if (!evolutionConfigStr) throw new Error('Configuração da Evolution API não encontrada');
      const apiConfig = JSON.parse(evolutionConfigStr);
      const connection = connections.find(c => c.id === connectionId);
      if (!connection) throw new Error('Conexão não encontrada');

      const instanceName = connection.config?.evolutionInstance || `ox_connection_${connectionId.slice(0, 8)}`;

      // Criar instância na Evolution
      const { data: evoCreate, error: evoErr } = await supabase.functions.invoke('evolution-create-instance', {
        body: { baseUrl: apiConfig.endpoint, instanceName },
      });
      if (evoErr || !evoCreate?.success) throw new Error('Falha ao criar instância na Evolution');

      const updatedConfig = {
        ...connection.config,
        evolutionInstance: instanceName,
        status: 'aguardando_qr',
        evolutionConfig: {
          ...(connection.config?.evolutionConfig || {}),
          endpoint: apiConfig.endpoint,
          instanceName,
        },
      };

      await updateConnection(connectionId, { config: updatedConfig });

      toast({
        title: "Instância criada",
        description: "Instância Evolution criada. Escaneie o QR Code para conectar.",
      });

      // Obter QR Code imediatamente
      const { data: evoQR, error: qrErr } = await supabase.functions.invoke('evolution-get-qr', {
        body: { baseUrl: apiConfig.endpoint, instanceName },
      });
      if (qrErr || !evoQR?.success) {
        return { instanceName, qrCode: '', status: 'connecting' as const };
      }

      return {
        instanceName,
        qrCode: evoQR.qrCode as string,
        status: 'connecting' as const,
      };
    } catch (error) {
      console.error('Erro ao criar instância Evolution:', error);
      toast({
        title: "Erro ao criar instância",
        description: "Não foi possível criar a instância no Evolution.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Obter QR Code de uma conexão
  const getConnectionQRCode = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return null;

    const endpoint = connection.config?.evolutionConfig?.endpoint;
    const instanceName = connection.config?.evolutionInstance;

    if (!instanceName) {
      return await createEvolutionInstance(connectionId);
    }

    try {
      const { data, error } = await supabase.functions.invoke('evolution-get-qr', {
        body: { baseUrl: endpoint, instanceName },
      });

      if (error || !data?.success) {
        throw new Error('Falha ao obter QR');
      }

      return {
        instanceName,
        qrCode: data.qrCode as string,
        status: 'connecting' as const,
      };
    } catch (err) {
      console.error('Erro ao obter QR da Evolution:', err);
      toast({
        title: "Erro ao obter QR",
        description: "Não foi possível obter o QR Code. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id]);

  return {
    connections,
    isLoading,
    createConnection,
    updateConnection,
    deleteConnection,
    createEvolutionInstance,
    getConnectionQRCode,
    refetch: fetchConnections
  };
};