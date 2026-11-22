// Seul point d'entrée vers le serveur : ajoute le token et transforme les erreurs en messages lisibles.
const TOKEN_KEY = 'campuslife_token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (token) => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignoré */ }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Serveur injoignable. Vérifiez que le serveur est lancé.')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'))
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`)
  return data
}

// Envoie un fichier tel quel (PDF, Word…) ; le nom part dans l'adresse.
export async function uploadFile(path, file) {
  const token = getToken()
  let res
  try {
    res = await fetch(`/api${path}?name=${encodeURIComponent(file.name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: file,
    })
  } catch {
    throw new Error('Serveur injoignable. Vérifiez que le serveur est lancé.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`)
  return data
}

// Télécharge un fichier protégé (il faut le token) puis l'ouvre dans un nouvel onglet.
export async function openFile(path) {
  const token = getToken()
  const res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Erreur ${res.status}`)
  const url = URL.createObjectURL(await res.blob())
  const tab = window.open(url, '_blank')
  if (!tab) { // fenêtre bloquée (téléphone) : on déclenche un téléchargement
    const a = document.createElement('a'); a.href = url; a.download = ''; a.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
