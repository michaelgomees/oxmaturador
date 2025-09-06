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
          description: "Configure a Evolution API primeiro em APIs > Evolution API (Global).",
          variant: "destructive",
        });
        return false;
      }
      
      const apiConfig = JSON.parse(evolutionConfigStr);
      console.log('Config da Evolution API:', apiConfig);
      
      if (!apiConfig.endpoint) {
        toast({
          title: "Endpoint não configurado",
          description: "Informe o endpoint da Evolution API antes de criar a conexão.",
          variant: "destructive",
        });
        return false;
      }
      
      if (apiConfig.status !== 'connected') {
        toast({
          title: "Evolution API não testada",
          description: "Teste a conexão com a Evolution API primeiro.",
          variant: "destructive",
        });
        return false;
      }

      const normalizeEndpoint = (value: string) => {
        let url = String(value || '').trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        return url.replace(/\/$/, '');
      };
      const baseUrl = normalizeEndpoint(apiConfig.endpoint);

      // Gerar nome da instância
      const sanitizedName = connectionData.nome
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const instanceName = `ox_${sanitizedName || 'connection'}_${Date.now().toString().slice(-6)}`;

      // Criar instância na Evolution via Edge Function
      const { data: evoCreate, error: evoErr } = await supabase.functions.invoke('evolution-create-instance', {
        body: { baseUrl, instanceName },
      });
      
      console.log('Evolution create response:', { evoCreate, evoErr });
      
      if (evoErr) {
        console.error('Erro na edge function:', evoErr);
        toast({
          title: "Erro na comunicação",
          description: `Falha ao conectar com a Evolution API: ${evoErr.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!evoCreate?.success) {
        console.error('Evolution API retornou erro:', evoCreate);
        const errorMsg = evoCreate?.message || 'Resposta inválida da Evolution API';
        
        // Mostrar tentativas detalhadas se disponíveis
        let detailsMsg = '';
        if (evoCreate?.tried && Array.isArray(evoCreate.tried)) {
          const statusCodes = evoCreate.tried.map((t: any) => t.status || 'erro').join(', ');
          detailsMsg = ` Status das tentativas: ${statusCodes}`;
        }
        
        toast({
          title: "Erro na Evolution API",
          description: `${errorMsg}${detailsMsg}. Verifique se o endpoint da Evolution está correto e acessível.`,
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
          endpoint: baseUrl,
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
          description: `Você atingiu o limite de conexões permitidas.`,
          variant: "destructive",
        });
      } else if (error.message?.includes('Falha ao conectar com a Evolution API')) {
        toast({
          title: "Erro de comunicação",
          description: "Verifique se a Evolution API está acessível e a chave de API está correta.",
          variant: "destructive",
        });
      } else if (error.message?.includes('Erro Evolution:')) {
        toast({
          title: "Erro na Evolution API",
          description: "A Evolution API retornou um erro. Verifique as configurações e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conexão",
          description: "Ocorreu um erro inesperado. Verifique os logs para mais detalhes.",
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

      const normalizeEndpoint = (value: string) => {
        let url = String(value || '').trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        return url.replace(/\/$/, '');
      };

      // Criar instância na Evolution
      const { data: evoCreate, error: evoErr } = await supabase.functions.invoke('evolution-create-instance', {
        body: { baseUrl: normalizeEndpoint(apiConfig.endpoint), instanceName },
      });
      if (evoErr || !evoCreate?.success) throw new Error('Falha ao criar instância na Evolution');

      const updatedConfig = {
        ...connection.config,
        evolutionInstance: instanceName,
        status: 'aguardando_qr',
        evolutionConfig: {
          ...(connection.config?.evolutionConfig || {}),
          endpoint: normalizeEndpoint(apiConfig.endpoint),
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

      if (error) {
        console.error('Erro evolution-get-qr:', error);
        toast({
          title: "Erro ao obter QR",
          description: error.message || "Falha na comunicação com a Evolution API.",
          variant: "destructive",
        });
        return null;
      }

      if (!data?.success) {
        console.error('Evolution get-qr retornou erro:', data);
        const attempts = Array.isArray((data as any)?.tried) ? (data as any).tried : [];
        const statusInfo = attempts.length ? `Status: ${attempts.map((a: any) => a.status).filter(Boolean).join(', ')}` : '';
        toast({
          title: "Erro ao obter QR",
          description: `${(data as any)?.message || 'Falha ao obter QR.'} ${statusInfo}`.trim(),
          variant: "destructive",
        });
        return null;
      }

      return {
        instanceName,
        qrCode: (data as any).qrCode as string,
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

  // Atualizar dados da conexão com informações da Evolution API
  const updateConnectionData = async (connectionId: string): Promise<void> => {
    try {
      const connection = connections.find(c => c.id === connectionId);
      if (!connection) return;

      let config = connection.config;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error('Erro ao fazer parse da config:', e);
          return;
        }
      }

      if (!config.evolutionInstance) return;

      const evolutionConfig = JSON.parse(localStorage.getItem('ox-evolution-api') || '{}');
      if (!evolutionConfig.endpoint) return;

      const { data, error } = await supabase.functions.invoke('evolution-get-instance', {
        body: {
          baseUrl: evolutionConfig.endpoint,
          instanceName: config.evolutionInstance
        }
      });

      if (error || !data.success) {
        console.error('Erro ao obter dados da instância:', error || data);
        return;
      }

      // Atualizar a conexão com os novos dados
      const updatedConfig = {
        ...config,
        phoneNumber: data.phoneNumber,
        profilePicture: data.profilePicture,
        displayName: data.displayName,
        connectionState: data.status
      };

      await updateConnection(connectionId, {
        config: updatedConfig
      });

      // Atualizar o estado local
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, config: updatedConfig }
          : conn
      ));

      toast({
        title: "Dados atualizados",
        description: "Informações da conexão foram atualizadas com sucesso",
      });

    } catch (error) {
      console.error('Erro ao atualizar dados da conexão:', error);
    }
  };

  return {
    connections,
    isLoading,
    createConnection,
    updateConnection,
    deleteConnection,
    createEvolutionInstance,
    getConnectionQRCode,
    updateConnectionData,
    refetch: fetchConnections
  };
};