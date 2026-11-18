
# Campus-life
Plateforme web de vie de campus : chaque étudiant voit seulement le contenu de sa filière et de sa classe. Front React (Vite), API Node/Express, base PostgreSQL sur Neon. L’interface (design et code du front) a été réalisée avec l’assistance de l’IA; l’architecture, les choix techniques et la validation sont de moi.

# Campus Life

Application web qui centralise la vie étudiante : tâches, emploi du temps, annonces et ressources pédagogiques.
Projet réalisé pour le Vibe Coding Challenge.

**Stack :** React 18, Vite 5, JavaScript, CSS classique, React Router DOM 6, Lucide React, LocalStorage.

## État du projet

Cette version est la **fondation technique** :

- [x] Configuration du projet (Vite, React, dépendances)
- [x] Layout général, navigation (Sidebar desktop, barre basse mobile) et routes
- [x] Composants communs (Button, Card, Badge, Modal, ConfirmDialog, SearchBar, FilterTabs, EmptyState, Toast)
- [x] Styles globaux et variables de couleurs
- [x] Données de démonstration et sauvegarde dans le LocalStorage
- [ ] Dashboard complet (les statistiques de tâches fonctionnent ; cours et annonces à venir)
- [ ] Module Tâches
- [ ] Module Emploi du temps
- [ ] Module Annonces
- [ ] Module Ressources

## Prérequis

- [Node.js](https://nodejs.org) version 18 ou plus récente (`node -v` pour vérifier)
- Un éditeur de code, par exemple Visual Studio Code

## Installation et lancement

```bash
npm install     # installe les dépendances (une seule fois)
npm run dev     # lance le serveur de développement
```

Ouvrez ensuite l'adresse affichée dans le terminal (en général http://localhost:5173).

## Autres commandes

| Commande          | Rôle                                              |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Serveur de développement avec rechargement auto   |
| `npm run build`   | Construit la version de production dans `dist/`   |
| `npm run preview` | Prévisualise la version construite                |

## Structure

```
src/
├── components/   composants React (layout, ui, dashboard + un dossier par module)
├── pages/        une page par route
├── context/      état global (données) et notifications
├── hooks/        hooks personnalisés (useLocalStorage)
├── data/         données de démonstration
├── utils/        constantes et fonctions de dates
└── styles/       fichiers CSS
```

## Personnalisation rapide

- **Couleurs et formes** : `src/styles/variables.css`
- **Prénom affiché au Dashboard** : `STUDENT_NAME` dans `src/utils/constants.js`
- **Pages du menu** : `NAV_ITEMS` dans `src/utils/constants.js` + une `<Route>` dans `src/App.jsx`
- **Repartir des données de démo** : bouton en bas du Dashboard, ou vider le LocalStorage du navigateur

