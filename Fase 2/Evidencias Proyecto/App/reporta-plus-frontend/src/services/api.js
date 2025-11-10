import axios from 'axios';

const api = axios.create({
  baseURL: 'https://d3c76139f249.ngrok-free.app'
});

export default api;