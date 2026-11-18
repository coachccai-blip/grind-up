import { defineExercise, exact, figure, paragraphs, qcm } from '../authoring.js'

/**
 * Équations. Trois exercices : résoudre une équation du premier degré, résoudre
 * une équation produit nul ou une équation x² = a, puis résoudre un problème en
 * le mettant en équation. Chaque correction écrit la solution sous la forme
 * « x = 4 » : le test des égalités vérifie alors chaque ligne avec cette valeur.
 */

const premierDegre = defineExercise({
  id: 'equations-du-premier-degre',
  title: 'Équations du premier degré',
  theme: 'equations',
  difficulty: 'medium',
  description:
    'Six équations à résoudre, de 7x = 56 à une équation dont la parenthèse suit un signe moins. Chaque correction isole x pas à pas, puis vérifie la solution. Réponses à saisir.',
  lesson: paragraphs(
    'Une **équation** est une égalité qui contient un nombre inconnu, noté x. La **résoudre**, c’est trouver toutes les valeurs de x pour lesquelles l’égalité est vraie : ce sont ses **solutions**. Ses deux **membres** sont les expressions écrites de part et d’autre du signe « = ».',
    'Deux règles transforment une équation sans changer ses solutions :',
    [
      '- on peut ajouter ou soustraire le même nombre aux deux membres ;',
      '- on peut multiplier ou diviser les deux membres par un même nombre non nul.',
    ].join('\n'),
    'Une équation est comme une balance en équilibre : elle le reste si l’on fait la même opération sur les deux plateaux.',
    figure(
      'equations-balance',
      'Deux balances en équilibre : 3x − 5 et 13 sur les plateaux, puis 3x et 18 une fois 5 ajouté de chaque côté.',
    ),
    'La méthode :',
    [
      '1. Développe et réduis chaque membre, s’il y a des parenthèses.',
      '2. Regroupe les termes en x dans un membre, et les nombres dans l’autre.',
      '3. Divise les deux membres par le coefficient de x.',
      '4. Vérifie : remplace x par ta solution dans l’équation de départ.',
    ].join('\n'),
    'Attention au signe moins devant une parenthèse : le nombre négatif multiplie chaque terme, avec son signe. Par exemple, −2(x − 5) = −2x + 10.',
  ),
  example: {
    statement: 'Résous l’équation 5(x − 1) = 2x + 13.',
    steps: [
      [
        '5x − 5 = 2x + 13',
        'On développe le membre de gauche. Le facteur 5 multiplie chaque terme de la parenthèse : 5 × x = 5x et 5 × 1 = 5.',
      ],
      [
        '5x − 2x − 5 = 13',
        'On regroupe les termes en x à gauche. Pour faire disparaître 2x du membre de droite, on soustrait 2x aux deux membres.',
      ],
      ['3x − 5 = 13', 'On réduit le membre de gauche : 5x − 2x = 3x.'],
      [
        '3x = 13 + 5 = 18',
        'On regroupe les nombres à droite : on ajoute 5 aux deux membres. À gauche, −5 + 5 = 0, il ne reste que 3x.',
      ],
      [
        'x = 18 ÷ 3 = 6',
        'L’inconnue est multipliée par 3 : pour l’isoler, on divise les deux membres par 3.',
      ],
    ],
    conclusion:
      'La solution est 6. On vérifie dans l’équation de départ : 5 × (6 − 1) = 25 et 2 × 6 + 13 = 25. Les deux membres sont égaux.',
  },
  intro:
    'Pour chaque équation, écris seulement la valeur de x, sans « x = ». Si ce n’est pas un nombre entier, écris-la avec une virgule : par exemple 2,5.',
  questions: [
    exact({
      prompt: 'Résous l’équation 7x = 56. Écris la valeur de x.',
      answers: ['8'],
      correction: {
        steps: [
          [
            '7x = 56',
            '7x veut dire 7 × x : l’inconnue est multipliée par 7. Pour l’isoler, on fait l’opération inverse, une division.',
          ],
          [
            'x = 56 ÷ 7',
            'On divise les deux membres par 7, un nombre non nul : les solutions ne changent pas.',
          ],
          ['x = 8', 'On calcule 56 ÷ 7 = 8. La solution est 8.'],
        ],
        mistake:
          'soustraire 7 au lieu de diviser par 7. Dans 7x, le nombre 7 multiplie x : seule une division permet d’isoler x.',
        check: 'on remplace x par 8 dans l’équation de départ : 7 × 8 = 56. L’égalité est vraie.',
      },
    }),
    exact({
      prompt: 'Résous l’équation 3x + 5 = 26. Écris la valeur de x.',
      answers: ['7'],
      correction: {
        steps: [
          [
            '3x + 5 = 26',
            'L’inconnue est multipliée par 3, puis on ajoute 5. On défait ces opérations en commençant par la dernière : l’addition.',
          ],
          ['3x = 26 − 5 = 21', 'On soustrait 5 aux deux membres : à gauche, il ne reste que 3x.'],
          ['x = 21 ÷ 3 = 7', 'On divise les deux membres par 3. La solution est 7.'],
        ],
        mistake:
          'diviser par 3 avant d’avoir soustrait 5. Il faudrait alors diviser aussi le 5 : on enlève d’abord le terme ajouté, on divise ensuite.',
        check:
          'on remplace x par 7 dans l’équation de départ : 3 × 7 + 5 = 21 + 5 = 26. L’égalité est vraie.',
      },
    }),
    exact({
      prompt: 'Résous l’équation 5x + 8 = 2x − 7. Écris la valeur de x.',
      answers: ['−5'],
      correction: {
        steps: [
          [
            '5x − 2x + 8 = −7',
            'L’inconnue figure dans les deux membres. On soustrait 2x aux deux membres : il n’y a plus de x à droite.',
          ],
          ['3x + 8 = −7', 'On réduit le membre de gauche : 5x − 2x = 3x.'],
          [
            '3x = −7 − 8 = −15',
            'On soustrait 8 aux deux membres. Attention au signe : on retranche 8 à un nombre déjà négatif, on s’éloigne donc encore de zéro.',
          ],
          [
            'x = −15 ÷ 3 = −5',
            'On divise les deux membres par 3. Le quotient d’un nombre négatif par un nombre positif est négatif : la solution est −5.',
          ],
        ],
        mistake:
          'changer un terme de membre sans changer son signe, et écrire 5x + 2x. Pour enlever 2x du membre de droite, on le soustrait aux deux membres : à gauche, on obtient 5x − 2x.',
        check:
          'on remplace x par −5 dans l’équation de départ. À gauche : 5 × (−5) + 8 = −25 + 8 = −17. À droite : 2 × (−5) − 7 = −10 − 7 = −17. Les deux membres sont égaux.',
      },
    }),
    exact({
      prompt: 'Résous l’équation 2(3x − 5) = 4x + 3. Écris la valeur de x, en écriture décimale.',
      answers: ['6,5', '13/2'],
      correction: {
        steps: [
          [
            '6x − 10 = 4x + 3',
            'On développe le membre de gauche. Le facteur 2 multiplie les deux termes de la parenthèse : 2 × 3x = 6x et 2 × 5 = 10.',
          ],
          [
            '6x − 4x = 3 + 10',
            'On soustrait 4x aux deux membres, puis on ajoute 10 aux deux membres : les termes en x sont à gauche, les nombres à droite.',
          ],
          ['2x = 13', 'On réduit chaque membre.'],
          [
            'x = 13 ÷ 2 = 6,5',
            'On divise les deux membres par 2. La solution n’est pas un nombre entier : c’est 6,5.',
          ],
        ],
        mistake:
          'ne multiplier que le premier terme de la parenthèse, et écrire 6x − 5. Le facteur 2 multiplie chaque terme : 2(3x − 5) = 6x − 10.',
        check:
          'on remplace x par 6,5 dans l’équation de départ. À gauche : 2 × (3 × 6,5 − 5) = 2 × 14,5 = 29. À droite : 4 × 6,5 + 3 = 26 + 3 = 29. Les deux membres sont égaux.',
      },
    }),
    exact({
      prompt: 'Résous l’équation 0,5x + 3 = 0,2x + 9. Écris la valeur de x.',
      answers: ['20'],
      correction: {
        steps: [
          [
            '0,5x − 0,2x = 9 − 3',
            'Les coefficients sont des nombres décimaux, mais la méthode ne change pas. On soustrait 0,2x aux deux membres, puis on soustrait 3 aux deux membres.',
          ],
          ['0,3x = 6', 'On réduit chaque membre : 0,5x − 0,2x = 0,3x.'],
          [
            'x = 6 ÷ 0,3 = 20',
            'On divise les deux membres par 0,3. Diviser 6 par 0,3 revient à diviser 60 par 3 : la solution est 20.',
          ],
        ],
        mistake:
          'diviser par 3 au lieu de 0,3, et répondre 2. Le coefficient de x est 0,3 : on calcule 6 ÷ 0,3 = 20. Pour éviter les virgules, on peut d’abord multiplier les deux membres par 10 : on obtient 5x + 30 = 2x + 90.',
        check:
          'on remplace x par 20 dans l’équation de départ. À gauche : 0,5 × 20 + 3 = 10 + 3 = 13. À droite : 0,2 × 20 + 9 = 4 + 9 = 13. Les deux membres sont égaux.',
      },
    }),
    exact({
      prompt: 'Résous l’équation 10 − 3(x − 2) = x − 4. Écris la valeur de x.',
      answers: ['5'],
      correction: {
        steps: [
          [
            '10 − 3x + 6 = x − 4',
            'La multiplication est prioritaire : on ne calcule pas 10 − 3. On développe en distribuant −3 aux deux termes de la parenthèse : −3 × x = −3x et −3 × (−2) = 6.',
          ],
          ['16 − 3x = x − 4', 'On réduit le membre de gauche : 10 + 6 = 16.'],
          [
            '−3x − x = −4 − 16',
            'On soustrait x aux deux membres, puis on soustrait 16 aux deux membres.',
          ],
          ['−4x = −20', 'On réduit chaque membre. Le coefficient de x est négatif.'],
          [
            'x = −20 ÷ (−4) = 5',
            'On divise les deux membres par −4. Le quotient de deux nombres négatifs est positif : la solution est 5.',
          ],
        ],
        mistake:
          'oublier que le signe moins porte sur toute la parenthèse, et écrire 10 − 3x − 6. Le produit de deux nombres négatifs est positif : −3 × (−2) = 6.',
        check:
          'on remplace x par 5 dans l’équation de départ. À gauche : 10 − 3 × (5 − 2) = 10 − 3 × 3 = 1. À droite : 5 − 4 = 1. Les deux membres sont égaux.',
      },
    }),
  ],
})

const produitNul = defineExercise({
  id: 'equations-produit-nul',
  title: 'Équations produit nul et équations x² = a',
  theme: 'equations',
  difficulty: 'medium',
  description:
    'Résoudre une équation produit nul, une équation x² = a, puis une équation à factoriser par un facteur commun. Les mauvais choix : solution oubliée, signes inversés, division par x.',
  lesson: paragraphs(
    '**Équation produit nul.** Un produit est nul si, et seulement si, l’un au moins de ses facteurs est nul. Pour résoudre (ax + b)(cx + d) = 0, tu résous donc deux équations du premier degré : ax + b = 0, puis cx + d = 0. Les solutions s’écrivent avec « ou ».',
    figure(
      'equations-produit-nul-schema',
      'Schéma : si le produit A × B est nul, alors A est nul ou B est nul.',
    ),
    '**Équation x² = a.** Le nombre de solutions dépend du signe de a :',
    [
      '- si a > 0, deux solutions opposées : √a et −√a. Ainsi, les solutions de x² = 9 sont 3 et −3 ;',
      '- si a = 0, une seule solution : 0 ;',
      '- si a < 0, aucune solution, car un carré n’est jamais négatif.',
    ].join('\n'),
    figure(
      'equations-carre-deux-solutions',
      'Une droite graduée : 3 et −3, à 3 unités de 0 de part et d’autre, ont tous deux pour carré 9.',
    ),
    '**Si le membre de gauche n’est pas un produit.** Il te faut d’abord un produit nul : regroupe tous les termes dans le membre de gauche, pour que celui de droite soit 0, puis factorise. Par exemple, x² − 5x = x(x − 5) : x est un facteur commun aux deux termes.',
  ),
  example: [
    {
      statement: 'Résous l’équation (x − 5)(2x + 6) = 0.',
      steps: [
        [
          'x − 5 = 0 ou 2x + 6 = 0',
          'Le membre de gauche est un produit de deux facteurs, et le membre de droite est 0. On ne développe pas : un produit est nul si, et seulement si, l’un de ses facteurs est nul.',
        ],
        [
          'x = 5 ou 2x = −6',
          'On résout chaque équation. On ajoute 5 aux deux membres de la première, on soustrait 6 aux deux membres de la seconde.',
        ],
        [
          'x = 5 ou x = −3',
          'On divise par 2 les deux membres de la seconde équation : −6 ÷ 2 = −3.',
        ],
      ],
      conclusion:
        'L’équation a deux solutions : 5 et −3. On vérifie : pour x = 5, le premier facteur vaut 5 − 5 = 0 ; pour x = −3, le second vaut 2 × (−3) + 6 = 0.',
    },
    {
      statement: 'Résous l’équation x² + 11x = 0.',
      steps: [
        [
          'x(x + 11) = 0',
          'Le membre de gauche est une somme : pour obtenir un produit, on factorise. Le facteur commun aux deux termes est x, car x² = x × x et 11x = x × 11.',
        ],
        [
          'x = 0 ou x + 11 = 0',
          'On a maintenant un produit nul : l’un des deux facteurs, x ou x + 11, est nul.',
        ],
        ['x = 0 ou x = −11', 'On soustrait 11 aux deux membres de la seconde équation.'],
      ],
      conclusion:
        'L’équation a deux solutions : 0 et −11. Attention : diviser les deux membres par x ferait perdre la solution 0.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Résous l’équation (x − 4)(x + 7) = 0.',
      choices: ['x = −4 ou x = 7', 'x = 4', 'x = 4 ou x = −7', 'x = 4 ou x = 7'],
      answer: 'x = 4 ou x = −7',
      correction: {
        steps: [
          [
            'x − 4 = 0 ou x + 7 = 0',
            'Le membre de gauche est un produit, celui de droite est 0. Un produit est nul si, et seulement si, l’un de ses facteurs est nul : on écrit une équation par facteur.',
          ],
          [
            'x = 4 ou x = −7',
            'On ajoute 4 aux deux membres de la première équation, on soustrait 7 aux deux membres de la seconde. L’équation a deux solutions : 4 et −7.',
          ],
        ],
        traps: [
          [
            'x = −4 ou x = 7',
            'les signes sont inversés. On ne recopie pas les nombres des parenthèses : x − 4 = 0 donne x = 4, et x + 7 = 0 donne x = −7.',
          ],
          [
            'x = 4',
            'il manque une solution. Le second facteur peut être nul, lui aussi : x + 7 = 0 donne x = −7.',
          ],
          [
            'x = 4 ou x = 7',
            'la seconde solution a le mauvais signe. Pour x = 7, le facteur x + 7 vaut 14, et non 0.',
          ],
        ],
        check:
          'pour x = 4, le premier facteur vaut 4 − 4 = 0. Pour x = −7, le second facteur vaut −7 + 7 = 0. Dans les deux cas, le produit est nul.',
      },
    }),
    qcm({
      prompt: 'Résous l’équation (3x + 12)(2x − 5) = 0.',
      choices: ['x = −12 ou x = 5', 'x = −4 ou x = 2,5', 'x = 4 ou x = −2,5', 'x = −4 ou x = 0,4'],
      answer: 'x = −4 ou x = 2,5',
      correction: {
        steps: [
          [
            '3x + 12 = 0 ou 2x − 5 = 0',
            'Un produit est nul si, et seulement si, l’un de ses facteurs est nul. On obtient deux équations du premier degré.',
          ],
          [
            '3x = −12 ou 2x = 5',
            'On isole le terme en x : on soustrait 12 aux deux membres de la première équation, on ajoute 5 aux deux membres de la seconde.',
          ],
          [
            'x = −4 ou x = 2,5',
            'On divise par le coefficient de x : −12 ÷ 3 = −4 et 5 ÷ 2 = 2,5. L’équation a deux solutions : −4 et 2,5.',
          ],
        ],
        traps: [
          [
            'x = −12 ou x = 5',
            'la résolution n’est pas terminée. Les nombres −12 et 5 sont les valeurs de 3x et de 2x : il reste à diviser par 3 et par 2.',
          ],
          [
            'x = 4 ou x = −2,5',
            'les signes sont inversés. En effet, 3x + 12 = 0 donne 3x = −12, et 2x − 5 = 0 donne 2x = 5.',
          ],
          [
            'x = −4 ou x = 0,4',
            'le second quotient est inversé. L’équation 2x = 5 donne x = 5 ÷ 2, et non 2 ÷ 5.',
          ],
        ],
        check:
          'pour x = −4, le premier facteur vaut 3 × (−4) + 12 = 0. Pour x = 2,5, le second facteur vaut 2 × 2,5 − 5 = 0.',
      },
    }),
    qcm({
      prompt: 'Résous l’équation x² = 49.',
      choices: ['x = 7', 'x = 49 ou x = −49', 'x = 24,5 ou x = −24,5', 'x = 7 ou x = −7'],
      answer: 'x = 7 ou x = −7',
      correction: {
        steps: [
          [
            'x² = 49',
            'L’équation est de la forme x² = a, avec a = 49. Comme 49 est positif, elle a deux solutions opposées : √49 et −√49.',
          ],
          [
            '√49 = 7',
            'On cherche le nombre positif dont le carré est 49 : c’est 7, car 7 × 7 = 49.',
          ],
          ['x = 7 ou x = −7', 'Les deux solutions sont 7 et son opposé, −7.'],
        ],
        traps: [
          [
            'x = 7',
            'il manque la solution négative. Le carré d’un nombre négatif est positif : (−7)² = 49.',
          ],
          [
            'x = 49 ou x = −49',
            'la racine carrée est oubliée. Le carré de 49 est 2 401, et non 49.',
          ],
          [
            'x = 24,5 ou x = −24,5',
            'le nombre 49 a été divisé par 2. Or x² est le produit x × x, et non le double de x.',
          ],
        ],
        check: '7² = 49 et (−7)² = 49 : les deux nombres ont bien pour carré 49.',
      },
    }),
    qcm({
      prompt: 'Résous l’équation x² = −16.',
      choices: ['x = 4 ou x = −4', 'Aucune solution', 'x = −4', 'x = −8'],
      answer: 'Aucune solution',
      correction: {
        steps: [
          [
            'x² est positif ou nul',
            'Le membre de gauche est le carré d’un nombre. Que ce nombre soit positif ou négatif, son carré est positif ou nul : par exemple, 4² = 16 et (−4)² = 16.',
          ],
          [
            '−16 est négatif',
            'L’équation est de la forme x² = a, avec a négatif. Or un carré ne peut pas être égal à un nombre négatif.',
          ],
          ['Aucune solution', 'Aucun nombre n’a pour carré −16 : l’équation n’a pas de solution.'],
        ],
        traps: [
          [
            'x = 4 ou x = −4',
            'le signe moins de −16 est oublié. Les nombres 4 et −4 ont pour carré 16 : ce sont les solutions de x² = 16.',
          ],
          [
            'x = −4',
            'mettre un signe moins devant la solution ne rend pas son carré négatif : (−4)² = 16. Attention à la calculatrice : sans les parenthèses, elle calcule l’opposé de 4², soit −16, et non le carré de −4.',
          ],
          [
            'x = −8',
            'c’est la solution de 2x = −16. Or x² est le produit x × x, et non le double de x.',
          ],
        ],
        check:
          'un carré est le produit d’un nombre par lui-même, donc de deux nombres de même signe : il est positif ou nul. Par exemple, 4² = 16, (−4)² = 16 et 0² = 0.',
      },
    }),
    qcm({
      prompt: 'Résous l’équation x² − 8x = 0.',
      choices: ['x = 0 ou x = 8', 'x = 8', 'x = 0 ou x = −8', 'x = 0'],
      answer: 'x = 0 ou x = 8',
      correction: {
        steps: [
          [
            'x(x − 8) = 0',
            'Le membre de droite est 0, mais le membre de gauche est une différence : on le factorise. Le facteur commun aux deux termes est x, car x² = x × x et 8x = x × 8.',
          ],
          [
            'x = 0 ou x − 8 = 0',
            'On a maintenant un produit nul : l’un des deux facteurs, x ou x − 8, est nul.',
          ],
          [
            'x = 0 ou x = 8',
            'On ajoute 8 aux deux membres de la seconde équation. L’équation a deux solutions : 0 et 8.',
          ],
        ],
        traps: [
          [
            'x = 8',
            'il manque la solution 0. C’est ce qui arrive quand on divise les deux membres par x : on obtient x − 8 = 0, et la solution 0 disparaît. On ne divise jamais par un nombre qui peut être nul.',
          ],
          [
            'x = 0 ou x = −8',
            'le second facteur est x − 8, et non x + 8. L’équation x − 8 = 0 donne x = 8.',
          ],
          ['x = 0', 'il manque la solution du second facteur. L’équation x − 8 = 0 donne x = 8.'],
        ],
        check: 'pour x = 0 : 0² − 8 × 0 = 0. Pour x = 8 : 8² − 8 × 8 = 64 − 64 = 0.',
      },
    }),
    qcm({
      prompt: 'Résous l’équation 3x² = 12x.',
      choices: ['x = 4', 'x = 0 ou x = −4', 'x = 0 ou x = 4', 'x = 3 ou x = 4'],
      answer: 'x = 0 ou x = 4',
      correction: {
        steps: [
          [
            '3x² − 12x = 0',
            'L’inconnue figure dans les deux membres. On soustrait 12x aux deux membres : le membre de droite devient 0.',
          ],
          [
            '3x(x − 4) = 0',
            'On factorise le membre de gauche. Le facteur commun aux deux termes est 3x, car 3x² = 3x × x et 12x = 3x × 4.',
          ],
          [
            '3x = 0 ou x − 4 = 0',
            'Un produit est nul si, et seulement si, l’un de ses facteurs est nul.',
          ],
          [
            'x = 0 ou x = 4',
            'On divise par 3 les deux membres de la première équation : 0 ÷ 3 = 0. On ajoute 4 aux deux membres de la seconde. L’équation a deux solutions : 0 et 4. On peut aussi factoriser par x seul, x(3x − 12) = 0, ou diviser d’abord les deux membres par 3, qui n’est pas nul ; jamais par x, qui peut l’être.',
          ],
        ],
        traps: [
          [
            'x = 4',
            'il manque la solution 0. C’est ce qui arrive quand on divise les deux membres par x : on obtient 3x = 12, et la solution 0 disparaît. On ne divise jamais par un nombre qui peut être nul.',
          ],
          [
            'x = 0 ou x = −4',
            '12x a changé de membre sans changer de signe : on a écrit 3x² + 12x au lieu de 3x² − 12x, d’où le facteur x + 4. On soustrait 12x aux deux membres : le second facteur est x − 4, qui s’annule pour x = 4.',
          ],
          [
            'x = 3 ou x = 4',
            'le facteur 3x est nul quand x = 0, et non quand x = 3. Pour x = 3, il vaut 3 × 3 = 9.',
          ],
        ],
        check: 'pour x = 0 : 3 × 0² = 0 et 12 × 0 = 0. Pour x = 4 : 3 × 4² = 48 et 12 × 4 = 48.',
      },
    }),
  ],
})

const problemes = defineExercise({
  id: 'problemes-mise-en-equation',
  title: 'Résoudre un problème avec une équation',
  theme: 'equations',
  difficulty: 'hard',
  description:
    'Six problèmes à mettre en équation : nombres consécutifs, périmètre, tarifs, partage, programmes de calcul, âges. La méthode en quatre étapes, du choix de l’inconnue à la phrase de conclusion. Réponses à saisir.',
  lesson: paragraphs(
    'Pour résoudre un problème avec une équation, suis toujours ces quatre étapes :',
    [
      '1. **Choisis l’inconnue.** Appelle x un nombre que tu ne connais pas, souvent celui qu’on te demande, et écris ce qu’il représente.',
      '2. **Mets le problème en équation.** Traduis l’énoncé par une égalité qui contient x.',
      '3. **Résous l’équation.**',
      '4. **Vérifie et conclus.** Contrôle que la solution convient dans l’énoncé, puis réponds à la question par une phrase.',
    ].join('\n'),
    'Quelques traductions utiles :',
    [
      '- le double de x s’écrit 2x, son triple 3x ;',
      '- « 5 de plus que x » s’écrit x + 5 ;',
      '- trois nombres entiers consécutifs s’écrivent x, x + 1 et x + 2 ;',
      '- le périmètre d’un rectangle est 2 × (longueur + largeur).',
    ].join('\n'),
    'Attention : l’inconnue n’est pas toujours la réponse. Relis la question avant de conclure.',
  ),
  example: {
    statement:
      'Au cinéma, une place adulte coûte 4 € de plus qu’une place enfant. Pour 2 adultes et 3 enfants, une famille paie 43 €. Quel est le prix d’une place enfant ?',
    figure: {
      id: 'problemes-exemple-cinema',
      alt: 'Deux places adulte et trois places enfant, 43 € en tout ; une place adulte coûte 4 € de plus.',
    },
    steps: [
      [
        'x désigne le prix d’une place enfant, en euros',
        'Étape 1 : on choisit l’inconnue, ici le nombre demandé. Une place adulte coûte 4 € de plus : son prix est x + 4.',
      ],
      [
        '2(x + 4) + 3x = 43',
        'Étape 2 : on traduit l’énoncé. Les 2 adultes paient 2(x + 4), les 3 enfants paient 3x, et le total est 43.',
      ],
      [
        '2x + 8 + 3x = 43',
        'Étape 3 : on résout l’équation. On développe d’abord : 2(x + 4) = 2x + 8.',
      ],
      ['5x + 8 = 43', 'On réduit le membre de gauche : 2x + 3x = 5x.'],
      ['5x = 43 − 8 = 35', 'On soustrait 8 aux deux membres.'],
      ['x = 35 ÷ 5 = 7', 'On divise les deux membres par 5.'],
    ],
    conclusion:
      'Étape 4 : on vérifie dans l’énoncé. Une place adulte coûte 7 + 4 = 11, et 2 × 11 + 3 × 7 = 22 + 21 = 43. Une place enfant coûte donc 7 €.',
  },
  questions: [
    exact({
      prompt:
        'La somme de trois nombres entiers consécutifs est 114. Quel est le plus petit de ces trois nombres ?',
      figure: {
        id: 'problemes-nombres-consecutifs',
        alt: 'Trois cases qui se suivent de 1 en 1, de somme 114 ; la première, la plus petite, est cherchée.',
      },
      answers: ['37'],
      correction: {
        steps: [
          [
            'x désigne le plus petit des trois nombres',
            'On choisit l’inconnue : c’est le nombre demandé. Des entiers consécutifs se suivent de 1 en 1 : les deux autres sont x + 1 et x + 2.',
          ],
          [
            'x + (x + 1) + (x + 2) = 114',
            'On traduit l’énoncé : la somme des trois nombres est 114.',
          ],
          ['3x + 3 = 114', 'On réduit le membre de gauche : il y a 3 fois x, et 1 + 2 = 3.'],
          ['3x = 114 − 3 = 111', 'On soustrait 3 aux deux membres.'],
          [
            'x = 111 ÷ 3 = 37',
            'On divise les deux membres par 3. Le plus petit des trois nombres est 37.',
          ],
        ],
        mistake:
          'répondre 38. C’est 114 ÷ 3, le nombre du milieu : le plus petit est 38 − 1 = 37. Autre erreur : noter les trois nombres x, 2x et 3x. « Consécutifs » veut dire qu’on ajoute 1 pour passer au nombre suivant, et non qu’on multiplie.',
        check: 'les trois nombres sont 37, 38 et 39, et leur somme est 37 + 38 + 39 = 114.',
      },
    }),
    exact({
      prompt:
        'Un rectangle a un périmètre de 54 cm. Sa longueur mesure 7 cm de plus que sa largeur. Calcule sa longueur, en cm.',
      figure: {
        id: 'problemes-rectangle-perimetre',
        alt: 'Un rectangle de périmètre 54 cm ; sa longueur, cherchée, vaut la largeur plus 7 cm.',
      },
      answers: ['17'],
      correction: {
        steps: [
          [
            'x désigne la largeur du rectangle, en cm',
            'On choisit l’inconnue. La longueur mesure 7 cm de plus que la largeur : elle s’écrit x + 7.',
          ],
          [
            '2 × (x + x + 7) = 54',
            'On traduit l’énoncé : le périmètre d’un rectangle est 2 × (longueur + largeur).',
          ],
          [
            '4x + 14 = 54',
            'On réduit dans la parenthèse, x + x + 7 = 2x + 7, puis on développe : 2 × 2x = 4x et 2 × 7 = 14.',
          ],
          ['4x = 54 − 14 = 40', 'On soustrait 14 aux deux membres.'],
          ['x = 40 ÷ 4 = 10', 'On divise les deux membres par 4 : la largeur mesure 10 cm.'],
          [
            '10 + 7 = 17',
            'On répond à la question posée, qui porte sur la longueur : elle mesure 17 cm.',
          ],
        ],
        mistake:
          'répondre 10, la valeur de x. L’inconnue choisie est la largeur, mais la question demande la longueur : on relit toujours l’énoncé avant de conclure.',
        check:
          'avec une largeur de 10 cm et une longueur de 17 cm, le périmètre est 2 × (10 + 17) = 2 × 27 = 54.',
      },
    }),
    exact({
      prompt:
        'Une salle d’escalade propose deux tarifs. Tarif A : 11 € la séance. Tarif B : un abonnement annuel de 60 €, puis 6 € la séance. Pour combien de séances dans l’année les deux tarifs coûtent-ils le même prix ?',
      figure: {
        id: 'problemes-deux-tarifs',
        alt: 'Deux cartes : tarif A, 11 € la séance ; tarif B, 60 € par an plus 6 € la séance.',
      },
      answers: ['12'],
      correction: {
        steps: [
          [
            'x désigne le nombre de séances dans l’année',
            'On choisit l’inconnue : c’est le nombre demandé.',
          ],
          [
            '11x = 60 + 6x',
            'On traduit l’énoncé. Avec le tarif A, x séances coûtent 11x. Avec le tarif B, on paie 60 une seule fois, puis 6 par séance, soit 60 + 6x. On veut le même prix.',
          ],
          [
            '11x − 6x = 60',
            'On soustrait 6x aux deux membres pour regrouper les termes en x à gauche.',
          ],
          ['5x = 60', 'On réduit le membre de gauche : 11x − 6x = 5x.'],
          [
            'x = 60 ÷ 5 = 12',
            'On divise les deux membres par 5. Les deux tarifs coûtent le même prix pour 12 séances. Au-delà, le tarif B est le plus avantageux.',
          ],
        ],
        mistake:
          'multiplier aussi l’abonnement par le nombre de séances, et écrire 66x. L’abonnement de 60 € se paie une seule fois : il s’ajoute, il ne se multiplie pas.',
        check:
          'pour 12 séances, le tarif A coûte 11 × 12 = 132 et le tarif B coûte 60 + 6 × 12 = 60 + 72 = 132, soit 132 € dans les deux cas.',
      },
    }),
    exact({
      prompt:
        'Trois amis se partagent 150 €. Bilal reçoit 10 € de plus qu’Anaïs, et Chloé reçoit le double de la part d’Anaïs. Combien Chloé reçoit-elle, en euros ?',
      figure: {
        id: 'problemes-partage',
        alt: 'Trois barres : la part d’Anaïs, la même plus 10 € pour Bilal, le double pour Chloé ; 150 € en tout.',
      },
      answers: ['70'],
      correction: {
        steps: [
          [
            'x désigne la part d’Anaïs, en euros',
            'On choisit comme inconnue la part à partir de laquelle les deux autres s’écrivent : Bilal reçoit x + 10 et Chloé reçoit 2x.',
          ],
          ['x + (x + 10) + 2x = 150', 'On traduit l’énoncé : la somme des trois parts est 150.'],
          ['4x + 10 = 150', 'On réduit le membre de gauche : x + x + 2x = 4x.'],
          ['4x = 150 − 10 = 140', 'On soustrait 10 aux deux membres.'],
          ['x = 140 ÷ 4 = 35', 'On divise les deux membres par 4 : Anaïs reçoit 35 €.'],
          [
            '2 × 35 = 70',
            'On répond à la question posée : Chloé reçoit le double de la part d’Anaïs, soit 70 €.',
          ],
        ],
        mistake:
          's’arrêter à x = 35. C’est la part d’Anaïs, alors que la question porte sur celle de Chloé, qui vaut 2x.',
        check:
          'les parts sont 35 € pour Anaïs, 45 € pour Bilal et 70 € pour Chloé, et leur somme est 35 + 45 + 70 = 150.',
      },
    }),
    exact({
      prompt:
        'Programme A : choisir un nombre, le multiplier par 5, puis soustraire 3. Programme B : choisir un nombre, lui ajouter 6, puis multiplier le résultat par 2. On applique les deux programmes au même nombre de départ. Quel doit être ce nombre pour que les deux résultats soient égaux ?',
      figure: {
        id: 'problemes-deux-programmes',
        alt: 'Les programmes A (× 5, puis − 3) et B (+ 6, puis × 2), partant du même nombre inconnu.',
      },
      answers: ['5'],
      correction: {
        steps: [
          [
            'x désigne le nombre choisi au départ',
            'On choisit l’inconnue : c’est le nombre demandé.',
          ],
          [
            '5x − 3 = 2(x + 6)',
            'On traduit chaque programme. Le programme A donne 5x − 3. Le programme B ajoute 6 avant de multiplier par 2 : il faut des parenthèses, et il donne 2(x + 6).',
          ],
          ['5x − 3 = 2x + 12', 'On développe le membre de droite : 2 × x = 2x et 2 × 6 = 12.'],
          [
            '5x − 2x = 12 + 3',
            'On soustrait 2x aux deux membres, puis on ajoute 3 aux deux membres.',
          ],
          ['3x = 15', 'On réduit chaque membre.'],
          ['x = 15 ÷ 3 = 5', 'On divise les deux membres par 3. Le nombre de départ doit être 5.'],
        ],
        mistake:
          'traduire le programme B par x + 6 × 2. Sans parenthèses, seul le nombre 6 serait multiplié par 2, alors que le programme multiplie tout le résultat x + 6.',
        check:
          'avec le nombre 5, le programme A donne 5 × 5 − 3 = 22 et le programme B donne (5 + 6) × 2 = 22.',
      },
    }),
    exact({
      prompt:
        'Aujourd’hui, Nadia a 12 ans et sa mère a 40 ans. Dans combien d’années l’âge de sa mère sera-t-il le double de l’âge de Nadia ?',
      figure: {
        id: 'problemes-ages-frise',
        alt: 'Une frise : aujourd’hui Nadia a 12 ans et sa mère 40 ans ; plus tard, la mère aura le double.',
      },
      answers: ['16'],
      correction: {
        steps: [
          [
            'x désigne le nombre d’années à attendre',
            'On choisit l’inconnue : c’est le nombre demandé. Dans x années, chacune aura x années de plus : Nadia aura 12 + x ans et sa mère 40 + x ans.',
          ],
          [
            '40 + x = 2(12 + x)',
            'On traduit l’énoncé : l’âge de la mère sera le double de l’âge de Nadia.',
          ],
          ['40 + x = 24 + 2x', 'On développe le membre de droite : 2 × 12 = 24 et 2 × x = 2x.'],
          [
            '40 − 24 = 2x − x',
            'On soustrait x aux deux membres, puis on soustrait 24 aux deux membres : les termes en x sont à droite, les nombres à gauche.',
          ],
          [
            'x = 16',
            'On réduit chaque membre : 40 − 24 = 16 et 2x − x = x. Il faut attendre 16 ans.',
          ],
        ],
        mistake:
          'n’ajouter x qu’à un seul des deux âges. Les deux personnes vieillissent en même temps : dans x années, chacune aura x années de plus.',
        check:
          'dans 16 ans, Nadia aura 12 + 16 = 28 ans et sa mère 40 + 16 = 56 ans. On a bien 2 × 28 = 56.',
      },
    }),
  ],
})

export const equations = [premierDegre, produitNul, problemes]
