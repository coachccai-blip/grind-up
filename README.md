# Grind up

Plateforme de quêtes gamifiée pour élèves : un accompagnant donne des quêtes, les élèves les
réalisent, gagnent de l'XP, montent de niveau et se comparent sur un leaderboard.

**État : étape 1 sur 6, le test de déploiement.** Cette version ne contient qu'une page et une
fonction serveur. Elle sert à vérifier que Netlify publie bien le site, sa fonction et sa base
à partir d'un zip. Les fonctionnalités arrivent aux étapes suivantes.

## Mise en ligne sur Netlify

1. **Récupérer le zip.** Onglet _Releases_ du dépôt GitHub, fichier `quetes-v<version>.zip`.
2. **Se connecter à Netlify** sur <https://app.netlify.com>. Sans connexion, Netlify publie les
   fichiers tels quels, sans construire le projet.
3. **Première mise en ligne.** Glisser le zip sur <https://app.netlify.com/drop>. Netlify
   construit le projet et le publie à une adresse en `netlify.app`.
4. **Rendre le site public.** Sur les comptes Netlify créés depuis le 28 juillet 2026, un
   nouveau projet n'est visible que par son propriétaire. Pour l'ouvrir aux élèves : bouton
   _Make public_ du projet, ou _Project configuration > General > Visitor access > Project
   visibility_.
5. **Mises à jour.** Dans le tableau de bord du projet, sous _Production deploys_, glisser le
   nouveau zip. L'adresse ne change pas.

Aucune variable n'est à définir : le site fonctionne dès le dépôt du zip.

### Vérifier le déploiement

Ouvrir l'adresse du site. La page lance le test et doit afficher **Test réussi**, avec sept
vérifications au résultat « Réussi » :

| Vérification                                 | Ce qu'elle prouve                                    |
| -------------------------------------------- | ---------------------------------------------------- |
| Affichage de la page                         | Le site statique est publié                          |
| Appel de la fonction serveur                 | La fonction est publiée et répond sous `/api/`       |
| Fonction serveur                             | Version de Node et contexte de déploiement           |
| Écriture dans la base                        | La fonction écrit ; le numéro augmente à chaque test |
| Relecture depuis le stockage                 | Ce qui est écrit est conservé et relu                |
| Protection contre les écritures concurrentes | Deux écritures simultanées ne peuvent pas s'écraser  |
| Copie quotidienne de la base                 | La sauvegarde du jour existe                         |

L'adresse `/api/sante` renvoie le même résultat sous forme de données : `"ok": true` quand tout
fonctionne. En cas d'échec, le bouton _Copier le détail_ de la page copie le diagnostic complet.

## Où sont les données

La base est un fichier SQLite rangé dans Netlify Blobs, l'espace de stockage de fichiers de
Netlify, inclus dans l'offre gratuite. La fonction serveur charge le fichier, applique le
changement dans une transaction, puis réenregistre le fichier à condition que personne ne l'ait
modifié entre-temps ; sinon elle recommence sur la nouvelle version.

- **Emplacement :** magasin `grind-up`, fichier `db/main.sqlite`, visible dans Netlify sous
  _Data & Storage > Blobs_. Il est stocké aux États-Unis, région par défaut de Netlify.
- **Sauvegardes :** à la première écriture de chaque jour, une copie est rangée dans
  `backups/main/AAAA-MM-JJ.sqlite`. Les sept plus récentes sont conservées. Une copie se
  télécharge depuis la même page de Netlify.
- **Échelle :** ce stockage est prévu pour quelques dizaines d'élèves.
- **Structure :** elle évolue par migrations numérotées, dans `server/db/migrations/`. La
  fonction applique les nouvelles migrations à son premier appel après une mise en ligne. Une
  migration déjà appliquée ne se modifie jamais : une correction est une nouvelle migration.

## Budget Netlify

L'offre gratuite donne 300 crédits par mois. Chaque mise en ligne en production en consomme 15 :
une mise en ligne par étape terminée, pas à chaque modification. Le reste (appels de la
fonction, requêtes, bande passante) est estimé à quelques centièmes de crédit par visite ; la
consommation réelle se suit dans le tableau de bord Netlify. Quand les crédits sont épuisés,
tous les projets du compte sont mis en pause jusqu'au cycle suivant.

## Développement

Il faut Node 22.13 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

Le site s'ouvre sur <http://localhost:5173>, avec la fonction serveur sous `/api/` et une base
locale, rangée dans `.netlify/`. `netlify dev` fait la même chose sur le port 8888 pour qui a
installé la CLI de Netlify.

| Commande           | Rôle                                                         |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Lance le site, la fonction et la base en local               |
| `npm test`         | Tests des règles et de l'API                                 |
| `npm run test:e2e` | Parcours dans un navigateur, sur téléphone et sur ordinateur |
| `npm run check`    | Mise en forme, analyse, types, tests et construction         |
| `npm run build`    | Compile l'interface dans `dist/`                             |
| `npm run zip`      | Fabrique `quetes-v<version>.zip`                             |

Avant le premier `npm run test:e2e`, installer le navigateur de test :

```bash
npx playwright install chromium
```

## Fabriquer le zip

```bash
npm run zip
```

Le zip `quetes-v<version>.zip` apparaît à la racine du projet. Il contient le projet tel que
Netlify doit le construire, sans `node_modules`, sans `.git` et sans fichier `.env`. Le script
refuse de produire un zip de plus de 50 Mo ou contenant un fichier de plus de 10 Mo.

## Publier une version

1. Augmenter la version dans `package.json` et dans `shared/version.ts` (un test vérifie
   qu'elles sont identiques).
2. Fusionner la demande de fusion sur `main`.

L'action GitHub _Version_ crée alors la version `v<version>` dans l'onglet _Releases_ et y
attache le zip. L'action _Tests_ vérifie chaque demande de fusion.

Aucun secret ne doit entrer dans le dépôt ni dans le zip : ni mot de passe, ni clé, ni
fichier `.env`.

## Organisation du code

```
netlify.toml               construction, dossier publié, dossier des fonctions
index.html, src/           interface (React)
shared/                    code commun à l'interface et au serveur
server/                    logique serveur
  app.ts                   routes de l'API
  health.ts                test de déploiement (/api/sante)
  db/                      base SQLite dans Netlify Blobs, migrations
netlify/functions/api.mts  point d'entrée unique de /api/*
scripts/zip.mjs            fabrication du zip
tests/                     unit/, api/, e2e/
.github/workflows/         tests et publication des versions
```

Le code est en anglais ; les commentaires, les messages et cette documentation sont en français.
