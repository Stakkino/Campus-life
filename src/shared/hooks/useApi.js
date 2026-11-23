import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client.js'
import { useToast } from '../../context/ToastContext.jsx'

// Charge une ressource du serveur. `data` vaut null tant que la réponse n'est pas arrivée.
// refreshMs : recharge automatiquement (utile pour la discussion).
export function useApi(path, { refreshMs } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!path) return
    try { setData(await api(path)); setError('') } catch (e) { setError(e.message) }
  }, [path])
  useEffect(() => {
    load()
    if (!refreshMs) return undefined
    const timer = setInterval(load, refreshMs)
    return () => clearInterval(timer)
  }, [load, refreshMs])
  return { data, loading: data === null && !error, error, reload: load }
}

// Pour les listes : renvoie toujours un tableau (jamais null).
export function useList(path, options) {
  const { data, ...rest } = useApi(path, options)
  return { data: data ?? [], ...rest }
}

// Exécute une action (créer, modifier, supprimer), affiche un message, puis recharge les données.
export function useAction(...reloaders) {
  const { showToast } = useToast()
  return useCallback(async (fn, successMessage) => {
    try {
      const result = await fn()
      if (successMessage) showToast(successMessage)
      await Promise.all(reloaders.map((r) => r()))
      return result ?? true
    } catch (e) {
      showToast(e.message, 'error')
      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast, ...reloaders])
}
