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
- Sans figure : une situation de géométrie est décrite par son énoncé, assez précisément pour
  être dessinée. L'exemple commence alors par « On fait un schéma à main levée ».

## Écrire les calculs

| Pour écrire      | On tape                        | Jamais                |
| ---------------- | ------------------------------ | --------------------- |
| une puissance    | `x²`, `10³`, `2⁵`, `10⁻³`      | `x^2`, `x2`           |
| un produit       | `3 × 4`                        | la lettre x, `*`      |
| un quotient      | `12 ÷ 4`, ou la fraction `3/4` | `:`                   |
| une soustraction | `7 − 2` ou `7 - 2`             |                       |
| une racine       | `√25`, `√(9 + 16)`             |                       |
| un arrondi       | `√52 ≈ 7,2`                    | `=` devant un arrondi |
| un angle         | `cos(40°)`, `arccos(0,6)`      | `cos⁻¹`               |
| un décimal       | `3,5`                          | `3.5`                 |

La typographie est appliquée automatiquement : espace insécable devant « : », « ; », « ! » et
« ? », entre un nombre et son unité, espace fine entre les milliers, apostrophe courbe, signe
moins. Il suffit d'écrire avec des espaces ordinaires.

## Ce que vérifient les tests

```bash
npx vitest run tests/unit/library.test.ts
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
