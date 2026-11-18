import { defineExercise, paragraphs, qcm } from '../authoring.js'

/**
 * Identités remarquables : un exercice en deux quêtes, les cas simples puis les
 * cas difficiles. Chaque mauvais choix correspond à une erreur courante, que la
 * correction nomme.
 */

const IDENTITIES = [
  '- (a + b)² = a² + 2ab + b² : le carré d’une somme',
  '- (a − b)² = a² − 2ab + b² : le carré d’une différence',
  '- (a + b)(a − b) = a² − b² : le produit d’une somme par une différence',
].join('\n')

const simpleQuestions = [
  qcm({
    prompt: 'Développe et réduis A = (x + 3)².',
    choices: ['x² + 9', 'x² + 6x + 9', 'x² + 3x + 9', 'x² + 6x + 6'],
    answer: 'x² + 6x + 9',
    correction: {
      steps: [
        ['A = (x + 3)²', 'On reconnaît le carré d’une somme, (a + b)², avec a = x et b = 3.'],
        ['A = x² + 2 × x × 3 + 3²', 'On applique a² + 2ab + b², en remplaçant a par x et b par 3.'],
        ['A = x² + 6x + 9', 'On calcule chaque terme : 2 × x × 3 = 6x et 3² = 9.'],
      ],
      traps: [
        [
          'x² + 9',
          'le double produit 6x est oublié. Le carré d’une somme a toujours trois termes.',
        ],
        ['x² + 3x + 9', 'le double produit vaut 2 × x × 3, pas x × 3.'],
        ['x² + 6x + 6', '3² vaut 3 × 3 = 9, pas 2 × 3 = 6.'],
      ],
      check: 'pour x = 1, (1 + 3)² = 16 et 1 + 6 + 9 = 16.',
    },
  }),
  qcm({
    prompt: 'Développe et réduis B = (x − 5)².',
    choices: ['x² − 25', 'x² − 10x − 25', 'x² − 5x + 25', 'x² − 10x + 25'],
    answer: 'x² − 10x + 25',
    correction: {
      steps: [
        ['B = (x − 5)²', 'On reconnaît le carré d’une différence, (a − b)², avec a = x et b = 5.'],
        [
          'B = x² − 2 × x × 5 + 5²',
          'On applique a² − 2ab + b². Seul le double produit prend le signe moins.',
        ],
        ['B = x² − 10x + 25', 'On calcule chaque terme : 2 × x × 5 = 10x et 5² = 25.'],
      ],
      traps: [
        ['x² − 25', 'le double produit est oublié. Ce résultat est celui de (x + 5)(x − 5).'],
        ['x² − 10x − 25', 'le dernier terme est b², un carré : il est toujours positif.'],
        ['x² − 5x + 25', 'le double produit vaut 2 × x × 5, pas x × 5.'],
      ],
      check: 'pour x = 1, (1 − 5)² = (−4)² = 16 et 1 − 10 + 25 = 16.',
    },
  }),
  qcm({
    prompt: 'Développe et réduis C = (x + 4)(x − 4).',
    choices: ['x² − 16', 'x² + 16', 'x² − 8x + 16', 'x² − 8'],
    answer: 'x² − 16',
    correction: {
      steps: [
        [
          'C = (x + 4)(x − 4)',
          'Les deux facteurs ont les mêmes termes, x et 4, avec des signes opposés : c’est (a + b)(a − b), avec a = x et b = 4.',
        ],
        ['C = x² − 4²', 'On applique a² − b².'],
        ['C = x² − 16', 'On calcule 4² = 16.'],
      ],
      traps: [
        ['x² + 16', 'le résultat est une différence de deux carrés : le signe est moins.'],
        ['x² − 8x + 16', 'c’est le développement de (x − 4)², pas celui de (x + 4)(x − 4).'],
        ['x² − 8', '4² vaut 4 × 4 = 16, pas 2 × 4 = 8.'],
      ],
      check:
        'en développant terme à terme, on obtient x² − 4x + 4x − 16. Les termes −4x et +4x s’annulent : il reste x² − 16, sans terme en x.',
    },
  }),
  qcm({
    prompt: 'Factorise D = x² + 10x + 25.',
    choices: ['(x + 25)²', '(x + 5)(x − 5)', '(x + 5)²', '(x + 10)²'],
    answer: '(x + 5)²',
    correction: {
      steps: [
        [
          'D = x² + 10x + 25',
          'Trois termes, tous précédés d’un signe plus : on pense à a² + 2ab + b².',
        ],
        ['a² = x² et b² = 25', 'On cherche les deux carrés : a = x et b = 5, car 5² = 25.'],
        ['2ab = 2 × x × 5 = 10x', 'On vérifie le double produit : c’est bien le terme du milieu.'],
        ['D = (x + 5)²', 'On peut donc écrire le carré d’une somme.'],
      ],
      traps: [
        ['(x + 25)²', 'c’est b² qui vaut 25, donc b = 5.'],
        ['(x + 5)(x − 5)', 'ce produit vaut x² − 25 : il n’a pas de terme en x.'],
        ['(x + 10)²', '10x est le double produit 2ab. Comme a = x, on a 2b = 10, donc b = 5.'],
      ],
      check: 'en développant (x + 5)², on retrouve x² + 10x + 25.',
    },
  }),
  qcm({
    prompt: 'Factorise E = x² − 6x + 9.',
    choices: ['(x − 3)²', '(x − 9)²', '(x + 3)(x − 3)', '(x + 3)²'],
    answer: '(x − 3)²',
    correction: {
      steps: [
        [
          'E = x² − 6x + 9',
          'Trois termes, et seul celui du milieu est négatif : on pense à a² − 2ab + b².',
        ],
        ['a² = x² et b² = 9', 'On cherche les deux carrés : a = x et b = 3, car 3² = 9.'],
        [
          '2ab = 2 × x × 3 = 6x',
          'On vérifie le double produit : c’est le terme du milieu, au signe près.',
        ],
        [
          'E = (x − 3)²',
          'Le signe moins du terme du milieu donne une différence dans la parenthèse.',
        ],
      ],
      traps: [
        ['(x − 9)²', 'c’est b² qui vaut 9, donc b = 3.'],
        ['(x + 3)(x − 3)', 'ce produit vaut x² − 9 : il n’a pas de terme en x.'],
        ['(x + 3)²', 'ce carré vaut x² + 6x + 9 : le terme du milieu serait positif.'],
      ],
      check: 'en développant (x − 3)², on retrouve x² − 6x + 9.',
    },
  }),
  qcm({
    prompt: 'Factorise F = x² − 49.',
    choices: ['(x − 7)²', '(x − 49)(x + 49)', '(x + 7)(x − 7)', '(x + 7)²'],
    answer: '(x + 7)(x − 7)',
    correction: {
      steps: [
        [
          'F = x² − 49',
          'Deux termes séparés par un signe moins, et chacun est un carré : c’est a² − b².',
        ],
        ['F = x² − 7²', 'On écrit 49 comme un carré : 49 = 7². Donc a = x et b = 7.'],
        [
          'F = (x + 7)(x − 7)',
          'On applique (a + b)(a − b). L’ordre des deux facteurs n’a pas d’importance.',
        ],
      ],
      traps: [
        [
          '(x − 7)²',
          'ce carré vaut x² − 14x + 49 : un terme en x en trop, et un signe plus devant 49.',
        ],
        ['(x − 49)(x + 49)', 'c’est b² qui vaut 49, donc b = 7.'],
        ['(x + 7)²', 'ce carré vaut x² + 14x + 49.'],
      ],
      check: 'en développant (x + 7)(x − 7), on obtient x² − 7x + 7x − 49 = x² − 49.',
    },
  }),
]

const hardQuestions = [
  qcm({
    prompt: 'Développe et réduis G = (3x − 4)².',
    choices: ['3x² − 24x + 16', '9x² − 16', '9x² − 24x + 16', '9x² − 12x + 16'],
    answer: '9x² − 24x + 16',
    correction: {
      steps: [
        [
          'G = (3x − 4)²',
          'C’est le carré d’une différence, avec a = 3x et b = 4. Ici, a porte un coefficient.',
        ],
        [
          'G = (3x)² − 2 × 3x × 4 + 4²',
          'On applique a² − 2ab + b², en gardant 3x entre parenthèses.',
        ],
        [
          'G = 9x² − 24x + 16',
          'On calcule : (3x)² = 3² × x² = 9x², puis 2 × 3x × 4 = 24x et 4² = 16.',
        ],
      ],
      traps: [
        [
          '3x² − 24x + 16',
          'le carré porte sur tout le terme 3x, donc aussi sur le 3 : (3x)² = 9x².',
        ],
        ['9x² − 16', 'le double produit 24x est oublié.'],
        ['9x² − 12x + 16', 'le double produit vaut 2 × 3x × 4 = 24x, pas 3x × 4.'],
      ],
      check: 'pour x = 2, (6 − 4)² = 4 et 36 − 48 + 16 = 4.',
    },
  }),
  qcm({
    prompt: 'Développe et réduis H = (3x − 2)² − (x + 5)(x − 5).',
    choices: ['8x² − 12x − 21', '8x² − 12x + 29', '10x² − 12x − 21', '8x² − 6x + 29'],
    answer: '8x² − 12x + 29',
    correction: {
      steps: [
        [
          '(3x − 2)² = 9x² − 12x + 4',
          'On développe d’abord le carré d’une différence, avec a = 3x et b = 2.',
        ],
        [
          '(x + 5)(x − 5) = x² − 25',
          'On développe ensuite le produit d’une somme par une différence.',
        ],
        [
          'H = (9x² − 12x + 4) − (x² − 25)',
          'On remplace dans H en gardant les parenthèses : le signe moins porte sur tout le second résultat.',
        ],
        [
          'H = 9x² − 12x + 4 − x² + 25',
          'On supprime les parenthèses. Derrière un signe moins, chaque signe change : −(x² − 25) = −x² + 25.',
        ],
        ['H = 8x² − 12x + 29', 'On réduit : 9x² − x² = 8x² et 4 + 25 = 29.'],
      ],
      traps: [
        [
          '8x² − 12x − 21',
          'le signe de 25 n’a pas changé. C’est l’erreur la plus fréquente : −(x² − 25) donne −x² + 25.',
        ],
        [
          '10x² − 12x − 21',
          'la soustraction est devenue une addition : x² − 25 a été ajouté au lieu d’être retranché.',
        ],
        ['8x² − 6x + 29', 'le double produit vaut 2 × 3x × 2 = 12x, pas 3x × 2.'],
      ],
      check: 'pour x = 1, H = 1² − 6 × (−4) = 1 + 24 = 25, et 8 − 12 + 29 = 25.',
    },
  }),
  qcm({
    prompt: 'Factorise I = 25x² + 20x + 4.',
    choices: ['(25x + 2)²', '(5x + 4)²', '(5x + 2)(5x − 2)', '(5x + 2)²'],
    answer: '(5x + 2)²',
    correction: {
      steps: [
        ['I = 25x² + 20x + 4', 'Trois termes positifs : on pense à a² + 2ab + b².'],
        ['25x² = (5x)² et 4 = 2²', 'On cherche les deux carrés : a = 5x et b = 2.'],
        ['2ab = 2 × 5x × 2 = 20x', 'On vérifie le double produit : c’est bien le terme du milieu.'],
        ['I = (5x + 2)²', 'On écrit le carré d’une somme.'],
      ],
      traps: [
        ['(25x + 2)²', 'c’est a² qui vaut 25x², donc a = 5x.'],
        ['(5x + 4)²', 'c’est b² qui vaut 4, donc b = 2.'],
        ['(5x + 2)(5x − 2)', 'ce produit vaut 25x² − 4 : il n’a pas de terme en x.'],
      ],
      check: 'en développant (5x + 2)², on retrouve 25x² + 20x + 4.',
    },
  }),
  qcm({
    prompt: 'Factorise J = (x + 3)² − 16.',
    choices: ['(x + 19)(x − 13)', 'x² + 6x − 7', '(x − 1)²', '(x + 7)(x − 1)'],
    answer: '(x + 7)(x − 1)',
    correction: {
      steps: [
        [
          'J = (x + 3)² − 4²',
          'On écrit 16 comme un carré : 16 = 4². C’est a² − b², où a est toute la parenthèse (x + 3) et b = 4.',
        ],
        [
          'J = (x + 3 + 4)(x + 3 − 4)',
          'On applique (a + b)(a − b) : on ajoute 4 à a dans le premier facteur, on le retranche dans le second.',
        ],
        ['J = (x + 7)(x − 1)', 'On réduit chaque facteur : 3 + 4 = 7 et 3 − 4 = −1.'],
      ],
      traps: [
        [
          '(x + 19)(x − 13)',
          'c’est b² qui vaut 16, donc b = 4 : on ajoute et on retranche 4, pas 16.',
        ],
        [
          'x² + 6x − 7',
          'cette expression est bien égale à J, mais c’est une somme : elle est développée, pas factorisée.',
        ],
        ['(x − 1)²', 'J est une différence de deux carrés, pas le carré d’une différence.'],
      ],
      check:
        '(x + 7)(x − 1) = x² − x + 7x − 7 = x² + 6x − 7, et (x + 3)² − 16 = x² + 6x + 9 − 16 = x² + 6x − 7.',
    },
  }),
  qcm({
    prompt: 'Calcule 103² sans calculatrice, à l’aide d’une identité remarquable.',
    choices: ['10 009', '10 609', '10 600', '10 309'],
    answer: '10 609',
    correction: {
      steps: [
        ['103² = (100 + 3)²', 'On écrit 103 à partir d’un nombre rond : 100 + 3.'],
        ['103² = 100² + 2 × 100 × 3 + 3²', 'C’est le carré d’une somme, avec a = 100 et b = 3.'],
        ['103² = 10 000 + 600 + 9 = 10 609', 'Chaque terme se calcule de tête.'],
      ],
      traps: [
        ['10 009', 'c’est 100² + 3² : le double produit 600 est oublié.'],
        ['10 600', 'le carré de 3 est oublié.'],
        ['10 309', 'le double produit vaut 2 × 100 × 3 = 600, pas 100 × 3.'],
      ],
      check: 'la calculatrice confirme : 103 × 103 = 10 609.',
    },
  }),
  qcm({
    prompt: 'Calcule 98² sans calculatrice, à l’aide d’une identité remarquable.',
    choices: ['9 996', '9 804', '9 604', '9 596'],
    answer: '9 604',
    correction: {
      steps: [
        ['98² = (100 − 2)²', '98 est proche de 100 : on l’écrit comme une différence.'],
        [
          '98² = 100² − 2 × 100 × 2 + 2²',
          'C’est le carré d’une différence, avec a = 100 et b = 2.',
        ],
        [
          '98² = 10 000 − 400 + 4 = 9 604',
          'Le double produit se soustrait, le carré de 2 s’ajoute.',
        ],
      ],
      traps: [
        ['9 996', 'c’est 100² − 2². Le carré d’une différence n’est pas la différence des carrés.'],
        ['9 804', 'le double produit vaut 2 × 100 × 2 = 400, pas 100 × 2.'],
        ['9 596', 'le dernier terme, 2², s’ajoute : un carré est toujours positif.'],
      ],
      check: 'la calculatrice confirme : 98 × 98 = 9 604.',
    },
  }),
  qcm({
    prompt: 'Calcule 47 × 53 sans calculatrice, à l’aide d’une identité remarquable.',
    choices: ['2 491', '2 509', '2 500', '2 494'],
    answer: '2 491',
    correction: {
      steps: [
        [
          '47 × 53 = (50 − 3)(50 + 3)',
          '47 et 53 sont à la même distance de 50 : 3 de moins, 3 de plus.',
        ],
        [
          '47 × 53 = 50² − 3²',
          'C’est le produit d’une somme par une différence, avec a = 50 et b = 3.',
        ],
        ['47 × 53 = 2 500 − 9 = 2 491', 'Une seule soustraction suffit.'],
      ],
      traps: [
        [
          '2 509',
          'le résultat est une différence de deux carrés : on retranche 3², on ne l’ajoute pas.',
        ],
        ['2 500', 'le carré de 3 est oublié.'],
        ['2 494', '3² vaut 3 × 3 = 9, pas 2 × 3 = 6.'],
      ],
      check: 'la calculatrice confirme : 47 × 53 = 2 491.',
    },
  }),
  qcm({
    prompt: 'Résous l’équation (x − 2)² − 25 = 0.',
    choices: ['x = 7', 'x = 3 ou x = −7', 'x = −5 ou x = 5', 'x = −3 ou x = 7'],
    answer: 'x = −3 ou x = 7',
    correction: {
      steps: [
        [
          '(x − 2)² − 5² = 0',
          'Le membre de gauche est une différence de deux carrés, avec a = x − 2 et b = 5.',
        ],
        [
          '(x − 2 + 5)(x − 2 − 5) = 0',
          'On factorise avec a² − b² = (a + b)(a − b). Développer mènerait à x² − 4x − 21 = 0, une équation qu’on ne sait pas résoudre en 3e.',
        ],
        ['(x + 3)(x − 7) = 0', 'On réduit chaque facteur.'],
        [
          'x + 3 = 0 ou x − 7 = 0',
          'Un produit est nul si, et seulement si, l’un de ses facteurs est nul.',
        ],
        ['x = −3 ou x = 7', 'On résout chaque équation. L’équation a deux solutions : −3 et 7.'],
      ],
      traps: [
        ['x = 7', 'il manque une solution. Deux nombres ont pour carré 25 : 5 et −5.'],
        [
          'x = 3 ou x = −7',
          'les signes sont inversés : x + 3 = 0 donne x = −3, et x − 7 = 0 donne x = 7.',
        ],
        ['x = −5 ou x = 5', 'ce sont les valeurs de x − 2, pas celles de x.'],
      ],
      check:
        'pour x = 7, (7 − 2)² − 25 = 25 − 25 = 0. Pour x = −3, (−3 − 2)² − 25 = (−5)² − 25 = 0.',
    },
  }),
]

export const identitesRemarquables = [
  defineExercise({
    id: 'identites-remarquables-cas-simples',
    title: 'Identités remarquables : cas simples',
    theme: 'calcul-litteral',
    difficulty: 'easy',
    description:
      'Six applications directes des trois identités : développer un carré ou un produit, puis factoriser. Chaque mauvais choix correspond à une erreur courante.',
    lesson: paragraphs(
      'Une identité remarquable est une égalité vraie pour tous les nombres a et b. Elle fait gagner du temps : on passe d’une écriture à l’autre sans tout recalculer.',
      IDENTITIES,
      '**Développer**, c’est aller de gauche à droite : un produit devient une somme. **Factoriser**, c’est le chemin inverse. Le terme 2ab s’appelle le double produit.',
    ),
    example: [
      {
        statement: 'Développe et réduis P = (x + 6)².',
        steps: [
          [
            'P = (x + 6)²',
            'On repère la forme : c’est le carré d’une somme, (a + b)². Ici a = x et b = 6.',
          ],
          [
            'P = x² + 2 × x × 6 + 6²',
            'On écrit a² + 2ab + b² en remplaçant a par x et b par 6. Le terme du milieu est le double produit.',
          ],
          ['P = x² + 12x + 36', 'On calcule chaque terme : 2 × x × 6 = 12x et 6² = 36.'],
        ],
        conclusion: 'P = x² + 12x + 36. On vérifie avec x = 1 : (1 + 6)² = 49 et 1 + 12 + 36 = 49.',
      },
      {
        statement: 'Factorise Q = x² − 16x + 64.',
        steps: [
          [
            'Q = x² − 16x + 64',
            'Trois termes, et seul celui du milieu est négatif : on pense à a² − 2ab + b².',
          ],
          ['a² = x² et b² = 64', 'On cherche les deux carrés : a = x et b = 8, car 8² = 64.'],
          [
            '2ab = 2 × x × 8 = 16x',
            'On vérifie le double produit avant de conclure : c’est bien le terme du milieu, au signe près.',
          ],
          [
            'Q = (x − 8)²',
            'Les trois termes sont ceux de l’identité : on écrit le carré d’une différence.',
          ],
        ],
        conclusion: 'Q = (x − 8)². En développant (x − 8)², on retrouve bien x² − 16x + 64.',
      },
    ],
    questions: simpleQuestions,
  }),
  defineExercise({
    id: 'identites-remarquables-cas-difficiles',
    title: 'Identités remarquables : cas difficiles',
    theme: 'calcul-litteral',
    difficulty: 'hard',
    description:
      'Huit calculs où les identités se combinent ou se cachent : coefficients, expression à réduire, parenthèse au carré, calcul mental, équation produit.',
    lesson: paragraphs(
      'Les trois identités remarquables restent les mêmes :',
      IDENTITIES,
      'Ce qui change, c’est que a et b ne sont plus de simples lettres : a peut valoir 3x, ou toute une parenthèse. La méthode, elle, ne change pas.',
      [
        '1. Repère la forme : carré d’une somme, carré d’une différence, ou différence de deux carrés.',
        '2. Écris ce que valent a et b.',
        '3. Applique l’identité en gardant des parenthèses autour de a et de b.',
        '4. Calcule, puis vérifie avec une valeur simple de x.',
      ].join('\n'),
    ),
    example: [
      {
        statement: 'Développe et réduis P = (2x + 5)².',
        steps: [
          ['P = (2x + 5)²', 'C’est le carré d’une somme, avec a = 2x et b = 5.'],
          [
            'P = (2x)² + 2 × 2x × 5 + 5²',
            'On applique a² + 2ab + b² en gardant 2x entre parenthèses : le carré porte sur le 2 et sur le x.',
          ],
          [
            'P = 4x² + 20x + 25',
            'On calcule : (2x)² = 2² × x² = 4x², puis 2 × 2x × 5 = 20x et 5² = 25.',
          ],
        ],
        conclusion:
          'P = 4x² + 20x + 25. On vérifie avec x = 1 : (2 + 5)² = 49 et 4 + 20 + 25 = 49.',
      },
      {
        statement: 'Factorise Q = (x − 1)² − 9.',
        steps: [
          [
            'Q = (x − 1)² − 3²',
            'On écrit 9 comme un carré. On reconnaît a² − b², où a est toute la parenthèse (x − 1) et b = 3.',
          ],
          [
            'Q = (x − 1 + 3)(x − 1 − 3)',
            'On applique (a + b)(a − b) : on ajoute 3 dans le premier facteur, on le retranche dans le second.',
          ],
          ['Q = (x + 2)(x − 4)', 'On réduit chaque facteur : −1 + 3 = 2 et −1 − 3 = −4.'],
        ],
        conclusion:
          'Q = (x + 2)(x − 4). On vérifie avec x = 4 : (4 − 1)² − 9 = 0 et (4 + 2)(4 − 4) = 0.',
      },
    ],
    questions: hardQuestions,
  }),
]
