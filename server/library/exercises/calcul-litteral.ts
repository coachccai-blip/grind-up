import { defineExercise, paragraphs, qcm } from '../authoring.js'

/**
 * Calcul littéral : développer et réduire, puis factoriser avec un facteur
 * commun. Les identités remarquables ont leurs propres exercices.
 */

const developper = defineExercise({
  id: 'developper-et-reduire',
  title: 'Développer et réduire',
  theme: 'calcul-litteral',
  difficulty: 'easy',
  description:
    'Réduire une expression, développer avec la simple puis la double distributivité, supprimer une parenthèse précédée d’un signe moins, et combiner deux développements. Sans identités remarquables.',
  lesson: paragraphs(
    '**Développer**, c’est transformer un produit en somme. **Réduire**, c’est regrouper les termes de même nature : les termes en x² entre eux, les termes en x entre eux, les nombres entre eux.',
    [
      '- Simple distributivité : k(a + b) = ka + kb et k(a − b) = ka − kb.',
      '- Double distributivité : (a + b)(c + d) = ac + ad + bc + bd. Chaque terme de la première parenthèse multiplie chaque terme de la seconde.',
      '- Signe moins devant une parenthèse : on la supprime en changeant le signe de chacun de ses termes. Par exemple, −(a − b) = −a + b.',
    ].join('\n'),
    'Dans une somme, on ajoute les termes de même nature : 3x + 5x = 8x. Dans un produit, on multiplie les nombres entre eux et les lettres entre elles : 3x × 5x = 15x². En revanche, 3x + 5 ne se réduit pas : 3x et 5 ne sont pas de même nature.',
    'Un contrôle rapide : remplace x par un nombre simple dans l’expression de départ et dans ton résultat. Si tu ne trouves pas deux fois la même valeur, il y a une erreur.',
  ),
  example: [
    {
      statement: 'Développe et réduis P = 4(2x + 3) − (x − 5).',
      steps: [
        [
          '4(2x + 3) = 4 × 2x + 4 × 3 = 8x + 12',
          'Simple distributivité : le facteur 4 multiplie chaque terme de la parenthèse, 2x puis 3.',
        ],
        [
          '−(x − 5) = −x + 5',
          'Un signe moins devant une parenthèse change le signe de chacun de ses termes : x devient −x, et −5 devient +5.',
        ],
        ['P = 8x + 12 − x + 5', 'On réunit les deux résultats.'],
        [
          'P = 7x + 17',
          'On réduit : les termes en x ensemble, 8x − x = 7x, puis les nombres ensemble, 12 + 5 = 17.',
        ],
      ],
      conclusion: 'P = 7x + 17. On contrôle avec x = 1 : 4 × 5 − (−4) = 24 et 7 + 17 = 24.',
    },
    {
      statement: 'Développe et réduis Q = (x + 4)(2x − 3).',
      steps: [
        [
          'Q = x × 2x + x × (−3) + 4 × 2x + 4 × (−3)',
          'Double distributivité : chaque terme de la première parenthèse multiplie chaque terme de la seconde, ce qui fait quatre produits. Le second terme de (2x − 3) est −3 : il garde son signe.',
        ],
        [
          'Q = 2x² − 3x + 8x − 12',
          'On calcule chaque produit : x × 2x = 2x², puis −3x, 8x et −12.',
        ],
        ['Q = 2x² + 5x − 12', 'On réduit les termes en x : −3x + 8x = 5x.'],
      ],
      conclusion: 'Q = 2x² + 5x − 12. On contrôle avec x = 1 : 5 × (−1) = −5 et 2 + 5 − 12 = −5.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Réduis A = 7x + 5 − 3x + 2.',
      choices: ['11x', '10x + 7', '4x + 7', '4x + 3'],
      answer: '4x + 7',
      correction: {
        steps: [
          [
            'A = 7x − 3x + 5 + 2',
            'On regroupe les termes de même nature : les termes en x d’un côté, les nombres de l’autre. Chaque terme se déplace avec le signe placé devant lui : le signe moins reste devant 3x.',
          ],
          [
            '7x − 3x = 4x et 5 + 2 = 7',
            'On calcule chaque groupe. 7 fois x moins 3 fois x, cela fait 4 fois x.',
          ],
          [
            'A = 4x + 7',
            'On s’arrête là : 4x et 7 ne sont pas de même nature, on ne peut pas les ajouter.',
          ],
        ],
        traps: [
          [
            '11x',
            'tous les nombres ont été ajoutés : 7 + 5 − 3 + 2 = 11. Or 5 et 2 ne sont pas des termes en x : ils ne se mélangent pas avec 7x et 3x.',
          ],
          [
            '10x + 7',
            'le signe moins devant 3x a été oublié : 7x + 3x = 10x. Il fallait calculer 7x − 3x.',
          ],
          [
            '4x + 3',
            'le signe moins de 3x a été reporté sur le 2 : 5 − 2 = 3. Or le 2 est précédé d’un signe plus.',
          ],
        ],
        check: 'pour x = 2 : 14 + 5 − 6 + 2 = 15 et 4 × 2 + 7 = 15.',
      },
    }),
    qcm({
      prompt: 'Développe B = 3(2x + 5).',
      choices: ['6x + 5', '6x + 15', '5x + 8', '21x'],
      answer: '6x + 15',
      correction: {
        steps: [
          [
            '3(2x + 5) = 3 × 2x + 3 × 5',
            'Simple distributivité : le facteur 3 multiplie chaque terme de la parenthèse, 2x puis 5.',
          ],
          ['3 × 2x = 6x et 3 × 5 = 15', 'On calcule les deux produits.'],
          [
            'B = 6x + 15',
            'Le produit est devenu une somme de deux termes : il est développé. On ne peut pas réduire davantage.',
          ],
        ],
        traps: [
          [
            '6x + 5',
            'le facteur 3 n’a multiplié que le premier terme. Il doit multiplier aussi le 5.',
          ],
          [
            '5x + 8',
            'le facteur 3 a été ajouté à chaque terme au lieu de le multiplier : 3 + 2 = 5 et 3 + 5 = 8.',
          ],
          [
            '21x',
            'le développement 6x + 15 a été trouvé, puis réduit à tort : 6x et 15 ne sont pas de même nature, on ne peut pas les ajouter.',
          ],
        ],
        check: 'pour x = 2 : 3 × (4 + 5) = 27 et 6 × 2 + 15 = 27.',
      },
    }),
    qcm({
      prompt: 'Développe C = 2x(4x − 3).',
      choices: ['8x − 6x', '8x² − 3', '6x² − 6x', '8x² − 6x'],
      answer: '8x² − 6x',
      correction: {
        steps: [
          [
            '2x(4x − 3) = 2x × 4x − 2x × 3',
            'Simple distributivité avec une soustraction : le facteur 2x multiplie 4x, puis 3, et le signe moins est conservé.',
          ],
          [
            '2x × 4x = 8x² et 2x × 3 = 6x',
            'Dans un produit, on multiplie les nombres entre eux et les lettres entre elles : 2 × 4 = 8 et x × x = x².',
          ],
          [
            'C = 8x² − 6x',
            'Un terme en x² et un terme en x ne sont pas de même nature : on ne peut pas réduire davantage.',
          ],
        ],
        traps: [
          ['8x − 6x', 'x × x a été remplacé par x. Or x × x = x² : le premier terme est 8x².'],
          ['8x² − 3', 'le facteur 2x n’a multiplié que le premier terme de la parenthèse.'],
          [
            '6x² − 6x',
            'dans le premier produit, 2 et 4 ont été ajoutés au lieu d’être multipliés.',
          ],
        ],
        check: 'pour x = 2 : 4 × (8 − 3) = 20 et 8 × 4 − 6 × 2 = 20.',
      },
    }),
    qcm({
      prompt: 'Supprime la parenthèse, puis réduis D = 6x − (2x − 5) + 3.',
      choices: ['4x − 2', '4x + 8', '4x + 2', '8x − 2'],
      answer: '4x + 8',
      correction: {
        steps: [
          [
            '−(2x − 5) = −2x + 5',
            'La parenthèse est précédée d’un signe moins : on la supprime en changeant le signe de chacun de ses termes. 2x devient −2x, et −5 devient +5.',
          ],
          [
            'D = 6x − 2x + 5 + 3',
            'On réécrit D sans parenthèse. Le terme +3 est en dehors de la parenthèse : il ne change pas.',
          ],
          ['D = 4x + 8', 'On réduit : 6x − 2x = 4x et 5 + 3 = 8.'],
        ],
        traps: [
          [
            '4x − 2',
            'la parenthèse a simplement été effacée : seul 2x a pris le signe moins. Le terme −5 doit lui aussi changer de signe et devenir +5.',
          ],
          [
            '4x + 2',
            'le signe de 3 a changé aussi. Or ce terme est en dehors de la parenthèse : il reste +3.',
          ],
          [
            '8x − 2',
            'le signe moins devant la parenthèse a été oublié : c’est le calcul de 6x + (2x − 5) + 3.',
          ],
        ],
        check: 'pour x = 1 : 6 − (2 − 5) + 3 = 12 et 4 + 8 = 12.',
      },
    }),
    qcm({
      prompt: 'Développe et réduis E = (2x + 3)(x − 4).',
      choices: ['2x² − 5x − 12', '2x² − 12', '2x² + 11x − 12', '2x² − 5x + 12'],
      answer: '2x² − 5x − 12',
      correction: {
        steps: [
          [
            'E = 2x × x + 2x × (−4) + 3 × x + 3 × (−4)',
            'Double distributivité : chaque terme de la première parenthèse multiplie chaque terme de la seconde, ce qui fait quatre produits. Le second terme de (x − 4) est −4 : il garde son signe.',
          ],
          [
            'E = 2x² − 8x + 3x − 12',
            'On calcule chaque produit : 2x × x = 2x² ; 2x × (−4) = −8x ; 3 × x = 3x ; 3 × (−4) = −12.',
          ],
          ['E = 2x² − 5x − 12', 'On réduit les termes en x : −8x + 3x = −5x.'],
        ],
        traps: [
          [
            '2x² − 12',
            'seuls deux produits ont été calculés : 2x × x et 3 × (−4). Il manque les deux autres, 2x × (−4) et 3 × x.',
          ],
          [
            '2x² + 11x − 12',
            'le signe de −8x a été perdu : 8x + 3x = 11x. Il fallait calculer −8x + 3x.',
          ],
          ['2x² − 5x + 12', 'erreur de signe sur le dernier produit : 3 × (−4) = −12, et non 12.'],
        ],
        check: 'pour x = 1 : 5 × (−3) = −15 et 2 − 5 − 12 = −15.',
      },
    }),
    qcm({
      prompt: 'Développe et réduis F = (x + 2)(x + 3) − 4(x − 1).',
      choices: ['x² + x + 2', 'x² + 9x + 10', 'x² − 4x + 10', 'x² + x + 10'],
      answer: 'x² + x + 10',
      correction: {
        steps: [
          [
            '(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6',
            'On développe d’abord le produit des deux parenthèses par double distributivité, puis on réduit : 3x + 2x = 5x.',
          ],
          [
            '−4(x − 1) = −4x + 4',
            'On développe ensuite le second produit, en gardant le signe moins avec le facteur 4 : (−4) × x = −4x et (−4) × (−1) = 4.',
          ],
          ['F = x² + 5x + 6 − 4x + 4', 'On réunit les deux résultats.'],
          ['F = x² + x + 10', 'On réduit : 5x − 4x = x et 6 + 4 = 10.'],
        ],
        traps: [
          [
            'x² + x + 2',
            'erreur de signe dans le second développement : (−4) × (−1) = 4, et non −4. Le produit de deux nombres négatifs est positif.',
          ],
          [
            'x² + 9x + 10',
            'le signe moins devant 4x a été perdu : 5x + 4x = 9x. Il fallait calculer 5x − 4x.',
          ],
          [
            'x² − 4x + 10',
            'dans le premier produit, les termes 3x et 2x ont été oubliés : (x + 2)(x + 3) ne se réduit pas à x² + 6.',
          ],
        ],
        check: 'pour x = 1 : 3 × 4 − 4 × 0 = 12 et 1 + 1 + 10 = 12.',
      },
    }),
  ],
})

const factoriser = defineExercise({
  id: 'factoriser-avec-un-facteur-commun',
  title: 'Factoriser avec un facteur commun',
  theme: 'calcul-litteral',
  difficulty: 'medium',
  description:
    'Mettre en facteur un nombre, une lettre, les deux à la fois, puis une parenthèse entière, y compris quand il reste le facteur 1 ou qu’un signe moins sépare les deux produits. On vérifie en redéveloppant.',
  lesson: paragraphs(
    '**Factoriser**, c’est transformer une somme en produit : c’est le chemin inverse du développement. On utilise la distributivité dans l’autre sens : ka + kb = k(a + b) et ka − kb = k(a − b). Le facteur k, présent dans chaque terme, est le **facteur commun**.',
    [
      '1. Repère le facteur commun à tous les termes : un nombre, une lettre, les deux à la fois, ou une parenthèse entière.',
      '2. Écris chaque terme comme un produit dont l’un des facteurs est ce facteur commun.',
      '3. Écris le facteur commun une seule fois, suivi d’une parenthèse, ou d’un crochet, qui contient ce qui reste de chaque terme.',
      '4. Vérifie en redéveloppant : tu dois retrouver l’expression de départ.',
    ].join('\n'),
    'Quand un terme est égal au facteur commun, il reste 1 à sa place : 7x + 7 = 7 × x + 7 × 1 = 7(x + 1).',
  ),
  example: [
    {
      statement: 'Factorise P = 15x² + 10x.',
      steps: [
        [
          '15x² = 5x × 3x et 10x = 5x × 2',
          'On cherche le plus grand facteur commun aux deux termes. Pour les nombres : le plus grand diviseur commun à 15 et à 10 est 5. Pour les lettres : x figure dans x² et dans x. Le facteur commun est donc 5x.',
        ],
        [
          'P = 5x × 3x + 5x × 2',
          'On écrit chaque terme comme un produit dont l’un des facteurs est 5x.',
        ],
        [
          'P = 5x(3x + 2)',
          'On écrit 5x une seule fois. Dans la parenthèse, on place ce qui reste de chaque terme : 3x, puis 2.',
        ],
      ],
      conclusion: 'P = 5x(3x + 2). On vérifie en redéveloppant : 5x × 3x + 5x × 2 = 15x² + 10x.',
    },
    {
      statement: 'Factorise Q = (x + 2)(3x + 1) + (x + 2).',
      steps: [
        [
          'Q = (x + 2)(3x + 1) + (x + 2) × 1',
          'Le facteur commun est la parenthèse (x + 2). Dans le second terme, elle est seule : on l’écrit (x + 2) × 1, car multiplier par 1 ne change rien.',
        ],
        [
          'Q = (x + 2)[(3x + 1) + 1]',
          'On écrit (x + 2) une seule fois. Dans le crochet, on place ce qui reste de chaque terme : (3x + 1), puis 1.',
        ],
        ['Q = (x + 2)(3x + 2)', 'On réduit le crochet : 3x + 1 + 1 = 3x + 2.'],
      ],
      conclusion:
        'Q = (x + 2)(3x + 2). On vérifie en redéveloppant : (x + 2)(3x + 2) = 3x² + 8x + 4. L’expression de départ donne aussi 3x² + 7x + 2 + x + 2 = 3x² + 8x + 4.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Factorise A = 6x + 9.',
      choices: ['3(2x + 9)', '6(x + 3)', '3(2x + 3)', '15x'],
      answer: '3(2x + 3)',
      correction: {
        steps: [
          [
            '6x = 3 × 2x et 9 = 3 × 3',
            'On cherche un facteur commun aux deux termes. Les nombres 6 et 9 sont tous les deux dans la table de 3 : le facteur commun est 3.',
          ],
          [
            'A = 3 × 2x + 3 × 3',
            'On écrit chaque terme comme un produit dont l’un des facteurs est 3.',
          ],
          [
            'A = 3(2x + 3)',
            'On écrit 3 une seule fois. Dans la parenthèse, on place ce qui reste de chaque terme : 2x, puis 3.',
          ],
        ],
        traps: [
          [
            '3(2x + 9)',
            'le second terme n’a pas été divisé par 3. En redéveloppant, on trouve 6x + 27, et non 6x + 9.',
          ],
          [
            '6(x + 3)',
            '6 n’est pas un facteur commun, car 9 n’est pas dans la table de 6. En redéveloppant, on trouve 6x + 18.',
          ],
          [
            '15x',
            '6x et 9 ne sont pas de même nature : on ne peut pas les ajouter. De plus, factoriser, c’est écrire un produit, pas réduire.',
          ],
        ],
        check: 'on redéveloppe : 3(2x + 3) = 3 × 2x + 3 × 3 = 6x + 9.',
      },
    }),
    qcm({
      prompt: 'Factorise B = x² + 5x.',
      choices: ['x(x + 5)', 'x(x + 5x)', '5x(x + 1)', '6x²'],
      answer: 'x(x + 5)',
      correction: {
        steps: [
          [
            'x² = x × x et 5x = x × 5',
            'On cherche un facteur commun aux deux termes. Il n’y a pas de nombre commun, mais la lettre x figure dans x² et dans 5x : le facteur commun est x.',
          ],
          [
            'B = x × x + x × 5',
            'On écrit chaque terme comme un produit dont l’un des facteurs est x.',
          ],
          [
            'B = x(x + 5)',
            'On écrit x une seule fois. Dans la parenthèse, il reste x pour le premier terme et 5 pour le second.',
          ],
        ],
        traps: [
          [
            'x(x + 5x)',
            'le second terme n’a pas été divisé par x. En redéveloppant, on trouve x² + 5x², et non x² + 5x.',
          ],
          ['5x(x + 1)', '5 n’est pas un facteur de x². En redéveloppant, on trouve 5x² + 5x.'],
          ['6x²', 'x² et 5x ne sont pas de même nature : on ne peut pas les ajouter.'],
        ],
        check: 'on redéveloppe : x(x + 5) = x × x + x × 5 = x² + 5x.',
      },
    }),
    qcm({
      prompt: 'Factorise le plus possible C = 12x² − 8x.',
      choices: ['4(3x² − 2x)', '2x(6x − 4)', '4x(3x − 8)', '4x(3x − 2)'],
      answer: '4x(3x − 2)',
      correction: {
        steps: [
          [
            '12x² = 4x × 3x et 8x = 4x × 2',
            'On cherche le plus grand facteur commun. Pour les nombres : le plus grand diviseur commun à 12 et à 8 est 4. Pour les lettres : x figure dans les deux termes. Le facteur commun est donc 4x.',
          ],
          [
            'C = 4x × 3x − 4x × 2',
            'On écrit chaque terme comme un produit dont l’un des facteurs est 4x, en gardant le signe moins.',
          ],
          [
            'C = 4x(3x − 2)',
            'On écrit 4x une seule fois. Dans la parenthèse, 3x et 2 n’ont plus aucun facteur commun : la factorisation est terminée.',
          ],
        ],
        traps: [
          [
            '4(3x² − 2x)',
            'l’égalité est juste, mais la factorisation n’est pas terminée : 3x² et 2x ont encore x en commun.',
          ],
          [
            '2x(6x − 4)',
            'l’égalité est juste, mais la factorisation n’est pas terminée : 6x et 4 ont encore 2 en commun.',
          ],
          [
            '4x(3x − 8)',
            'le second terme n’a pas été divisé par 4x. En redéveloppant, on trouve 12x² − 32x.',
          ],
        ],
        check: 'on redéveloppe : 4x(3x − 2) = 4x × 3x − 4x × 2 = 12x² − 8x.',
      },
    }),
    qcm({
      prompt: 'Factorise D = (x + 1)(x + 2) + (x + 1)(x − 5).',
      choices: ['(x + 1)(x + 2)(x − 5)', '(x + 1)(2x − 3)', '(x + 1)²(2x − 3)', '(x + 1)(2x + 7)'],
      answer: '(x + 1)(2x − 3)',
      correction: {
        steps: [
          [
            'D = (x + 1)[(x + 2) + (x − 5)]',
            'D est une somme de deux produits, et la parenthèse (x + 1) figure dans les deux : c’est le facteur commun. On l’écrit une seule fois. Dans le crochet, on place ce qui reste de chaque produit : (x + 2), puis (x − 5).',
          ],
          [
            '(x + 2) + (x − 5) = x + 2 + x − 5 = 2x − 3',
            'On réduit le crochet. Les deux parenthèses sont précédées d’un signe plus : on les supprime sans rien changer.',
          ],
          ['D = (x + 1)(2x − 3)', 'On remplace le crochet par sa forme réduite.'],
        ],
        traps: [
          [
            '(x + 1)(x + 2)(x − 5)',
            'les deux facteurs restants ont été multipliés. Or D est une somme de deux produits : dans le crochet, (x + 2) et (x − 5) s’ajoutent.',
          ],
          [
            '(x + 1)²(2x − 3)',
            'le facteur commun (x + 1) a été écrit deux fois. Mis en facteur, il ne s’écrit qu’une seule fois.',
          ],
          ['(x + 1)(2x + 7)', 'erreur de signe en réduisant le crochet : 2 − 5 = −3, et non 7.'],
        ],
        check:
          'on redéveloppe : (x + 1)(2x − 3) = 2x² − x − 3. L’expression de départ donne aussi x² + 3x + 2 + x² − 4x − 5 = 2x² − x − 3.',
      },
    }),
    qcm({
      prompt: 'Factorise E = (x + 3)(5x − 2) + (x + 3).',
      choices: ['(x + 3)(5x − 2)', '(x + 3)²(5x − 2)', '(x + 3)(5x − 1)', '(x + 3)(6x + 1)'],
      answer: '(x + 3)(5x − 1)',
      correction: {
        steps: [
          [
            'E = (x + 3)(5x − 2) + (x + 3) × 1',
            'Le facteur commun est la parenthèse (x + 3). Dans le second terme, elle est seule : on l’écrit (x + 3) × 1, car multiplier par 1 ne change rien.',
          ],
          [
            'E = (x + 3)[(5x − 2) + 1]',
            'On écrit (x + 3) une seule fois. Dans le crochet, on place ce qui reste de chaque terme : (5x − 2), puis 1.',
          ],
          ['E = (x + 3)(5x − 1)', 'On réduit le crochet : 5x − 2 + 1 = 5x − 1.'],
        ],
        traps: [
          [
            '(x + 3)(5x − 2)',
            'le second terme a disparu. Or (x + 3) est égal à (x + 3) × 1 : une fois le facteur commun retiré, il reste 1, et non 0.',
          ],
          [
            '(x + 3)²(5x − 2)',
            'les deux termes ont été multipliés entre eux. Or E est une somme : le facteur commun ne s’écrit qu’une seule fois.',
          ],
          [
            '(x + 3)(6x + 1)',
            'dans le crochet, (x + 3) a été recopié à la place de 1 : (5x − 2) + (x + 3) = 6x + 1.',
          ],
        ],
        check:
          'on redéveloppe : (x + 3)(5x − 1) = 5x² + 14x − 3. L’expression de départ donne aussi 5x² + 13x − 6 + x + 3 = 5x² + 14x − 3.',
      },
    }),
    qcm({
      prompt: 'Factorise F = (2x + 1)(x + 4) − (2x + 1)(3x − 1).',
      choices: ['(2x + 1)(−2x + 5)', '(2x + 1)(−2x + 3)', '(2x + 1)(4x + 3)', '−4x² + 8x + 5'],
      answer: '(2x + 1)(−2x + 5)',
      correction: {
        steps: [
          [
            'F = (2x + 1)[(x + 4) − (3x − 1)]',
            'Le facteur commun est (2x + 1) : on l’écrit une seule fois. Dans le crochet, on place ce qui reste de chaque produit, en gardant le signe moins entre les deux.',
          ],
          [
            '(x + 4) − (3x − 1) = x + 4 − 3x + 1',
            'On supprime les parenthèses du crochet. La seconde est précédée d’un signe moins : chacun de ses termes change de signe. 3x devient −3x, et −1 devient +1.',
          ],
          ['x + 4 − 3x + 1 = −2x + 5', 'On réduit : x − 3x = −2x et 4 + 1 = 5.'],
          ['F = (2x + 1)(−2x + 5)', 'On remplace le crochet par sa forme réduite.'],
        ],
        traps: [
          [
            '(2x + 1)(−2x + 3)',
            'dans le crochet, seul 3x a changé de signe : −(3x − 1) = −3x + 1, et non −3x − 1.',
          ],
          [
            '(2x + 1)(4x + 3)',
            'les deux parenthèses ont été ajoutées au lieu d’être soustraites : (x + 4) + (3x − 1) = 4x + 3.',
          ],
          [
            '−4x² + 8x + 5',
            'cette expression est bien égale à F, mais c’est une somme : elle est développée, pas factorisée.',
          ],
        ],
        check:
          'on redéveloppe : (2x + 1)(−2x + 5) = −4x² + 8x + 5. L’expression de départ donne aussi 2x² + 9x + 4 − (6x² + x − 1) = −4x² + 8x + 5.',
      },
    }),
  ],
})

export const calculLitteral = [developper, factoriser]
