# FILM DU JOUR

Site statique présentant une sélection quotidienne de films (jusqu'à 5), avec fiches détaillées, recherche, filtres, favoris, statistiques et une interface d'administration — le tout sans backend, 100 % compatible **GitHub Pages**.

Aucune dépendance : HTML5 / CSS3 / JavaScript vanilla uniquement.

---

## 🚀 Déploiement sur GitHub Pages

1. Créez un nouveau dépôt GitHub (ex : `film-du-jour`).
2. Copiez-y l'intégralité des fichiers de ce projet en conservant l'arborescence :
   ```
   /
   ├── index.html
   ├── admin.html
   ├── style.css
   ├── script.js
   ├── admin.js
   ├── films.json
   ├── README.md
   └── assets/
       ├── posters/
       ├── backgrounds/
       └── icons/
   ```
3. Poussez le tout sur la branche `main` :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-UTILISATEUR/film-du-jour.git
   git push -u origin main
   ```
4. Dans le dépôt GitHub : **Settings → Pages → Source**, sélectionnez la branche `main` et le dossier `/ (root)`.
5. Votre site est accessible à `https://VOTRE-UTILISATEUR.github.io/film-du-jour/`.

Aucune étape de build n'est nécessaire : le site fonctionne directement depuis les fichiers statiques.

---

## 📁 Structure du projet

| Fichier / dossier   | Rôle |
|----------------------|------|
| `index.html`          | Page principale (accueil + statistiques) |
| `admin.html`          | Interface d'administration cachée |
| `style.css`           | Feuille de style unique, pilotée par variables CSS |
| `script.js`           | Logique du site public (recherche, tri, filtres, favoris, fiche détaillée) |
| `admin.js`            | Logique de l'interface d'administration |
| `films.json`          | Données des films + configuration (couleurs, effets, tailles) |
| `assets/posters/`     | Affiches des films |
| `assets/backgrounds/` | Bannières / fonds des films |
| `assets/icons/`       | Favicon et icônes |

---

## ✏️ Modifier les films

### Option A — via l'interface d'administration (recommandé)

1. Ouvrez `admin.html` (ex : `https://votre-site/admin.html`).
2. Modifiez les films, les couleurs, les polices, les tailles et les animations : tout s'applique **instantanément** sur le site (stocké dans le `LocalStorage` du navigateur utilisé).
3. Pour rendre les changements **permanents et visibles par tous les visiteurs**, allez dans l'onglet **Export / Import**, cliquez sur **Générer l'export JSON**, puis **Télécharger films.json**. Remplacez le fichier `films.json` de votre dépôt par celui téléchargé, puis republiez (`git add`, `git commit`, `git push`).

> ⚠️ GitHub Pages est un hébergement 100 % statique : aucune écriture serveur n'est possible. L'admin fonctionne donc en local (LocalStorage) et l'export JSON sert de pont vers le dépôt Git.

### Option B — directement dans `films.json`

Chaque film est un objet JSON. Structure minimale d'un film :

```json
{
  "id": "f1",
  "title": "Titre du film",
  "year": 2024,
  "director": "Nom du réalisateur",
  "duration": 120,
  "genres": ["Genre 1", "Genre 2"],
  "country": ["Pays"],
  "ageRating": "12+",
  "imdb": 7.5,
  "rottenTomatoes": 80,
  "metacritic": 70,
  "tagline": "Slogan du film",
  "shortSynopsis": "Résumé court.",
  "fullSynopsis": "Résumé complet.",
  "poster": "assets/posters/mon-film.jpg",
  "backdrop": "assets/backgrounds/mon-film.jpg",
  "trailerYoutubeId": "XXXXXXXXXXX"
}
```

Voir `films.json` pour la liste complète des champs disponibles (casting, scénaristes, budget, box-office, récompenses, anecdotes, citations, critiques, etc.).

Le nombre de cartes affichées à l'accueil est piloté par `config.maxCards` (5 maximum recommandé, modifiable dans l'admin).

---

## 🎨 Personnalisation visuelle

Toutes les couleurs, polices, tailles et animations sont pilotées par des **variables CSS** définies dans `style.css` (`:root`) et surchargées dynamiquement par `config.theme` dans `films.json`, ou depuis l'onglet **Couleurs & police** de l'admin.

Effets activables/désactivables (`config.effects`) :
- `fade` — apparition progressive des cartes
- `zoom` — zoom léger au survol
- `glow` — halo lumineux au survol
- `transitions` — transitions générales de l'interface
- `parallax` — parallaxe légère

---

## 🔍 Fonctionnalités

- Recherche instantanée (titre, acteur, réalisateur, année, genre, pays)
- Tri (popularité, IMDb, année, alphabétique, durée)
- Filtres (genre, pays, année, âge conseillé, note minimale)
- Favoris (stockés en LocalStorage)
- 4 modes d'affichage : grille, liste, compact, cinéma
- Fiche détaillée complète avec bande-annonce YouTube intégrée, galerie, casting, critiques, anecdotes, citations, films similaires
- Page statistiques avec graphiques (répartition par genre, année, pays)
- Interface d'administration complète, sans backend
- Responsive (mobile / tablette / desktop)
- Accessibilité : navigation clavier, attributs ARIA, `prefers-reduced-motion`, contrastes élevés
- SEO : Open Graph, Twitter Cards, JSON-LD, favicon, meta description
- Performance : lazy loading des images, CSS/JS optimisés

---

## 🖼️ Remplacer les images d'exemple

Les fichiers `assets/posters/*.svg` et `assets/backgrounds/*.svg` fournis sont des **placeholders**. Remplacez-les par vos propres affiches/bannières (formats `.jpg`, `.png`, `.webp` ou `.svg` acceptés), puis mettez à jour les chemins `poster` / `backdrop` dans `films.json` (ou via l'admin).

---

## 📄 Licence

MIT — libre d'utilisation, de modification et de distribution.

## Crédits

Conçu comme un projet front-end statique, sans dépendance, pensé pour GitHub Pages.
