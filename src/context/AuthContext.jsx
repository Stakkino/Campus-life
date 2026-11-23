import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { api, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  // Au chargement : si un token est gardé, on récupère l'utilisateur correspondant.
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(() => { setToken(null); setUser(null) }, [])
  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [logout])

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    setUser(data.user)
  }, [])
  const signup = useCallback((form) => api('/auth/signup', { method: 'POST', body: form }), [])

  const value = useMemo(() => ({ user, loading, login, logout, signup }), [user, loading, login, logout, signup])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
