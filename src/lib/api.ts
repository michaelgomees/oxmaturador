import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.oxautomacoes.com.br',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
