# Grind up

Plateforme de quêtes gamifiée pour élèves : un accompagnant donne des quêtes, les élèves les
réalisent, gagnent de l'XP, montent de niveau et se comparent sur un leaderboard.

**État : étape 3 sur 6, les quêtes.** L'admin crée des quêtes (brouillon, publication,
duplication, archivage), les donne à un élève, à plusieurs ou à tous, et valide les réalisations.
L'élève les réalise dans cinq formats : réponses exactes, QCM, cartes de mémorisation,
déclaratif, réponse libre. Une quête validée crédite son XP, une seule fois ; une quête non
terminée à sa deadline expire. Les niveaux, la série, les badges, le leaderboard et les bots
arrivent aux étapes suivantes. Les choix faits là où le brief ne tranchait pas sont consignés
dans [docs/decisions.md](docs/decisions.md).

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

Ouvrir l'adresse du site suivie de `/sante`. La page lance le test et doit afficher **Test
réussi**, avec sept vérifications au résultat « Réussi » :

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

## Premiers pas

1. **Créer le compte admin.** Ouvrir `/inscription`, choisir un pseudo et un mot de passe,
   déplier _J'ai un code spécial_ et saisir `SuperAdmin`. Le compte arrive dans l'espace admin.
2. **Inviter les élèves.** La vue d'ensemble de l'espace admin affiche l'adresse d'inscription à
   leur transmettre. Chaque élève y choisit un pseudo et un mot de passe, puis reçoit son
   identifiant `XXXX-XXXX`, qu'il retrouve dans son profil.
3. **Créer une quête.** Dans _Quêtes_, choisir _Nouvelle quête_ : catégorie, format, titre,
   consigne, contenu, récompense, deadline, élèves. _Enregistrer le brouillon_ la garde pour
   plus tard ; _Publier la quête_ la donne aussitôt aux élèves choisis.
4. **Valider.** Les quêtes à réponse libre, et les quêtes déclaratives réglées ainsi, attendent
   dans _Validations_ : _Valider_ crédite l'XP, _Refuser_ demande à l'élève de recommencer.
5. **Mot de passe oublié.** Dans _Élèves_, ouvrir la fiche de l'élève et choisir _Mot de passe
   temporaire_. L'élève se connecte avec, puis choisit aussitôt le sien.

### Changer le code admin

Le code `SuperAdmin` est connu de quiconque a lu ce dépôt. Pour le remplacer :

1. Dans Netlify, ouvrir _Project configuration > Environment variables_.
2. Ajouter la variable `ADMIN_SIGNUP_CODE` avec le code de votre choix.
3. Déposer à nouveau le zip : une variable n'est prise en compte qu'à la mise en ligne suivante.

Le code n'est vérifié que par le serveur et n'apparaît jamais dans le code envoyé au navigateur.
Les essais sont limités à 5 par heure et par adresse IP.

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
- **Images des consignes :** rangées dans le même magasin, sous `images/`, à côté de la base
  et non dedans. Elles ne font pas partie des copies quotidiennes.
- **Échelle :** ce stockage est prévu pour quelques dizaines d'élèves.
- **Structure :** elle évolue par migrations numérotées, dans `server/db/migrations/`. La
  fonction applique les nouvelles migrations à son premier appel après une mise en ligne. Une
  migration déjà appliquée ne se modifie jamais : une correction est une nouvelle migration.
- **Données personnelles :** sur un élève, seuls sont conservés son pseudo, l'empreinte de son
  mot de passe et son activité sur la plateforme. Les adresses IP ne sont jamais enregistrées :
  seule leur empreinte sert, le temps de compter les tentatives de connexion.

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
locale, rangée dans `.netlify/blobs-local/`. Le module `dev/local-netlify.ts` tient lieu de
Netlify : il transmet à la fonction toute adresse sous `/api/` et sert le stockage avec
l'émulateur fourni par Netlify Blobs. La CLI de Netlify (`netlify dev`, port 8888) reste
utilisable, mais ce mode n'est pas couvert par les tests.

| Commande           | Rôle                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Lance le site, la fonction et la base en local                     |
| `npm run build`    | Compile l'interface dans `dist/`                                   |
| `npm run preview`  | Sert le site compilé sur le port 4173, avec la fonction et la base |
| `npm test`         | Tests des règles et de l'API                                       |
| `npm run test:e2e` | Parcours dans un navigateur, sur téléphone et sur ordinateur       |
| `npm run check`    | Mise en forme, analyse, types, tests et construction               |
| `npm run zip`      | Fabrique `quetes-v<version>.zip`                                   |

Avant le premier `npm run test:e2e`, installer le navigateur de test :

```bash
npx playwright install chromium
```

Les parcours dans le navigateur compilent le site et lancent leur propre serveur, sur le port
5180, avec une base neuve à chaque série : ils ne touchent pas aux données de `npm run dev`.

### La fonction telle que Netlify l'empaquette

Sur Netlify, la fonction ne tourne pas à partir du code source mais d'un paquet fabriqué à la
mise en ligne. À chaque demande de fusion, l'action _Tests_ construit le zip avec l'outil de
Netlify, puis `scripts/verify-bundle.mjs` charge ce paquet seul et lui fait jouer un parcours
complet : test de déploiement, inscriptions, session, droits de l'admin. Pour le lancer à la
main, depuis un dossier où le zip a été décompressé et ses dépendances installées :

```bash
npx netlify-cli@27.20.0 build --offline
```

puis, depuis le projet :

```bash
node scripts/verify-bundle.mjs <dossier construit>
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

## Sécurité

- **Mots de passe :** 8 caractères au moins, conservés sous forme d'empreinte scrypt, jamais en
  clair.
- **Session :** cookie signé, inaccessible au JavaScript de la page, valable 30 jours après la
  dernière visite.
- **Droits :** chaque route du serveur vérifie le rôle ; tout ce qui est sous `/api/admin` exige
  un admin, tout ce qui est sous `/api/quests` exige un élève, et un test le contrôle pour
  chaque route. Un élève ne lit et ne modifie que ses propres quêtes.
- **Réponses attendues :** elles restent sur le serveur, qui corrige ; l'élève ne reçoit le
  corrigé qu'une fois sa quête validée.
- **XP :** une quête est validée et créditée dans la même transaction, une seule fois, même en
  cas de double clic ou de requête rejouée.
- **Tentatives :** connexions, inscriptions et essais du code admin sont limités par adresse IP.
- **Navigateur :** la page n'exécute que les scripts du site et ne contacte que le site
  (politique de sécurité du contenu) ; elle ne peut pas être affichée dans une autre page.
- **Tiers :** aucun service autre que Netlify ne reçoit de données ; la police d'écriture est
  servie par le site lui-même.

Aucun secret ne doit entrer dans le dépôt ni dans le zip : ni mot de passe, ni clé, ni
fichier `.env`.

## Organisation du code

```
netlify.toml               construction, dossier publié, dossier des fonctions
index.html, src/           interface (React)
  app/                     routes, protection des pages par rôle, session
  ui/                      composants partagés : bouton, carte, champ, avatar, fenêtre
  features/                un dossier par espace : auth, student, admin, quests, deploy-check
  styles/                  palette et règles de la section 8
shared/                    code commun à l'interface et au serveur
  rules/                   pseudo, identifiant, palette, avatars, quêtes, statuts, calcul de l'XP
  schemas/                 formats des échanges avec l'API
server/                    logique serveur
  app.ts                   assemblage des routes ; tout ce qui est sous /admin exige un admin
  auth/                    mots de passe, sessions, limitation des tentatives, comptes
  quests/                  quêtes : création, correction automatique, validation, crédit de l'XP
  routes/                  une par domaine : comptes, élèves, quêtes, test de déploiement
  db/                      base SQLite dans Netlify Blobs, migrations
netlify/functions/api.mts  point d'entrée unique de /api/*
dev/local-netlify.ts       Netlify en local : fonction et stockage pour `npm run dev`
scripts/                   fabrication du zip, vérification de la fonction empaquetée
tests/                     unit/, api/, e2e/
docs/decisions.md          choix faits là où le brief ne tranchait pas
.github/workflows/         tests et publication des versions
```

Le code est en anglais ; les commentaires, les messages et cette documentation sont en français.
