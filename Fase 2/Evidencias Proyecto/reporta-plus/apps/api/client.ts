import axios from 'axios'

const apiClient = axios.create({
})
// Agregar un interceptor para incluir el token de autenticación en cada solicitud
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    //Esto asegura que el encabezado Authorization esté presente en la solicitud
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient