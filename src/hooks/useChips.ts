import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Chip {
  id: string;
  nome: string;
  config: any;
  status: string;
  created_at: string;
  updated_at: string;
  usuario_id: string;
}

export const useChips = () => {
  const [chips, setChips] = useState<Chip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchChips = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saas_conexoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChips(data || []);
    } catch (error) {
      console.error('Erro ao buscar chips:', error);
      toast({
        title: "Erro ao carregar chips",
        description: "Não foi possível carregar seus chips.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createChip = async (chipData: { nome: string; descricao?: string }) => {
    if (!user) return false;

    try {
      const config = {
        descricao: chipData.descricao || '',
        aiModel: 'ChatGPT',
        status: 'desconectado',
        telefone: null // Será preenchido quando conectar via Evolution API
      };

      // Verificar se o usuário está autenticado corretamente
      console.log('Usuário autenticado:', user);
      
      const { data, error } = await supabase
        .from('saas_conexoes')
        .insert({
          nome: chipData.nome,
          config: config,
          usuario_id: user.id,
          status: 'ativo'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Chip criado com sucesso!",
        description: `${chipData.nome} foi cadastrado e está pronto para uso.`,
      });

      // Recarregar lista de chips
      await fetchChips();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar chip:', error);
      
      if (error.message?.includes('Limite de chips atingido')) {
        toast({
          title: "Limite de chips atingido",
          description: `Você atingiu o limite de ${user.chips_limite} chips.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar chip",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const updateChip = async (chipId: string, updates: Partial<Chip>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .update(updates)
        .eq('id', chipId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast({
        title: "Chip atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      await fetchChips();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar chip:', error);
      toast({
        title: "Erro ao atualizar chip",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteChip = async (chipId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saas_conexoes')
        .delete()
        .eq('id', chipId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast({
        title: "Chip removido",
        description: "O chip foi removido com sucesso.",
      });

      await fetchChips();
      return true;
    } catch (error) {
      console.error('Erro ao deletar chip:', error);
      toast({
        title: "Erro ao remover chip",
        description: "Não foi possível remover o chip.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchChips();
    }
  }, [user]);

  return {
    chips,
    isLoading,
    createChip,
    updateChip,
    deleteChip,
    refetch: fetchChips
  };
};