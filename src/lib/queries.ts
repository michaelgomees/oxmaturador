import { supabase } from "./supabase";

export async function getConexoesAtivas() {
  const { data, error } = await supabase
    .from("conexoes") // tabela onde estão os chips
    .select("id, nome") // pega só id e nome
    .eq("status", "ativa"); // só conexões ativas

  if (error) {
    console.error("Erro ao buscar conexões:", error.message);
    return [];
  }
  return data || [];
}
