# Rédiger un exercice de la bibliothèque

La bibliothèque est un ensemble d'exercices prêts à l'emploi, livrés avec l'application. L'admin en
choisit un, qui s'ouvre comme une nouvelle quête déjà remplie ; il la donne ensuite à ses élèves.

Ce guide dit comment écrire un exercice. Deux modèles à suivre :
`server/library/exercises/identites-remarquables.ts` (un QCM) et
`server/library/exercises/geometrie.ts` (des réponses à saisir).

## Le plan d'un exercice

Tout exercice suit le même plan, dans cet ordre :

1. **Un bref rappel du cours** (`lesson`) : les définitions, le vocabulaire et les formules dont
   l'exercice a besoin, et rien d'autre. De 150 à 1 600 caractères.
2. **Un exemple expliqué** (`example`) : une question du même genre que celles de l'exercice,
   résolue pas à pas. Deux exemples au plus, quand l'exercice fait travailler deux méthodes. Les
   valeurs de l'exemple ne sont jamais celles d'une question.
3. **Des questions pour pratiquer** (`questions`) : de 5 à 8, de la plus simple à la plus
   difficile, toutes différentes.
4. **La correction détaillée de chaque question** (`correction`) : l'élève la lit une fois sa
   quête validée.

## Écrire le fichier

Un fichier par thème, sous `server/library/exercises/`. Chaque exercice est construit par
`defineExercise`, et le fichier exporte la liste de ses exercices.

```ts
import { defineExercise, paragraphs, qcm } from '../authoring.js'

const exemple = defineExercise({
  id: 'fractions-additionner', // minuscules, chiffres et tirets ; ne change plus ensuite
  title: 'Fractions : additionner et soustraire', // 80 caractères au plus
  theme: 'nombres', // un identifiant de server/library/themes.ts
  difficulty: 'easy', // easy, medium ou hard
  description: 'Pour l’admin : ce que l’exercice fait travailler, en une ou deux phrases.',
  lesson: paragraphs('Un paragraphe.', ['- une ligne de liste', '- une autre'].join('\n')),
  example: { statement: '…', steps: [['calcul', 'commentaire']], conclusion: '…' },
  questions: [
    qcm({
      prompt: 'Calcule 1/2 + 1/3.',
      choices: ['2/5', '5/6', '1/6', '2/6'],
      answer: '5/6', // le bon choix, recopié tel quel
      correction: {
        steps: [
          ['1/2 + 1/3 = 3/6 + 2/6', 'On met les deux fractions au même dénominateur, 6.'],
          ['3/6 + 2/6 = 5/6', 'On ajoute les numérateurs et on garde le dénominateur.'],
        ],
        traps: [
          ['2/5', 'les numérateurs et les dénominateurs ont été ajoutés entre eux.'],
          ['1/6', 'les fractions ont été multipliées au lieu d’être ajoutées.'],
          ['2/6', 'seuls les numérateurs ont été mis au même dénominateur.'],
        ],
        check: '1/2 = 0,5 et 5/6 est proche de 0,83 : la somme dépasse bien 0,5.',
      },
    }),
  ],
})

export const nombres = [exemple]
```

Un exercice est soit un **QCM** (`qcm`), soit une série de **réponses à saisir** (`exact`), jamais
un mélange.

- `qcm` : trois ou quatre choix, un seul juste. `answer` recopie le bon choix. La bonne réponse
  change de place d'une question à l'autre.
- `exact` : l'élève saisit un nombre, ou un mot court. `answers` liste les réponses acceptées, la
  première étant celle que montre le corrigé. Les espaces, les majuscules et le choix de la virgule
  ou du point ne comptent pas. L'énoncé précise l'unité et l'arrondi attendus : « Calcule BC, en
  cm, arrondi au dixième. »

Sur un téléphone, saisir une expression comme « x² − 10x + 25 » est incertain : tout ce qui n'est
pas un nombre simple se demande en QCM.

## La correction d'une question

- `steps` : la résolution, étape par étape. Chaque étape est une ligne de calcul, puis le
  commentaire qui la justifie : pourquoi on fait ce calcul, quelle règle on applique. Deux étapes
  au moins.
- La **dernière étape énonce la réponse** telle qu'elle est écrite dans les choix (ou dans
  `answers`). Un test le vérifie.
- `traps` (QCM) : un commentaire par mauvais choix, sans exception. Un bon mauvais choix est le
  résultat d'une erreur courante ; le commentaire nomme cette erreur.
- `mistake` (réponse à saisir) : l'erreur la plus courante sur cette question. Obligatoire.
- `check` : une façon de contrôler le résultat, quand il y en a une simple.

Une correction fait de 150 à 2 000 caractères.

## Le ton

- L'élève est **tutoyé** dans les énoncés et les rappels : « Calcule », « Développe », « tu ».
- Les corrections et les exemples expliquent à la troisième personne : « On repère… »,
  « On applique… ».
- Phrases courtes, un seul mot pour une même chose, le vocabulaire du cours.
- Une situation de géométrie est toujours décrite par son énoncé, assez précisément pour être
  dessinée, même quand une illustration l'accompagne : le texte doit suffire à qui ne voit pas
  l'image. L'exemple commence alors par « On fait un schéma à main levée ».

## Écrire les calculs

| Pour écrire      | On tape                        | Jamais                |
| ---------------- | ------------------------------ | --------------------- |
| une puissance    | `x²`, `10³`, `2⁵`, `10⁻³`      | `x^2`, `x2`           |
| un produit       | `3 × 4`                        | la lettre x, `*`      |
| un quotient      | `12 ÷ 4`, ou la fraction `3/4` | `:`                   |
| un ratio         | `2:3`, `2:3:5`                 | `2 : 3`               |
| une soustraction | `7 − 2` ou `7 - 2`             |                       |
| une racine       | `√25`, `√(9 + 16)`             |                       |
| un arrondi       | `√52 ≈ 7,2`                    | `=` devant un arrondi |
| un angle         | `cos(40°)`, `arccos(0,6)`      | `cos⁻¹`               |
| un décimal       | `3,5`                          | `3.5`                 |

La typographie est appliquée automatiquement : espace insécable devant « : », « ; », « ! » et
« ? », entre un nombre et son unité, espace fine entre les milliers, apostrophe courbe, signe
moins. Il suffit d'écrire avec des espaces ordinaires.

## Illustrer un exercice

Une illustration est un petit dessin SVG, servi par le site lui-même. Elle s'affiche dans le
rappel du cours, dans un exemple expliqué, ou sous l'énoncé d'une question.

### Quand illustrer

- **Quand le dessin fait comprendre quelque chose** que le texte dit mal : d'où vient le double
  produit (un carré découpé), ce que veut dire « coefficient » (un tableau avec sa flèche « × k »),
  une situation de géométrie, un arbre de probabilités, un programme de calcul.
- Pas pour décorer : une figure par idée, deux ou trois au plus par rappel du cours.
- Le modèle est `server/library/exercises/identites-remarquables.ts` et ses figures, dans
  `server/library/figures/calcul-litteral.ts`.

### La règle d'or : jamais la réponse

Les réponses attendues ne sont envoyées à l'élève qu'une fois la quête validée. Une illustration
d'énoncé, elle, est vue dès le début : **elle ne montre jamais une réponse attendue.**

- La longueur ou la valeur cherchée s'écrit `?` (la constante `UNKNOWN`), en bleu.
- Le dessin ne trahit pas la réponse : pour « ce triangle est-il rectangle ? » ou « ces droites
  sont-elles parallèles ? », un schéma à main levée, pas à l'échelle, **sans le codage** que l'élève
  doit justifier (pas de marque d'angle droit, pas de flèches de parallélisme). Évitez aussi un
  angle trop parfaitement droit ou des droites trop parfaitement parallèles.
- Un rappel du cours peut illustrer une règle (« (2x)² = 4x² »), jamais le calcul d'une question.
- **Pas d'illustration dans une correction** : un test l'interdit.

### La syntaxe

Une ligne seule, dans un texte mis en forme :

```text
![Un carré de côté a + b, découpé en un carré a², deux rectangles ab et un carré b².](figure:carre-somme)
```

- L'identifiant : minuscules, chiffres et tirets (`carre-somme`, `pythagore-echelle`), 80
  caractères au plus. Le fichier est `public/figures/<identifiant>.svg`. Préfixez-le par le nom de
  la notion pour éviter les doublons entre thèmes.
- Le texte alternatif décrit la figure en une phrase courte, pour qui ne la voit pas : ce qu'elle
  montre, pas sa couleur. **Sans signe « = »** : le test des égalités le lirait comme un calcul.
  Il ne donne pas plus d'informations que l'énoncé (pas la réponse, donc).

Dans un exercice, on n'écrit pas cette ligne à la main, on passe par les outils de rédaction :

```ts
import { defineExercise, exact, figure, paragraphs } from '../authoring.js'

defineExercise({
  // …
  lesson: paragraphs(
    'Dans un triangle rectangle, le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.',
    figure('pythagore-rappel', 'Un triangle ABC rectangle en B, d’hypoténuse AC.'),
  ),
  example: {
    statement: 'ABC est rectangle en B, AB = 6 cm et BC = 8 cm. Calcule AC.',
    figure: { id: 'pythagore-exemple', alt: 'Le triangle ABC rectangle en B, AB et BC donnés.' },
    steps: [/* … */],
    conclusion: '…',
  },
  questions: [
    exact({
      prompt: 'EFG est rectangle en F, EF = 5 cm et FG = 12 cm. Calcule EG, en cm.',
      figure: { id: 'pythagore-efg', alt: 'Le triangle EFG rectangle en F ; EG est cherchée.' },
      answers: ['13'],
      correction: {/* … pas de figure ici */},
    }),
  ],
})
```

- `figure(id, alt)` dans un rappel (ou une consigne) : un paragraphe de `paragraphs(...)`.
- `figure: { id, alt }` dans un exemple : affichée juste après son énoncé.
- `figure: { id, alt }` dans une question (`qcm` ou `exact`) : ajoutée à la fin de l'énoncé, sur
  une ligne à part. L'énoncé lui-même reste complet sans l'image.
- La typographie automatique ne touche qu'au texte alternatif, jamais à l'identifiant.
- Les longueurs mesurées par les tests (rappel, exemple) ne comptent pas les lignes
  d'illustration ; un énoncé, lui, fait 600 caractères au plus, illustration comprise.

### Dessiner la figure

Les figures se définissent en TypeScript dans `server/library/figures/`, **un fichier par thème**
(`nombres.ts`, `calcul-litteral.ts`, `geometrie.ts`…). Vous n'ajoutez qu'à la liste de votre
fichier de thème. Ne modifiez ni `svg.ts` (les primitives), ni `families.ts` (les familles), ni
`index.ts` : ils sont communs à tous. Si une primitive manque, dessinez-la dans votre fichier de
thème avec `path`, `polygon` et `text`.

Une figure est une zone de 320 unités de large (la largeur d'un téléphone) et de 120 à 260 de
haut. L'origine est en haut à gauche, y vers le bas ; les angles se donnent en degrés comme en
maths (0 vers la droite, 90 vers le haut).

```ts
import { polygonFigure, UNKNOWN } from './families.js'
import { defineFigure, type FigureDefinition, withParts, withUnit, text, GREY } from './svg.js'

const pythagoreEfg = defineFigure(
  'pythagore-efg',
  withParts(
    polygonFigure({
      height: 200,
      vertices: [
        { name: 'E', at: [70, 30] },
        { name: 'F', at: [70, 166] },
        { name: 'G', at: [262, 166] },
      ],
      rightAngles: ['F'],
      sides: [
        { from: 'E', to: 'F', label: withUnit(5, 'cm') },
        { from: 'F', to: 'G', label: withUnit(12, 'cm') },
        { from: 'G', to: 'E', label: UNKNOWN },
      ],
    }),
    // On ajoute ce que la famille ne dessine pas.
    text([260, 30], 'schéma à main levée', { size: 13, color: GREY, anchor: 'end' }),
  ),
)

export const geometrieFigures: readonly FigureDefinition[] = [pythagoreEfg]
```

**Les familles** (`families.ts`), à essayer d'abord :

| Famille         | Pour                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `polygonFigure` | triangle ou polygone : sommets nommés, longueurs, angles droits, angles   |
| `planeFigure`   | repère quadrillé avec des droites `y = f(x)` et des points                |
| `tableFigure`   | tableau de valeurs ou de proportionnalité, flèches « × k »                |
| `treeFigure`    | arbre d'une expérience (vers la droite) ou de décomposition (vers le bas) |
| `stripFigure`   | bande partagée en parts : fraction, ratio, partage                        |
| `discFigure`    | disque partagé en parts égales, certaines coloriées                       |
| `chainFigure`   | programme de calcul, machine « x → f(x) » : boîtes et flèches             |

Chacune rend un `Drawing` (`{ height, parts }`) ; `withParts(dessin, …)` y ajoute des morceaux.

**Les primitives** (`svg.ts`) rendent chacune un morceau de SVG : `segment`, `dashed`
(pointillés), `line` (droite prolongée), `polyline`, `polygon`, `rect`, `circle`, `ellipse`,
`arc`, `sector`, `path` (chemin libre, pour un solide ou une scène), `arrow`, `curvedArrow`,
`text`, `labelAway`, `dot`, `pointName` (la lettre se place à l'opposé de `awayFrom`),
`lengthLabel` (au milieu du segment, du côté opposé à `outside`), `rightAngle`, `angleMark`
(arc et mesure), `equalTicks` (codage de longueurs égales), `brace` (accolade), `dimension`
(cote), `plane` (repère), `group` et `shifted` (déplacer un dessin), et les outils de calcul
`middle`, `lerp`, `polar`, `centroid`… Pour un solide : `ellipse` pour une base, `dashed` pour
une arête cachée.

### Le style

- Couleurs : encre `INK`, gris `GREY`, accent `ACCENT` (l'inconnue, ce qu'on cherche, ce qu'on
  met en valeur), aplats `PASTEL.lilas`, `menthe`, `peche`, `citron`, `ciel`, `anis`, `rose`. Le
  test refuse toute autre couleur. Fond transparent.
- Traits de 2, extrémités arrondies (c'est le défaut). Texte en 15 (13 au moins), graisse 600
  ou 700, avec un halo blanc qui le garde lisible sur un trait (c'est le défaut de `text`).
- Nombres à la française : `withUnit(3.5, 'cm')` donne « 3,5 cm » avec une espace insécable,
  `frenchNumber(-2)` donne « −2 ». Dans la source TypeScript, une espace insécable s'écrit
  `\u00A0`, jamais telle quelle.
- Lisible à 320 px : aucune étiquette sur un trait ou sur une autre étiquette, pas de détail
  inutile. Chaleureux sans être enfantin : l'élève a 14 ans.
- Autonome et sobre : pas de script, de lien, d'image incorporée ; moins de 12 Ko.

### Réengendrer les fichiers et se relire

Les fichiers `public/figures/*.svg` sont engendrés à partir des définitions et **enregistrés dans
le dépôt**. Après avoir ajouté ou modifié une figure :

```bash
MAJ_FIGURES=1 npx vitest run tests/unit/library-figures.test.ts
node scripts/figures-planche.mjs /tmp/planche.png pythagore-efg pythagore-rappel
```

La première commande récrit les fichiers (et supprime ceux qui n'ont plus de définition). La
seconde fabrique une planche PNG des figures nommées (toutes, sans identifiant), chacune à 320 px
sur le fond de carte où l'élève la voit : **regardez-la** avant de garder une figure. Vérifiez
aussi l'écran de l'élève sur téléphone (360 px de large).

Le test `tests/unit/library-figures.test.ts` vérifie ensuite que les fichiers sont à jour, que
chaque figure désignée par un exercice existe, qu'aucun fichier n'est orphelin, que chaque SVG
respecte le format et le style, que chaque texte alternatif est présent, et qu'aucune correction
n'est illustrée.

## Ce que vérifient les tests

```bash
npx vitest run tests/unit/library.test.ts tests/unit/library-figures.test.ts
```

Chaque exercice est relu : plan complet, longueurs, typographie, tutoiement, quête publiable telle
quelle, bonne réponse énoncée par la correction, mauvais choix tous commentés.

Surtout, **chaque égalité qui se lit est recalculée** : de part et d'autre de chaque signe « = »
ou « ≈ », le test cherche un calcul et compare les deux valeurs. Pour qu'il lise bien :

- écrire les calculs sans unité : `3 × 5 = 15`, puis « soit 15 cm » dans le commentaire ;
- écrire `0,20 × 150 = 30`, pas « 20 % de 150 = 30 » ;
- une égalité qui contient la lettre x doit être vraie pour tout x (une identité), ou vraie pour
  la solution que donne le texte (« x = 4 ») : c'est alors une équation.

Une lettre autre que x, un mot ou une unité ne se calculent pas : l'égalité est laissée de côté,
et c'est la relecture humaine qui la contrôle.

## Le catalogue du README

Le README liste les exercices de la bibliothèque. Un test compare ce tableau aux exercices livrés.
Après avoir ajouté, renommé ou retiré un exercice, le tableau se récrit ainsi :

```bash
MAJ_CATALOGUE=1 npx vitest run tests/unit/library-catalogue.test.ts
```
