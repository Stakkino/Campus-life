import { ANNOUNCEMENT_CATEGORIES } from '../../shared/utils/constants.js'
import { audienceFields } from '../../shared/utils/audience.js'

// Champs du formulaire d'une publication (le public dépend de la filière / du niveau de l'utilisateur).
export const postFields = (catalog, user) => [
  { name: 'title', label: 'Titre', required: true },
  { name: 'category', label: 'Catégorie', type: 'select', options: ANNOUNCEMENT_CATEGORIES },
  ...audienceFields(catalog, user),
  { name: 'content', label: 'Contenu', type: 'textarea', required: true },
]
