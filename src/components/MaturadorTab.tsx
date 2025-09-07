import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Square, Users, MessageCircle, ArrowRight, Settings, Activity, Wifi 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChipPair {
  id: string;
  chip1: string;
  chip2: string;
  isActive: boolean;
  messagesExchanged: number;
  lastActivity: string;
  status: "running" | "paused" | "stopped";
}

interface MaturadorConfig {
  isRunning: boolean;
  selectedPairs: ChipPair[];
  maxMessagesPerSession: number;
  useBasePrompt: boolean;
}

interface ActiveConnection {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  lastSeen: string;
  platform: string;
}

// Hook com mock (sem API)
const useActiveConnections = () => {
  const [connections, setConnections] = useState<ActiveConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockConnections: ActiveConnection[] = [
        {
          id: "1",
          name: "Chip 1",
          status: "connected",
          lastSeen: new Date().toISOString(),
          platform: "WhatsApp",
        },
        {
          id: "2",
          name: "Chip 2",
          status: "connected",
          lastSeen: new Date().toISOString(),
          platform: "Telegram",
        },
      ];
      setConnections(mockConnections);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { connections, loading };
};

export const MaturadorTab = () => {
  const { connections, loading } = useActiveConnections();
  const [config, setConfig] = useState<MaturadorConfig>({
    isRunning: false,
    selectedPairs: [],
    maxMessagesPerSession: 10,
    useBasePrompt: true,
  });

  const [newPair, setNewPair] = useState<{ chip1: string | null; chip2: string | null }>({
    chip1: null,
    chip2: null,
  });

  const { toast } = useToast();

  // Carregar config do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ox-maturador-config");
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  // Salvar config
  const saveConfig = (newConfig: MaturadorConfig) => {
    setConfig(newConfig);
    localStorage.setItem("ox-maturador-config", JSON.stringify(newConfig));
  };

  // Adicionar nova dupla
  const handleAddPair = () => {
    if (!newPair.chip1 || !newPair.chip2 || newPair.chip1 === newPair.chip2) {
      toast({
        title: "Erro",
        description: "Selecione dois chips diferentes para criar a conversa.",
        variant: "destructive",
      });
      return;
    }

    const exists = config.selectedPairs.some(
      (p) =>
        (p.chip1 === newPair.chip1 && p.chip2 === newPair.chip2) ||
        (p.chip1 === newPair.chip2 && p.chip2 === newPair.chip1)
    );
    if (exists) {
      toast({
        title: "Erro",
        description: "Essa dupla já foi configurada.",
        variant: "destructive",
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
      status: "stopped",
    };

    saveConfig({
      ...config,
      selectedPairs: [...config.selectedPairs, pair],
    });

    setNewPair({ chip1: null, chip2: null });

    toast({
      title: "Par adicionado",
      description: `Conversa entre ${pair.chip1} e ${pair.chip2} configurada.`,
    });
  };

  const handleRemovePair = (id: string) => {
    saveConfig({
      ...config,
      selectedPairs: config.selectedPairs.filter((p) => p.id !== id),
    });
  };

  const handleTogglePair = (id: string) => {
    const updated = config.selectedPairs.map((p) =>
      p.id === id
        ? {
            ...p,
            isActive: !p.isActive,
            status: !p.isActive ? "running" : "paused",
            lastActivity: new Date().toISOString(),
          }
        : p
    );
    saveConfig({ ...config, selectedPairs: updated });
  };

  const handleStartMaturador = () => {
    if (config.selectedPairs.length === 0) {
      toast({
        title: "Erro",
        description: "Configure ao menos uma dupla antes de iniciar.",
        variant: "destructive",
      });
      return;
    }
    const active = config.selectedPairs.filter((p) => p.isActive);
    if (active.length === 0) {
      toast({
        title: "Erro",
        description: "Ative pelo menos uma dupla antes de iniciar.",
        variant: "destructive",
      });
      return;
    }

    const updated = {
      ...config,
      isRunning: !config.isRunning,
      selectedPairs: config.selectedPairs.map((p) => ({
        ...p,
        status: config.isRunning
          ? "stopped"
          : p.isActive
          ? "running"
          : "paused",
        lastActivity: new Date().toISOString(),
      })),
    };

    saveConfig(updated);

    toast({
      title: config.isRunning ? "Maturador pausado" : "Maturador iniciado",
      description: config.isRunning
        ? "Todas as conversas foram pausadas."
        : `Iniciando ${active.length} dupla(s).`,
    });
  };

  const getStatusBadge = (status: ChipPair["status"]) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Em execução
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pausado
          </Badge>
        );
      default:
        return <Badge variant="secondary">Parado</Badge>;
    }
  };

  const getAvailableChipsForSecond = (chip1: string | null) =>
    connections.filter((c) => c.status === "connected" && c.name !== chip1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Iniciar Maturador</h2>
          <p className="text-muted-foreground">
            Configure conversas automáticas entre conexões ativas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Switch checked={config.isRunning} onCheckedChange={handleStartMaturador} />
          <Label>{config.isRunning ? "Maturador Ativo" : "Maturador Inativo"}</Label>
          <Button 
            onClick={handleStartMaturador} 
            variant={config.isRunning ? "destructive" : "default"}
          >
            {config.isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" /> Parar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Iniciar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm">Duplas</p>
              <p className="text-2xl font-bold">{config.selectedPairs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Activity className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm">Ativas</p>
              <p className="text-2xl font-bold">
                {config.selectedPairs.filter((p) => p.status === "running").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <MessageCircle className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm">Mensagens</p>
              <p className="text-2xl font-bold">
                {config.selectedPairs.reduce((a, p) => a + p.messagesExchanged, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Settings className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm">Sistema</p>
              <p className="text-2xl font-bold">{config.isRunning ? "ON" : "OFF"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config nova dupla */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Dupla</CardTitle>
            <CardDescription>Selecione duas conexões</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primeiro Chip</Label>
              <Select
                value={newPair.chip1 ?? undefined}
                onValueChange={(v) => setNewPair((p) => ({ ...p, chip1: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    connections.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3 h-3 text-green-500" /> {c.name}
                          <Badge variant="outline" className="text-xs">
                            {c.platform}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Segundo Chip</Label>
              <Select
                value={newPair.chip2 ?? undefined}
                onValueChange={(v) => setNewPair((p) => ({ ...p, chip2: v }))}
                disabled={!newPair.chip1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    getAvailableChipsForSecond(newPair.chip1).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3 h-3 text-green-500" /> {c.name}
                          <Badge variant="outline" className="text-xs">
                            {c.platform}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddPair}
              disabled={!newPair.chip1 || !newPair.chip2}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </CardContent>
        </Card>

        {/* Config avançada */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Parâmetros gerais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Máximo de mensagens</Label>
              <Select
                value={config.maxMessagesPerSession.toString()}
                onValueChange={(v) =>
                  saveConfig({ ...config, maxMessagesPerSession: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={config.useBasePrompt}
                onCheckedChange={(c) =>
                  saveConfig({ ...config, useBasePrompt: c })
                }
              />
              <Label>Usar prompt base</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de duplas */}
      <Card>
        <CardHeader>
          <CardTitle>Duplas Configuradas ({config.selectedPairs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {config.selectedPairs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p>Nenhuma dupla configurada</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {config.selectedPairs.map((p) => (
                  <Card key={p.id} className="border-l-4 border-l-primary/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{p.chip1}</Badge>
                        <ArrowRight className="w-4 h-4" />
                        <Badge variant="outline">{p.chip2}</Badge>
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePair(p.id)}
                        >
                          {p.isActive ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" /> Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" /> Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePair(p.id)}
                        >
                          Remover
                        </Button>
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
