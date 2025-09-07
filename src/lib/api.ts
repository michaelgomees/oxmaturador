import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ws.oxautomacoes.com.br', // <<-- URL CORRIGIDA
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
