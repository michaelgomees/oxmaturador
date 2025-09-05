import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bot, MessageCircle, Zap, Settings, BarChart3, QrCode, Link, Brain, GitBranch, Users, Network } from "lucide-react";
import { Header } from "@/components/Header";
import { ConnectionCard } from "@/components/ConnectionCard";
import { StatsCard } from "@/components/StatsCard";
import { CreateConnectionModal } from "@/components/CreateConnectionModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import { AnalyticsModal } from "@/components/AnalyticsModal";
import { useToast } from "@/hooks/use-toast";
import { useConnections } from "@/hooks/useConnections";
import { APIsTab } from "@/components/APIsTab";
import { PromptsTab } from "@/components/PromptsTab";
import { DadosTab } from "@/components/DadosTab";
import { EnhancedMaturadorTab } from "@/components/EnhancedMaturadorTab";

const Index = () => {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [createConnectionModalOpen, setCreateConnectionModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [selectedConnectionForQR, setSelectedConnectionForQR] = useState<{id: string, name: string, phone: string} | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const { toast } = useToast();
  const { connections, isLoading } = useConnections();

  const handleGenerateQRCode = (id: string, connectionName: string, connectionPhone: string) => {
    setSelectedConnectionForQR({ id, name: connectionName, phone: connectionPhone });
    setQrCodeModalOpen(true);
  };

  const handleConnectionCreated = () => {
    console.log('Conexão criada, atualizando interface...');
    // As conexões são automaticamente recarregadas pelo hook useConnections
  };

  // Estatísticas calculadas a partir das conexões reais
  const activeConnections = connections.filter(connection => connection.status === 'ativo').length;
  const totalConnections = connections.length;

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
                  Crie, gerencie e monitore conexões WhatsApp autônomas.
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => setCreateConnectionModalOpen(true)} className="hover:bg-primary/90 hover:scale-105 transition-all duration-300">
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Conexão
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
                title="Conexões Ativas"
                value={activeConnections.toString()}
                description={`${totalConnections} total`}
                icon={<Network className="w-5 h-5 text-primary" />}
              />
              <StatsCard 
                title="Conversas Hoje"
                value="0"
                description="Aguardando dados"
                icon={<MessageCircle className="w-5 h-5 text-secondary" />}
              />
              <StatsCard 
                title="Taxa de Resposta"
                value="0%"
                description="Aguardando dados"
                icon={<Zap className="w-5 h-5 text-accent" />}
              />
              <StatsCard 
                title="Eficiência IA"
                value="100%"
                description="Sistema ativo"
                icon={<Settings className="w-5 h-5 text-primary" />}
              />
            </section>

            {/* Connections Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Minhas Conexões</h2>
                <div className="flex gap-2">
                  <Badge variant="secondary">{totalConnections} Total</Badge>
                  <Badge variant="outline" className="text-secondary">{activeConnections} Ativas</Badge>
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-[200px] animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Nenhuma conexão criada ainda. Crie sua primeira conexão!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connections.map((connection) => {
                    console.log('Renderizando conexão:', connection);
                    const connectionForCard = {
                      id: connection.id,
                      name: connection.nome,
                      status: connection.config?.telefone ? 'active' as const : 'idle' as const,
                      aiModel: connection.config?.aiModel || 'ChatGPT',
                      conversations: 0, // Será implementado posteriormente
                      lastActive: connection.config?.telefone ? 'Conectado' : 'Aguardando conexão',
                      phone: connection.config?.telefone
                    };
                    
                      return (
                        <ConnectionCard
                          key={connection.id}
                          connection={connectionForCard}
                          isSelected={selectedConnection === connection.id}
                          onSelect={() => setSelectedConnection(connection.id)}
                          onGenerateQR={() => handleGenerateQRCode(connection.id, connection.nome, connection.config?.telefone || 'Não conectado')}
                          onConnectionUpdated={handleConnectionCreated}
                        />
                      );
                  })}
                  
                  {/* Add New Connection Card */}
                  <Card 
                    className="border-dashed border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:scale-105"
                    onClick={() => setCreateConnectionModalOpen(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground group-hover:text-primary transition-colors">
                      <Plus className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="font-semibold">Nova Conexão</h3>
                      <p className="text-sm text-center">Configure uma nova conexão WhatsApp</p>
                    </CardContent>
                  </Card>
                </div>
              )}
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
      <CreateConnectionModal 
        open={createConnectionModalOpen}
        onOpenChange={setCreateConnectionModalOpen}
        onConnectionCreated={handleConnectionCreated}
      />
      
      {selectedConnectionForQR && (
        <QRCodeModal 
          open={qrCodeModalOpen}
          onOpenChange={setQrCodeModalOpen}
          chipId={selectedConnectionForQR.id}
          chipName={selectedConnectionForQR.name}
          chipPhone={selectedConnectionForQR.phone}
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