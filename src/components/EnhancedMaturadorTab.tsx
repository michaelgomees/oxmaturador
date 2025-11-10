"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Smartphone, Link as LinkIcon, RefreshCw } from "lucide-react";
import api from "@/lib/api";

// Tipos
interface Connection {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  platform: string;
}

interface Pair {
  id: string;
  chip1: string;
  chip2: string;
  status: string;
  createdAt: string;
}

// Hook customizado para conexões ativas
const useActiveConnections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    try {
      const response = await api.get("/connections/active");
      const data = response.data;
      
      // Garante que sempre seja um array
      if (Array.isArray(data)) {
        setConnections(data);
      } else {
        console.warn("API retornou dados em formato inválido, usando array vazio");
        setConnections([]);
      }
    } catch (error) {
      console.error("Erro ao buscar conexões ativas:", error);
      // Em caso de erro, retorna array vazio
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 10000);
    return () => clearInterval(interval);
  }, []);

  return { connections, loading, refresh: fetchConnections };
};

const EnhancedMaturadorTab: React.FC = () => {
  const { connections, loading, refresh } = useActiveConnections();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [newPair, setNewPair] = useState<{
    chip1: string | null;
    chip2: string | null;
  }>({
    chip1: null,
    chip2: null,
  });

  const addPair = () => {
    if (!newPair.chip1 || !newPair.chip2 || newPair.chip1 === newPair.chip2)
      return;

    const newPairObj: Pair = {
      id: Date.now().toString(),
      chip1: newPair.chip1,
      chip2: newPair.chip2,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    setPairs((prev) => [...prev, newPairObj]);
    setNewPair({ chip1: null, chip2: null });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-blue-500" />
          Maturador de Chips
        </h1>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Conexões
        </Button>
      </motion.div>

      {/* Seleção de chips */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Par</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={newPair.chip1 ?? undefined}
            onValueChange={(value) => setNewPair((prev) => ({ ...prev, chip1: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Chip 1" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="__loading" disabled>
                  Carregando conexões...
                </SelectItem>
              ) : connections.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  Nenhuma conexão ativa
                </SelectItem>
              ) : (
                connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select
            value={newPair.chip2 ?? undefined}
            onValueChange={(value) => setNewPair((prev) => ({ ...prev, chip2: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Chip 2" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="__loading" disabled>
                  Carregando conexões...
                </SelectItem>
              ) : connections.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  Nenhuma conexão ativa
                </SelectItem>
              ) : (
                connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button onClick={addPair} disabled={!newPair.chip1 || !newPair.chip2}>
            <LinkIcon className="w-4 h-4 mr-2" /> Criar Par
          </Button>
        </CardContent>
      </Card>

      {/* Lista de pares */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pairs.map((pair) => (
          <motion.div
            key={pair.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-green-500" />
                  Par de Conexões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Chip 1:</strong>{" "}
                  {connections.find((c) => c.id === pair.chip1)?.name ||
                    "Desconhecido"}
                </p>
                <p>
                  <strong>Chip 2:</strong>{" "}
                  {connections.find((c) => c.id === pair.chip2)?.name ||
                    "Desconhecido"}
                </p>
                <p>
                  <strong>Status:</strong> {pair.status}
                </p>
                <p>
                  <strong>Criado em:</strong>{" "}
                  {new Date(pair.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedMaturadorTab;
