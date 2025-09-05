import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConnections } from "@/hooks/useConnections";
import { Loader2, Network, AlertTriangle, CheckCircle } from "lucide-react";

interface CreateConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionCreated: () => void;
}

export const CreateConnectionModal = ({ open, onOpenChange, onConnectionCreated }: CreateConnectionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });
  const { createConnection } = useConnections();

  // Verificar status da Evolution API quando o modal abrir
  useEffect(() => {
    if (open) {
      const evolutionConfigStr = localStorage.getItem('ox-evolution-api');
      if (!evolutionConfigStr) {
        setEvolutionStatus('error');
        return;
      }
      
      try {
        const config = JSON.parse(evolutionConfigStr);
        if (config.status === 'connected') {
          setEvolutionStatus('connected');
        } else {
          setEvolutionStatus('error');
        }
      } catch {
        setEvolutionStatus('error');
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (evolutionStatus !== 'connected') {
      return;
    }
    
    setIsLoading(true);

    try {
      const success = await createConnection({
        nome: formData.nome,
        descricao: formData.descricao
      });
      
      if (success) {
        setFormData({
          nome: "",
          descricao: ""
        });
        
        onConnectionCreated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Nova Conexão WhatsApp
          </DialogTitle>
          <DialogDescription>
            Configure uma nova conexão com o WhatsApp via Evolution API. O QR Code será gerado após a criação.
          </DialogDescription>
        </DialogHeader>
        
        {/* Status da Evolution API */}
        {evolutionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Evolution API não configurada ou com erro. Configure e teste a conexão em <strong>APIs → Evolution API (Global)</strong> antes de criar conexões.
            </AlertDescription>
          </Alert>
        )}
        
        {evolutionStatus === 'connected' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Evolution API conectada e pronta para criar novas conexões.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Conexão</Label>
              <Input
                id="nome"
                placeholder="Ex: WhatsApp Principal"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva brevemente o propósito desta conexão (ex: Atendimento ao cliente)"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || evolutionStatus !== 'connected'}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : evolutionStatus !== 'connected' ? (
                "Configure a Evolution API primeiro"
              ) : (
                "Criar Conexão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};