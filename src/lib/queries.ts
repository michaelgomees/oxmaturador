import api from "./api";

export async function getConexoesAtivas() {
  try {
    const response = await api.get('/connections/active');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar conexões ativas:", error);
    // Retorna um array vazio em caso de erro para evitar quebrar o app
    return [];
  }
}
