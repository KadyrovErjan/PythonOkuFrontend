import axios from 'axios'

const productionApiBaseURL = 'https://api.pythonoku.edu.kg/api/'
const fallbackApiBaseURL = import.meta.env.PROD ? productionApiBaseURL : '/api/'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseURL,
})

// Pages share the same profile, notifications and course data. Keeping GET
// responses briefly avoids a blank/loading state every time the user changes
// a route, while mutations below immediately invalidate the cache.
const responseCache = new Map()
const cacheLifetime = 30_000

const cacheKeyFor = (config, token) => `${token || 'guest'}:${config.baseURL || ''}:${config.url || ''}:${JSON.stringify(config.params || {})}`

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`

  if (config.method?.toLowerCase() === 'get' && config.cache !== false) {
    const key = cacheKeyFor(config, token)
    const cached = responseCache.get(key)

    if (cached && cached.expiresAt > Date.now()) {
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: null,
      })
      config.__fromCache = true
    } else {
      responseCache.delete(key)
      config.__cacheKey = key
    }
  }

  return config
})

api.interceptors.response.use(
  (res) => {
    const method = res.config.method?.toLowerCase()
    if (method === 'get' && res.config.__cacheKey && !res.config.__fromCache) {
      responseCache.set(res.config.__cacheKey, {
        data: res.data,
        expiresAt: Date.now() + cacheLifetime,
      })
    } else if (method && method !== 'get') {
      responseCache.clear()
    }
    return res
  },
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

api.clearCache = () => responseCache.clear()

export default api
