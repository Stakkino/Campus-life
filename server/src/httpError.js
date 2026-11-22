// Erreur avec un code HTTP précis (403, 409…) : le gestionnaire d'erreurs de index.js la renvoie telle quelle.
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
