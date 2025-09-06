import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TestTube, History, QrCode, Settings, MessageSquare, MoreVertical, Power, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { ChipConfigModal } from "./ChipConfigModal";
import { ConversationsModal } from "./ConversationsModal";
import { ConnectionTestModal } from "./ConnectionTestModal";
import { ChipHistoryModal } from "./ChipHistoryModal";
import { useToast } from "@/hooks/use-toast";
import { useChipMonitoring } from "@/hooks/useChipMonitoring";
import { useConnections, Connection } from "@/hooks/useConnections";
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

interface ConnectionCardProps {
  connectionData: Connection;
  onGenerateQR: (connectionId: string) => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'ativo':
      return 'default';
    case 'inativo':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'inativo':
      return 'Inativo';
    default:
      return 'Desconhecido';
  }
};

const getAIModelDisplay = (config: any) => {
  if (typeof config === 'string') {
    try {
      const parsed = JSON.parse(config);
      return parsed.aiModel || 'ChatGPT';
    } catch {
      return 'ChatGPT';
    }
  }
  return config?.aiModel || 'ChatGPT';
};

export const ConnectionCard = ({ connectionData, onGenerateQR }: ConnectionCardProps) => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [conversationsModalOpen, setConversationsModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { initializeChip, getChipMonitoring, simulateChipActivity } = useChipMonitoring();
  const { deleteConnection, updateConnectionData } = useConnections();
  
  const chipMonitoring = getChipMonitoring(connectionData.id);
  const isActive = connectionData.status === 'ativo';

  // Inicializar monitoramento da conexão
  useEffect(() => {
    initializeChip(connectionData.id);
  }, [connectionData.id, initializeChip]);

  // Simular atividade periodicamente para demonstração
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% de chance de atividade
          simulateChipActivity(connectionData.id);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isActive, connectionData.id, simulateChipActivity]);

  const handleToggleStatus = () => {
    // Simular toggle do status da conexão
    toast({
      title: `Conexão ${isActive ? "pausada" : "ativada"}`,
      description: `${connectionData.nome} foi ${isActive ? "pausada" : "ativada"} com sucesso.`
    });
  };

  const getConnectionPhone = () => {
    if (typeof connectionData.config === 'string') {
      try {
        const config = JSON.parse(connectionData.config);
        return config.phoneNumber || '(--) 00000-0000';
      } catch {
        return '(--) 00000-0000';
      }
    }
    return connectionData.config?.phoneNumber || '(--) 00000-0000';
  };

  const getConnectionAvatar = () => {
    if (typeof connectionData.config === 'string') {
      try {
        const config = JSON.parse(connectionData.config);
        return config.profilePicture;
      } catch {
        return null;
      }
    }
    return connectionData.config?.profilePicture;
  };

  const getConnectionStatus = () => {
    if (typeof connectionData.config === 'string') {
      try {
        const config = JSON.parse(connectionData.config);
        return config.connectionState;
      } catch {
        return 'disconnected';
      }
    }
    return connectionData.config?.connectionState || 'disconnected';
  };

  const handleUpdateConnectionData = async () => {
    await updateConnectionData(connectionData.id);
  };

  const handleDeleteConnection = async () => {
    const success = await deleteConnection(connectionData.id);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getConnectionAvatar() || "/placeholder.svg"} alt={connectionData.nome} />
              <AvatarFallback>{connectionData.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{connectionData.nome}</h3>
              <p className="text-sm text-muted-foreground">{getConnectionPhone()}</p>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {getAIModelDisplay(connectionData.config)}
                </Badge>
                {getConnectionStatus() === 'open' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setTestModalOpen(true)}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryModalOpen(true)}>
                    <History className="mr-2 h-4 w-4" />
                    Histórico
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateQR(connectionData.id)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar Novo QR Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUpdateConnectionData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar Dados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfigModalOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConversationsModalOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Conversas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleStatus}>
                    <Power className="mr-2 h-4 w-4" />
                    {isActive ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteModalOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Chip Monitoring */}
          {chipMonitoring && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Maturação</span>
                <span className="text-xs font-medium">{Math.round(chipMonitoring.maturationPercentage)}%</span>
              </div>
              <Progress value={chipMonitoring.maturationPercentage} className="h-2" />
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {chipMonitoring.maturationStatus}
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    chipMonitoring.connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                    chipMonitoring.connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {chipMonitoring.connectionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <p className="text-base font-semibold text-primary">
                {chipMonitoring?.totalMessages || 0}
              </p>
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
              <p className="text-base font-semibold text-accent">
                {chipMonitoring?.errorCount || 0}
              </p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ChipConfigModal 
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        chipId={connectionData.id}
        chipName={connectionData.nome}
      />
      
      <ConversationsModal 
        open={conversationsModalOpen}
        onOpenChange={setConversationsModalOpen}
        chipId={connectionData.id}
        chipName={connectionData.nome}
      />

      <ConnectionTestModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        chipId={connectionData.id}
        chipName={connectionData.nome}
      />

      <ChipHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        chipId={connectionData.id}
        chipName={connectionData.nome}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conexão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conexão "{connectionData.nome}"? Esta ação não pode ser desfeita.
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
    </>
  );
};