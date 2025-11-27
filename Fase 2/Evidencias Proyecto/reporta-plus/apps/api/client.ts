import axios from 'axios'
import { config } from 'process'

const apiClient = axios.create({
    baseURL: '/api',
    }
)

apiClient.interceptors.response.use((config) =>{
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default apiClient

