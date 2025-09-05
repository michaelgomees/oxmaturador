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
    if (!userProfile) {
      console.log('Usuário não autenticado, não buscando conexões');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Buscando conexões para usuário:', userProfile.id);
      const { data, error } = await supabase
        .from('saas_conexoes')
        .select('*')
        .eq('usuario_id', userProfile.id)
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
    if (!userProfile) return false;

    try {
      const config = {
        descricao: connectionData.descricao || '',
        aiModel: 'ChatGPT',
        status: 'aguardando_conexao',
        telefone: null,
        evolutionInstance: null,
        evolutionConfig: {
          endpoint: '',
          apiKey: '',
          instanceName: `instance_${Date.now()}`
        }
      };

      console.log('Criando nova conexão:', connectionData);
      
      const { data, error } = await supabase
        .from('saas_conexoes')
        .insert({
          nome: connectionData.nome,
          config: config,
          usuario_id: userProfile.id,
          status: 'ativo'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conexão criada com sucesso!",
        description: `${connectionData.nome} foi criada e está pronta para configuração.`,
      });

      // Atualizar a lista
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
    if (!userProfile) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .update(updates)
        .eq('id', connectionId)
        .eq('usuario_id', userProfile.id);

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
    if (!userProfile) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .delete()
        .eq('id', connectionId)
        .eq('usuario_id', userProfile.id);

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
      // Obter configuração da Evolution API do localStorage
      const evolutionConfig = localStorage.getItem('ox-evolution-api');
      if (!evolutionConfig) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      const apiConfig = JSON.parse(evolutionConfig);
      const instanceName = `ox_connection_${connectionId.slice(0, 8)}`;

      // Simular criação da instância (integração real seria aqui)
      const mockQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/qr/${instanceName}`;
      
      // Atualizar a conexão com os dados da instância
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        const updatedConfig = {
          ...connection.config,
          evolutionInstance: instanceName,
          status: 'aguardando_qr',
          evolutionConfig: {
            ...connection.config.evolutionConfig,
            endpoint: apiConfig.endpoint,
            apiKey: apiConfig.apiKey,
            instanceName: instanceName
          }
        };

        await updateConnection(connectionId, { config: updatedConfig });

        toast({
          title: "Instância criada",
          description: "Instância Evolution criada. Escaneie o QR Code para conectar.",
        });

        return {
          instanceName,
          qrCode: mockQRCode,
          status: 'connecting' as const
        };
      }
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
    if (!connection?.config?.evolutionInstance) {
      return await createEvolutionInstance(connectionId);
    }

    // Simular busca do QR Code existente
    return {
      instanceName: connection.config.evolutionInstance,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/qr/${connection.config.evolutionInstance}`,
      status: 'connecting' as const
    };
  };

  useEffect(() => {
    if (userProfile) {
      fetchConnections();
    }
  }, [userProfile]);

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