import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Pause, Settings, MessageCircle, Bot, QrCode, Wifi, History, Thermometer, TrendingUp, Trash2, Network } from "lucide-react";
import { useState, useEffect } from "react";
import { ChipConfigModal } from "./ChipConfigModal";
import { ConversationsModal } from "./ConversationsModal";
import { ConnectionTestModal } from "./ConnectionTestModal";
import { ChipHistoryModal } from "./ChipHistoryModal";
import { useToast } from "@/hooks/use-toast";
import { useChipMonitoring } from "@/hooks/useChipMonitoring";
import { useConnections } from "@/hooks/useConnections";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConnectionStatus = "active" | "idle" | "offline";

interface ConnectionData {
  id: string;
  name: string;
  status: ConnectionStatus;
  aiModel: string;
  conversations: number;
  lastActive: string;
  phone?: string;
}

interface ConnectionCardProps {
  connection: ConnectionData;
  isSelected: boolean;
  onSelect: () => void;
  onGenerateQR?: () => void;
  onConnectionUpdated?: () => void;
}

const statusConfig = {
  active: {
    color: "bg-secondary",
    label: "Conectado",
    textColor: "text-secondary"
  },
  idle: {
    color: "bg-accent",
    label: "Aguardando", 
    textColor: "text-accent"
  },
  offline: {
    color: "bg-muted-foreground",
    label: "Offline",
    textColor: "text-muted-foreground"
  }
};

const maturationStatusConfig = {
  heating: {
    color: "bg-orange-500/10 text-orange-500",
    label: "Aquecendo",
    icon: Thermometer
  },
  ready: {
    color: "bg-blue-500/10 text-blue-500", 
    label: "Pronto",
    icon: Bot
  },
  active: {
    color: "bg-primary/10 text-primary",
    label: "Em Uso",
    icon: TrendingUp
  },
  cooling: {
    color: "bg-slate-500/10 text-slate-500",
    label: "Resfriando", 
    icon: Pause
  }
};

const aiModelColors = {
  ChatGPT: "bg-primary/10 text-primary",
  Claude: "bg-secondary/10 text-secondary", 
  Gemini: "bg-accent/10 text-accent"
};

export const ConnectionCard = ({ connection, isSelected, onSelect, onGenerateQR, onConnectionUpdated }: ConnectionCardProps) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [conversationsModalOpen, setConversationsModalOpen] = useState(false);
  const [connectionTestModalOpen, setConnectionTestModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { initializeChip, getChipMonitoring, simulateChipActivity } = useChipMonitoring();
  const { deleteConnection } = useConnections();
  
  const status = statusConfig[connection.status];
  const modelColor = aiModelColors[connection.aiModel as keyof typeof aiModelColors] || "bg-muted text-muted-foreground";
  const chipMonitoring = getChipMonitoring(connection.id);

  // Inicializar monitoramento da conexão
  useEffect(() => {
    initializeChip(connection.id);
  }, [connection.id, initializeChip]);

  // Simular atividade periodicamente para demonstração
  useEffect(() => {
    if (connection.status === 'active') {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% de chance de atividade a cada 5 segundos
          simulateChipActivity(connection.id);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [connection.status, connection.id, simulateChipActivity]);

  const handleToggleStatus = () => {
    // Simular toggle do status da conexão
    const newStatus = connection.status === "active" ? "idle" : "active";
    toast({
      title: `Conexão ${newStatus === "active" ? "ativada" : "pausada"}`,
      description: `${connection.name} foi ${newStatus === "active" ? "ativada" : "pausada"} com sucesso.`
    });
    onConnectionUpdated?.();
  };

  // Buscar número da conexão
  const getConnectionPhone = () => {
    return connection.phone || "+5511999999999";
  };

  const handleDeleteConnection = async () => {
    const success = await deleteConnection(connection.id);
    if (success) {
      onConnectionUpdated?.();
    }
    setDeleteDialogOpen(false);
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        isSelected ? 'ring-2 ring-primary shadow-primary/25' : 'hover:shadow-md hover:shadow-primary/10'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                <Network className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{connection.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{getConnectionPhone()}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
                <span className={`text-xs font-medium ${status.textColor}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConnectionTestModalOpen(true); }}>
                <Wifi className="mr-2 h-4 w-4" />
                Testar Conexão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistoryModalOpen(true); }}>
                <History className="mr-2 h-4 w-4" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onGenerateQR?.(); }}>
                <QrCode className="mr-2 h-4 w-4" />
                Gerar QR Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfigModalOpen(true); }}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConversationsModalOpen(true); }}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Conversas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(); }}>
                {connection.status === "active" ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {connection.status === "active" ? "Pausar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Conexão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Indicador de Maturação */}
        {chipMonitoring && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3 h-3" />
                <span className="text-xs text-muted-foreground">Status</span>
              </div>
              <span className="text-xs font-medium">{Math.round(chipMonitoring.maturationPercentage)}%</span>
            </div>
            <Progress value={chipMonitoring.maturationPercentage} className="h-2" />
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={maturationStatusConfig[chipMonitoring.maturationStatus].color}
              >
                {maturationStatusConfig[chipMonitoring.maturationStatus].label}
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  chipMonitoring.connectionStatus === 'online' ? 'bg-primary animate-pulse' : 
                  chipMonitoring.connectionStatus === 'testing' ? 'bg-accent animate-spin' :
                  'bg-muted-foreground'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {chipMonitoring.connectionStatus === 'online' ? 'Online' : 
                   chipMonitoring.connectionStatus === 'testing' ? 'Testando' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Model */}
        <div className="flex items-center gap-2">
          <Bot className="w-3 h-3" />
          <Badge variant="secondary" className={modelColor}>
            {connection.aiModel}
          </Badge>
        </div>

        {/* Stats Expandidas */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-base font-semibold text-primary">{chipMonitoring?.totalMessages || connection.conversations}</p>
            <p className="text-xs text-muted-foreground">Mensagens</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-secondary">
              {chipMonitoring?.startDate ? 
                Math.floor((new Date().getTime() - chipMonitoring.startDate.getTime()) / (1000 * 60 * 60 * 24)) 
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">Dias</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-accent">{chipMonitoring?.errorCount || 0}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>

        {/* Última Atividade */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
          <span>Última atividade:</span>
          <span>{chipMonitoring?.lastActivity ? 
            chipMonitoring.lastActivity.toLocaleString('pt-BR', { 
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            }) : connection.lastActive}
          </span>
        </div>
      </CardContent>
      
      {/* Modals */}
      <ChipConfigModal 
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        chipId={connection.id}
        chipName={connection.name}
      />
      
      <ConversationsModal 
        open={conversationsModalOpen}
        onOpenChange={setConversationsModalOpen}
        chipId={connection.id}
        chipName={connection.name}
      />

      <ConnectionTestModal
        open={connectionTestModalOpen}
        onOpenChange={setConnectionTestModalOpen}
        chipId={connection.id}
        chipName={connection.name}
      />

      <ChipHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        chipId={connection.id}
        chipName={connection.name}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conexão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conexão "{connection.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConnection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};