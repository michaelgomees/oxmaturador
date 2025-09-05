import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Square, Users, MessageCircle, ArrowRight, Settings, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChipPair {
  id: string;
  chip1: string;
  chip2: string;
  isActive: boolean;
  messagesExchanged: number;
  lastActivity: string;
  status: 'running' | 'paused' | 'stopped';
}

interface MaturadorConfig {
  isRunning: boolean;
  selectedPairs: ChipPair[];
  conversationInterval: number;
  maxMessagesPerSession: number;
  useBasePrompt: boolean;
}

const AVAILABLE_CHIPS = [
  'Alex Marketing',
  'Sofia Suporte', 
  'João Vendas',
  'Ana Atendimento',
  'Carlos Técnico'
];

export const MaturadorTab = () => {
  const [config, setConfig] = useState<MaturadorConfig>({
    isRunning: false,
    selectedPairs: [],
    conversationInterval: 30,
    maxMessagesPerSession: 10,
    useBasePrompt: true
  });
  
  const [newPair, setNewPair] = useState({
    chip1: '',
    chip2: ''
  });
  
  const { toast } = useToast();

  // Carregar configuração do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ox-maturador-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Salvar configuração no localStorage
  const saveConfig = (newConfig: MaturadorConfig) => {
    setConfig(newConfig);
    localStorage.setItem('ox-maturador-config', JSON.stringify(newConfig));
  };

  const handleAddPair = () => {
    if (!newPair.chip1 || !newPair.chip2 || newPair.chip1 === newPair.chip2) {
      toast({
        title: "Erro",
        description: "Selecione dois chips diferentes para criar a conversa.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o par já existe
    const pairExists = config.selectedPairs.some(
      pair => 
        (pair.chip1 === newPair.chip1 && pair.chip2 === newPair.chip2) ||
        (pair.chip1 === newPair.chip2 && pair.chip2 === newPair.chip1)
    );

    if (pairExists) {
      toast({
        title: "Erro",
        description: "Esta dupla de chips já foi configurada.",
        variant: "destructive"
      });
      return;
    }

    const pair: ChipPair = {
      id: Date.now().toString(),
      chip1: newPair.chip1,
      chip2: newPair.chip2,
      isActive: true,
      messagesExchanged: 0,
      lastActivity: new Date().toISOString(),
      status: 'stopped'
    };

    const updatedConfig = {
      ...config,
      selectedPairs: [...config.selectedPairs, pair]
    };
    
    saveConfig(updatedConfig);
    setNewPair({ chip1: '', chip2: '' });
    
    toast({
      title: "Par adicionado",
      description: `Conversa entre ${newPair.chip1} e ${newPair.chip2} configurada.`
    });
  };

  const handleRemovePair = (pairId: string) => {
    const updatedConfig = {
      ...config,
      selectedPairs: config.selectedPairs.filter(pair => pair.id !== pairId)
    };
    saveConfig(updatedConfig);
    
    toast({
      title: "Par removido",
      description: "Configuração de conversa removida."
    });
  };

  const handleTogglePair = (pairId: string) => {
    const updatedPairs = config.selectedPairs.map(pair => 
      pair.id === pairId 
        ? { 
            ...pair, 
            isActive: !pair.isActive,
            status: (!pair.isActive ? 'running' : 'paused') as ChipPair['status'],
            lastActivity: new Date().toISOString()
          }
        : pair
    );
    
    const updatedConfig = { ...config, selectedPairs: updatedPairs };
    saveConfig(updatedConfig);
  };

  const handleStartMaturador = () => {
    if (config.selectedPairs.length === 0) {
      toast({
        title: "Erro",
        description: "Configure pelo menos uma dupla de chips para iniciar o maturador.",
        variant: "destructive"
      });
      return;
    }

    const activePairs = config.selectedPairs.filter(pair => pair.isActive);
    if (activePairs.length === 0) {
      toast({
        title: "Erro", 
        description: "Ative pelo menos uma dupla de chips para iniciar o maturador.",
        variant: "destructive"
      });
      return;
    }

    const updatedConfig = {
      ...config,
      isRunning: !config.isRunning,
      selectedPairs: config.selectedPairs.map(pair => ({
        ...pair,
        status: (config.isRunning ? 'stopped' : (pair.isActive ? 'running' : 'paused')) as ChipPair['status'],
        lastActivity: new Date().toISOString()
      }))
    };
    
    saveConfig(updatedConfig);
    
    toast({
      title: config.isRunning ? "Maturador pausado" : "Maturador iniciado",
      description: config.isRunning 
        ? "Todas as conversas foram pausadas." 
        : `Iniciando conversas entre ${activePairs.length} dupla(s) de chips.`
    });
  };

  const getStatusBadge = (status: ChipPair['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Em Execução</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pausado</Badge>;
      default:
        return <Badge variant="secondary">Parado</Badge>;
    }
  };

  const getAvailableChipsForSecond = (selectedFirst: string) => {
    return AVAILABLE_CHIPS.filter(chip => chip !== selectedFirst);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Iniciar Maturador</h2>
          <p className="text-muted-foreground">
            Configure conversas automáticas entre chips para simular diálogos naturais
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.isRunning}
              onCheckedChange={handleStartMaturador}
            />
            <Label>Maturador {config.isRunning ? 'Ativo' : 'Inativo'}</Label>
          </div>
          <Button 
            onClick={handleStartMaturador}
            variant={config.isRunning ? "destructive" : "default"}
          >
            {config.isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Parar Maturador
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Maturador
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Duplas Configuradas</p>
              <p className="text-2xl font-bold">{config.selectedPairs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Activity className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Duplas Ativas</p>
              <p className="text-2xl font-bold">{config.selectedPairs.filter(p => p.status === 'running').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <MessageCircle className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Mensagens Trocadas</p>
              <p className="text-2xl font-bold">{config.selectedPairs.reduce((acc, pair) => acc + pair.messagesExchanged, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Settings className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Status Sistema</p>
              <p className="text-2xl font-bold">{config.isRunning ? 'ON' : 'OFF'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração de Duplas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Nova Dupla</CardTitle>
            <CardDescription>
              Selecione dois chips que irão conversar entre si
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primeiro Chip</Label>
                <Select 
                  value={newPair.chip1} 
                  onValueChange={(value) => setNewPair(prev => ({ ...prev, chip1: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o primeiro chip" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CHIPS.map(chip => (
                      <SelectItem key={chip} value={chip}>
                        {chip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <Label>Segundo Chip</Label>
                <Select 
                  value={newPair.chip2} 
                  onValueChange={(value) => setNewPair(prev => ({ ...prev, chip2: value }))}
                  disabled={!newPair.chip1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segundo chip" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChipsForSecond(newPair.chip1).map(chip => (
                      <SelectItem key={chip} value={chip}>
                        {chip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleAddPair}
              disabled={!newPair.chip1 || !newPair.chip2}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Adicionar Dupla
            </Button>
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Maturador</CardTitle>
            <CardDescription>
              Parâmetros gerais para as conversas automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Intervalo entre mensagens (segundos)</Label>
              <Select 
                value={config.conversationInterval.toString()} 
                onValueChange={(value) => saveConfig({ ...config, conversationInterval: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 segundos</SelectItem>
                  <SelectItem value="30">30 segundos</SelectItem>
                  <SelectItem value="60">1 minuto</SelectItem>
                  <SelectItem value="120">2 minutos</SelectItem>
                  <SelectItem value="300">5 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Máximo de mensagens por sessão</Label>
              <Select 
                value={config.maxMessagesPerSession.toString()} 
                onValueChange={(value) => saveConfig({ ...config, maxMessagesPerSession: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 mensagens</SelectItem>
                  <SelectItem value="10">10 mensagens</SelectItem>
                  <SelectItem value="20">20 mensagens</SelectItem>
                  <SelectItem value="50">50 mensagens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.useBasePrompt}
                onCheckedChange={(checked) => saveConfig({ ...config, useBasePrompt: checked })}
              />
              <Label>Usar prompt base das APIs de IA</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Duplas Configuradas */}
      <Card>
        <CardHeader>
          <CardTitle>Duplas Configuradas ({config.selectedPairs.length})</CardTitle>
          <CardDescription>
            Gerencie as duplas de chips que estão conversando
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.selectedPairs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma dupla configurada</h3>
              <p className="text-sm text-muted-foreground">
                Configure a primeira dupla de chips para começar
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {config.selectedPairs.map((pair) => (
                  <Card key={pair.id} className="border-l-4 border-l-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{pair.chip1}</Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline">{pair.chip2}</Badge>
                          </div>
                          {getStatusBadge(pair.status)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <p className="font-medium">{pair.messagesExchanged} mensagens</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pair.lastActivity).toLocaleTimeString('pt-BR')}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePair(pair.id)}
                          >
                            {pair.isActive ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePair(pair.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};