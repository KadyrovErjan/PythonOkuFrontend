import axios from 'axios'

const productionApiBaseURL = 'https://api.pythonoku.edu.kg/api/'
const fallbackApiBaseURL = import.meta.env.PROD ? productionApiBaseURL : '/api/'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || ''
    const isAuthRequest = requestUrl.includes('auth/login/') || requestUrl.includes('auth/register/')

    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
