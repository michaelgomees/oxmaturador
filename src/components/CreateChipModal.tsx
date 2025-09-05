import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChips } from "@/hooks/useChips";
import { Loader2, Cpu } from "lucide-react";

interface CreateChipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChipCreated: () => void;
}

export const CreateChipModal = ({ open, onOpenChange, onChipCreated }: CreateChipModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    descricao: ""
  });
  const { createChip } = useChips();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await createChip({
        nome: formData.nome,
        telefone: formData.telefone,
        descricao: formData.descricao
      });
      
      if (success) {
        setFormData({
          nome: "",
          telefone: "",
          descricao: ""
        });
        
        onChipCreated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao criar chip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Cadastrar Novo Chip
          </DialogTitle>
          <DialogDescription>
            Configure uma nova instância conversacional com IA personalizada.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Chip</Label>
              <Input
                id="nome"
                placeholder="Ex: Alex Marketing"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Número de Telefone</Label>
              <Input
                id="telefone"
                placeholder="Ex: +5511999999999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva brevemente o propósito deste chip (ex: Responsável pelo atendimento de vendas)"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Chip"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};