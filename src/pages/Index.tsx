import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bot, MessageCircle, Zap, Settings, BarChart3, QrCode, Link, Brain, GitBranch, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { ChipCard } from "@/components/ChipCard";
import { StatsCard } from "@/components/StatsCard";
import { CreateChipModal } from "@/components/CreateChipModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { useToast } from "@/hooks/use-toast";
import { APIsTab } from "@/components/APIsTab";
import { PromptsTab } from "@/components/PromptsTab";
import { DadosTab } from "@/components/DadosTab";
import { EnhancedMaturadorTab } from "@/components/EnhancedMaturadorTab";

// Mock data para demonstração
const mockChips = [
  {
    id: "1",
    name: "Alex Marketing",
    status: "active" as const,
    aiModel: "ChatGPT",
    conversations: 47,
    lastActive: "2 min atrás"
  },
  {
    id: "2", 
    name: "Sofia Suporte",
    status: "active" as const,
    aiModel: "Claude",
    conversations: 23,
    lastActive: "5 min atrás"
  },
  {
    id: "3",
    name: "João Vendas",
    status: "idle" as const,
    aiModel: "Gemini",
    conversations: 12,
    lastActive: "1h atrás"
  }
];

const Index = () => {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [createChipModalOpen, setCreateChipModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [selectedChipForQR, setSelectedChipForQR] = useState<{name: string, phone: string} | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateQRCode = (chipName: string, chipPhone: string) => {
    setSelectedChipForQR({ name: chipName, phone: chipPhone });
    setQrCodeModalOpen(true);
  };

  const handleChipCreated = () => {
    // Recarregar lista de chips ou atualizar estado
    toast({
      title: "Lista atualizada",
      description: "A lista de chips foi atualizada com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              APIs
            </TabsTrigger>
            <TabsTrigger value="ai-config" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Prompts de IA
            </TabsTrigger>
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="maturador" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Maturador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 mt-8">
            {/* Hero Section */}
            <section className="text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  OX MATURADOR
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Plataforma inteligente de automação conversacional com IA. 
                  Crie, gerencie e monitore chips conversacionais autônomos.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => setCreateChipModalOpen(true)} className="hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Novo Chip
                </Button>
                <Button size="lg" variant="outline" className="hover:bg-secondary/10 hover:border-secondary transition-all duration-300" onClick={() => setAnalyticsModalOpen(true)}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Ver Analytics
                </Button>
              </div>
            </section>

            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard 
                title="Chips Ativos"
                value="2"
                description="+1 esta semana"
                icon={<Bot className="w-5 h-5 text-primary" />}
              />
              <StatsCard 
                title="Conversas Hoje"
                value="89"
                description="+12% vs ontem"
                icon={<MessageCircle className="w-5 h-5 text-secondary" />}
              />
              <StatsCard 
                title="Taxa de Resposta"
                value="94%"
                description="Média 7 dias"
                icon={<Zap className="w-5 h-5 text-accent" />}
              />
              <StatsCard 
                title="Eficiência IA"
                value="98.2%"
                description="Uptime mensal"
                icon={<Settings className="w-5 h-5 text-primary" />}
              />
            </section>

            {/* Chips Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Meus Chips</h2>
                <div className="flex gap-2">
                  <Badge variant="secondary">3 Total</Badge>
                  <Badge variant="outline" className="text-secondary">2 Ativos</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockChips.map((chip) => (
                 <ChipCard
                    key={chip.id}
                    chip={chip}
                    isSelected={selectedChip === chip.id}
                    onSelect={() => setSelectedChip(chip.id)}
                    onGenerateQR={() => handleGenerateQRCode(chip.name, "+5511999999999")}
                    onChipUpdated={handleChipCreated}
                  />
                ))}
                
                {/* Add New Chip Card */}
                <Card 
                  className="border-dashed border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:scale-105"
                  onClick={() => setCreateChipModalOpen(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-semibold">Criar Novo Chip</h3>
                    <p className="text-sm text-center">Configure uma nova instância conversacional</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                  onClick={() => setActiveTab("ai-config")}
                >
                  <Bot className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Configurar IA</div>
                    <div className="text-sm text-muted-foreground">Gerenciar modelos e APIs</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                  onClick={() => setActiveTab("apis")}
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Configurar APIs</div>
                    <div className="text-sm text-muted-foreground">Evolution e modelos de IA</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                  onClick={() => setActiveTab("dados")}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Central de Dados</div>
                    <div className="text-sm text-muted-foreground">Recursos multimídia</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start hover:bg-secondary/10 hover:border-secondary transition-all duration-300"
                  onClick={() => setActiveTab("maturador")}
                >
                  <Users className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Iniciar Maturador</div>
                    <div className="text-sm text-muted-foreground">Conversas automáticas</div>
                  </div>
                </Button>
              </div>
            </section>

            {/* Connection Notice */}
            <section className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">
                Conecte ao Supabase para Funcionalidade Completa
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para implementar autenticação, banco de dados, integração com Evolution API e modelos de IA, 
                conecte seu projeto ao Supabase usando nossa integração nativa.
              </p>
            </section>
          </TabsContent>

          <TabsContent value="apis" className="mt-8">
            <APIsTab />
          </TabsContent>

          <TabsContent value="ai-config" className="mt-8">
            <PromptsTab />
          </TabsContent>

          <TabsContent value="dados" className="mt-8">
            <DadosTab />
          </TabsContent>

          <TabsContent value="maturador" className="mt-8">
            <EnhancedMaturadorTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <CreateChipModal 
        open={createChipModalOpen}
        onOpenChange={setCreateChipModalOpen}
        onChipCreated={handleChipCreated}
      />
      
      {selectedChipForQR && (
        <QRCodeModal 
          open={qrCodeModalOpen}
          onOpenChange={setQrCodeModalOpen}
          chipName={selectedChipForQR.name}
          chipPhone={selectedChipForQR.phone}
        />
      )}

      <AnalyticsModal 
        open={analyticsModalOpen}
        onOpenChange={setAnalyticsModalOpen}
      />
    </div>
  );
};

export default Index;