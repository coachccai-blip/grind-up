import { defineExercise, figure, paragraphs, qcm } from '../authoring.js'

/**
 * Algorithmique. Les programmes de calcul et les scripts sont écrits en toutes
 * lettres dans l'énoncé, entre guillemets : chaque phrase est une instruction.
 */

const programmesDeCalcul = defineExercise({
  id: 'programmes-de-calcul',
  title: 'Programmes de calcul',
  theme: 'algorithmique',
  difficulty: 'medium',
  description:
    'Six questions : appliquer un programme de calcul à un nombre positif ou négatif, exprimer son résultat en fonction de x, retrouver le nombre de départ, puis comparer deux programmes et prouver.',
  lesson: paragraphs(
    'Un **programme de calcul** est une suite d’instructions à appliquer dans l’ordre, à partir d’un nombre de départ. Chaque instruction s’applique au résultat de la précédente.',
    'Le vocabulaire : le double d’un nombre est son produit par 2, le triple son produit par 3, le carré son produit par lui-même. Retrancher, c’est soustraire.',
    [
      '- **Appliquer le programme à un nombre** : on calcule étape par étape. Un nombre négatif s’écrit entre parenthèses : (−3)² = 9.',
      '- **Exprimer le résultat en fonction de x** : on note x le nombre de départ et on écrit chaque étape, en mettant le résultat précédent entre parenthèses. Puis on développe et on réduit.',
      '- **Retrouver le nombre de départ** : on résout une équation, ou on remonte le programme en défaisant chaque instruction par l’opération inverse, de la dernière à la première. Remonter n’est possible que si le nombre de départ ne sert qu’une fois.',
      '- **Prouver** qu’un résultat est vrai pour tous les nombres : on calcule avec x. Des essais, même nombreux, ne prouvent rien.',
    ].join('\n'),
    figure(
      'programmes-calcul-remonter',
      'Le programme × 4 puis − 5 mène de 7 à 23 ; on le remonte de 23 à 7 avec + 5 puis ÷ 4.',
    ),
  ),
  example: [
    {
      statement:
        'Voici un programme de calcul : « Choisis un nombre. Ajoute 3. Multiplie le résultat par 2. Retranche le double du nombre de départ. » Applique-le au nombre 5, puis prouve qu’il donne le même résultat pour tous les nombres.',
      figure: {
        id: 'programmes-calcul-exemple',
        alt: 'La chaîne du programme appliqué à 5 : 8 après + 3, 16 après × 2, 6 à la fin.',
      },
      steps: [
        [
          '5 + 3 = 8',
          'On part de 5 et on suit les instructions dans l’ordre. D’abord, on ajoute 3.',
        ],
        ['8 × 2 = 16', 'On multiplie par 2 le résultat précédent, 8, et non le nombre de départ.'],
        [
          '16 − 2 × 5 = 16 − 10 = 6',
          'Le double du nombre de départ est 2 × 5 = 10 : on le retranche. Avec 5, le programme donne 6.',
        ],
        [
          '(x + 3) × 2 − 2x',
          'Pour prouver, on recommence avec un nombre quelconque, noté x. Les parenthèses sont indispensables : c’est toute la somme x + 3 qui est multipliée par 2.',
        ],
        [
          '(x + 3) × 2 − 2x = 2x + 6 − 2x = 6',
          'On développe, puis on réduit : 2x − 2x = 0. Il ne reste plus de x dans le résultat.',
        ],
      ],
      conclusion:
        'Avec 5, on obtient 6. Et comme le résultat ne dépend pas de x, le programme donne 6 quel que soit le nombre de départ.',
    },
    {
      statement:
        'Voici un autre programme : « Choisis un nombre. Multiplie-le par 4. Retranche 5. » Il donne 23. Quel était le nombre de départ ?',
      steps: [
        [
          '4x − 5 = 23',
          'On note x le nombre de départ. Le programme donne 4x − 5, et on sait que ce résultat vaut 23 : on obtient une équation.',
        ],
        ['4x = 28', 'On ajoute 5 aux deux membres : 23 + 5 = 28.'],
        ['x = 28 ÷ 4 = 7', 'On divise les deux membres par 4.'],
        [
          '23 + 5 = 28, puis 28 ÷ 4 = 7',
          'Autre méthode : on remonte le programme. On part du résultat et on défait chaque instruction par l’opération inverse, de la dernière à la première. Ajouter 5 défait « retranche 5 », diviser par 4 défait « multiplie par 4 ».',
        ],
      ],
      conclusion: 'Le nombre de départ était 7. On vérifie : 7 × 4 = 28 et 28 − 5 = 23.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'Voici un programme de calcul : « Choisis un nombre. Ajoute 6. Multiplie le résultat par 3. Retranche 10. » Quel résultat obtient-on en choisissant 4 ?',
      figure: {
        id: 'programmes-calcul-q1',
        alt: 'La chaîne du programme : 4, puis + 6, × 3 et − 10 ; le résultat est cherché.',
      },
      choices: ['12', '20', '8', '−20'],
      answer: '20',
      correction: {
        steps: [
          [
            '4 + 6 = 10',
            'On part de 4 et on suit les instructions une par une, dans l’ordre. D’abord, on ajoute 6.',
          ],
          [
            '10 × 3 = 30',
            '« Multiplie le résultat » : on multiplie 10, le résultat de l’étape précédente, et non le seul nombre 6.',
          ],
          ['30 − 10 = 20', 'On retranche 10 au dernier résultat : le programme donne 20.'],
        ],
        traps: [
          [
            '12',
            'le calcul a été écrit sans parenthèses. Dans 4 + 6 × 3 − 10, la multiplication est prioritaire et ne porte que sur 6. Il faut écrire (4 + 6) × 3 − 10.',
          ],
          [
            '8',
            'les instructions ont été suivies dans le désordre : 4 × 3 = 12, puis 12 + 6 = 18 et 18 − 10 = 8.',
          ],
          [
            '−20',
            'la soustraction a été faite à l’envers : 10 − 30 = −20. « Retranche 10 » veut dire qu’on enlève 10 au résultat.',
          ],
        ],
        check: 'en une seule ligne, (4 + 6) × 3 − 10 = 10 × 3 − 10 = 20.',
      },
    }),
    qcm({
      prompt:
        'Voici un programme de calcul : « Choisis un nombre. Élève-le au carré. Retranche 10. Multiplie le résultat par 2. » Quel résultat obtient-on en choisissant −3 ?',
      figure: {
        id: 'programmes-calcul-q2',
        alt: 'La chaîne du programme : −3, puis au carré, − 10 et × 2 ; le résultat est cherché.',
      },
      choices: ['−38', '2', '−2', '−32'],
      answer: '−2',
      correction: {
        steps: [
          [
            '(−3)² = (−3) × (−3) = 9',
            'Le nombre de départ est négatif : on l’écrit entre parenthèses. Le produit de deux nombres négatifs est positif.',
          ],
          ['9 − 10 = −1', 'On retranche 10. Le résultat est négatif, car 10 est plus grand que 9.'],
          [
            '−1 × 2 = −2',
            'On multiplie par 2 : le produit d’un nombre négatif par un nombre positif est négatif. Le programme donne −2.',
          ],
        ],
        traps: [
          [
            '−38',
            'le carré a été tapé sans parenthèses. La calculatrice lit alors −3² = −9, puis −9 − 10 = −19 et −19 × 2 = −38. Avec ses parenthèses, le carré de −3 est (−3)², et il vaut 9.',
          ],
          ['2', 'un signe a été perdu en route : 9 − 10 = −1, et non 1.'],
          [
            '−32',
            'le carré a été confondu avec le double : −3 × 2 = −6, puis −6 − 10 = −16 et −16 × 2 = −32.',
          ],
        ],
        check: 'en une seule ligne, ((−3)² − 10) × 2 = (9 − 10) × 2 = −2.',
      },
    }),
    qcm({
      prompt:
        'Voici un programme de calcul : « Choisis un nombre. Ajoute 5. Multiplie le résultat par 4. Retranche 8. » On note x le nombre de départ. Quelle expression donne le résultat du programme ?',
      figure: {
        id: 'programmes-calcul-q3',
        alt: 'La chaîne du programme : x, puis + 5, × 4 et − 8 ; l’expression du résultat est cherchée.',
      },
      choices: ['4x − 3', 'x + 12', '4x + 28', '4x + 12'],
      answer: '4x + 12',
      correction: {
        steps: [
          ['x + 5', 'On part de x et on ajoute 5.'],
          [
            '(x + 5) × 4',
            'On multiplie tout le résultat précédent par 4. Les parenthèses sont indispensables : sans elles, seul 5 serait multiplié.',
          ],
          [
            '(x + 5) × 4 − 8 = 4x + 20 − 8',
            'On retranche 8, puis on développe : 4 multiplie chaque terme de la parenthèse, x et 5.',
          ],
          ['4x + 20 − 8 = 4x + 12', 'On réduit : 20 − 8 = 12. Le programme donne 4x + 12.'],
        ],
        traps: [
          [
            'x + 12',
            'les parenthèses ont été oubliées. Dans x + 5 × 4 − 8, seul 5 est multiplié par 4.',
          ],
          [
            '4x − 3',
            'la distribution est incomplète : 4 doit multiplier x et 5. On obtient 4x + 20, pas 4x + 5.',
          ],
          [
            '4x + 28',
            '8 a été ajouté au lieu d’être retranché : 20 − 8 = 12, alors que 20 + 8 = 28.',
          ],
        ],
        check:
          'avec x = 1, le programme donne 1 + 5 = 6, puis 6 × 4 = 24 et 24 − 8 = 16. Et 4 × 1 + 12 = 16.',
      },
    }),
    qcm({
      prompt:
        'Voici un programme de calcul : « Choisis un nombre. Multiplie-le par 3. Retranche 9. Divise le résultat par 2. » Le résultat final est 15. Quel était le nombre de départ ?',
      figure: {
        id: 'programmes-calcul-q4',
        alt: 'La chaîne du programme : × 3, − 9 et ÷ 2 mènent à 15 ; le nombre de départ est cherché.',
      },
      choices: ['18', '16', '13', '7'],
      answer: '13',
      correction: {
        steps: [
          [
            '15 × 2 = 30',
            'On remonte le programme en partant du résultat, 15. La dernière instruction était « divise par 2 » : on la défait en multipliant par 2.',
          ],
          [
            '30 + 9 = 39',
            'L’instruction d’avant était « retranche 9 » : on la défait en ajoutant 9.',
          ],
          [
            '39 ÷ 3 = 13',
            'La première instruction était « multiplie par 3 » : on la défait en divisant par 3. Le nombre de départ était 13.',
          ],
        ],
        traps: [
          [
            '18',
            'le programme a été appliqué à 15 : 15 × 3 = 45, puis 45 − 9 = 36 et 36 ÷ 2 = 18. Or 15 est le résultat final, pas le nombre de départ.',
          ],
          [
            '16',
            'les instructions ont été défaites dans le désordre : 15 + 9 = 24, puis 24 × 2 = 48 et 48 ÷ 3 = 16. On défait d’abord la dernière instruction.',
          ],
          [
            '7',
            '« retranche 9 » a été défait par une autre soustraction : 30 − 9 = 21, puis 21 ÷ 3 = 7. L’opération inverse d’une soustraction est une addition.',
          ],
        ],
        check: 'on applique le programme à 13 : 13 × 3 = 39, puis 39 − 9 = 30 et 30 ÷ 2 = 15.',
      },
    }),
    qcm({
      prompt:
        'Programme A : « Choisis un nombre. Multiplie-le par 4. Retranche 6. » Programme B : « Choisis un nombre. Multiplie-le par 2. Ajoute 4. » Pour quel nombre de départ les deux programmes donnent-ils le même résultat ?',
      figure: {
        id: 'programmes-calcul-q5',
        alt: 'Les chaînes des programmes A (× 4, − 6) et B (× 2, + 4), partant du même nombre inconnu.',
      },
      choices: ['5', '−1', '10', '8'],
      answer: '5',
      correction: {
        steps: [
          [
            '4x − 6 = 2x + 4',
            'On note x le nombre de départ. Le programme A donne 4x − 6 et le programme B donne 2x + 4. On cherche x pour que ces deux résultats soient égaux : c’est une équation.',
          ],
          [
            '2x − 6 = 4',
            'On retranche 2x aux deux membres, pour regrouper les termes en x à gauche.',
          ],
          ['2x = 10', 'On ajoute 6 aux deux membres : 4 + 6 = 10.'],
          [
            'x = 10 ÷ 2 = 5',
            'On divise les deux membres par 2. Les deux programmes donnent le même résultat quand le nombre de départ est 5.',
          ],
        ],
        traps: [
          [
            '−1',
            'le terme −6 a changé de membre sans changer de signe : on a écrit 2x = 4 − 6, d’où x = −1. Il faut ajouter 6 aux deux membres.',
          ],
          ['10', 'le calcul s’est arrêté à 2x = 10. Il reste à diviser par 2 pour obtenir x.'],
          [
            '8',
            'à la dernière étape, on a calculé 10 − 2 = 8. Or 2x signifie 2 × x : pour trouver x, on divise 10 par 2.',
          ],
        ],
        check:
          'avec 5, le programme A donne 4 × 5 − 6 = 14 et le programme B donne 2 × 5 + 4 = 14.',
      },
    }),
    qcm({
      prompt:
        'Programme A : « Choisis un nombre. Ajoute 3. Élève le résultat au carré. » Programme B : « Choisis un nombre. Ajoute 6. Multiplie le résultat par le nombre de départ. Ajoute 9. » Pour quels nombres de départ les deux programmes donnent-ils le même résultat ?',
      figure: {
        id: 'programmes-calcul-q6',
        alt: 'Les chaînes des programmes A (+ 3, au carré) et B (+ 6, × le nombre de départ, + 9).',
      },
      choices: [
        'Seulement pour le nombre 0',
        'Pour tous les nombres',
        'Pour aucun nombre',
        'On ne peut pas le savoir sans essayer tous les nombres',
      ],
      answer: 'Pour tous les nombres',
      correction: {
        steps: [
          [
            'A : (x + 3)² = x² + 6x + 9',
            'On note x le nombre de départ. Le programme A donne le carré d’une somme : (x + 3)² = (x + 3)(x + 3). On développe ce produit, ou on applique l’identité (a + b)² = a² + 2ab + b² : le double produit vaut 2 × x × 3 = 6x.',
          ],
          [
            'B : (x + 6) × x + 9 = x² + 6x + 9',
            'Le programme B multiplie x + 6 par le nombre de départ, puis ajoute 9. On développe : x × x = x² et 6 × x = 6x.',
          ],
          [
            'Pour tous les nombres',
            'Les deux programmes donnent la même expression, x² + 6x + 9. Or x représente n’importe quel nombre de départ : les deux résultats sont donc égaux pour tous les nombres. Ce calcul avec x est une preuve.',
          ],
        ],
        traps: [
          [
            'Seulement pour le nombre 0',
            'le double produit a été oublié. Si le carré de x + 3 valait x² + 9, il faudrait 6x = 0, donc x = 0. Mais le carré d’une somme a trois termes.',
          ],
          [
            'Pour aucun nombre',
            'des instructions différentes peuvent mener au même résultat. Pour comparer deux programmes, on compare leurs expressions développées et réduites.',
          ],
          [
            'On ne peut pas le savoir sans essayer tous les nombres',
            'on ne peut pas essayer tous les nombres, mais ce n’est pas nécessaire : la lettre x les représente tous à la fois.',
          ],
        ],
        check:
          'avec 2, le programme A donne (2 + 3)² = 25 et le programme B donne (2 + 6) × 2 + 9 = 25. Cet essai ne prouve rien, mais il aurait pu révéler une erreur de calcul.',
      },
    }),
  ],
})

const scripts = defineExercise({
  id: 'algorithmes-variables-boucles-conditions',
  title: 'Algorithmes : variables, boucles et conditions',
  theme: 'algorithmique',
  difficulty: 'medium',
  description:
    'Six scripts de type Scratch, écrits en toutes lettres : valeur d’une variable, test d’une condition, boucle placée dans une autre, figure tracée par le lutin, distance parcourue, puis boucle « répéter jusqu’à ce que ».',
  lesson: paragraphs(
    'Un **algorithme** est une suite d’instructions exécutées dans l’ordre, l’une après l’autre. Un **script** est un algorithme écrit pour un ordinateur, par exemple avec Scratch.',
    [
      '- Une **variable** est une boîte qui porte un nom et contient une valeur : « mettre n à 5 » y range 5, « ajouter 4 à n » augmente de 4 la valeur qui s’y trouve.',
      '- Une **boucle** répète un bloc d’instructions : un nombre de fois fixé (« répéter 3 fois »), ou jusqu’à ce qu’une condition, testée avant chaque passage, devienne vraie (« répéter jusqu’à ce que n > 20 »).',
      '- Une **instruction conditionnelle** (« si … alors … sinon … ») teste une condition : si elle est vraie, le script exécute ce qui suit « alors » ; si elle est fausse, ce qui suit « sinon ».',
    ].join('\n'),
    figure(
      'scripts-variable-boite',
      'Le bloc mettre score à 10 range 10 dans la boîte score ; le bloc ajouter 3 à score la fait passer à 13.',
    ),
    'Pour suivre un script, on note la valeur de chaque variable après chaque instruction. L’instruction « dire » fait afficher un message par le lutin, le personnage qui exécute le script.',
    'Pour tracer une figure, le lutin avance, puis tourne. Il tourne de l’**angle extérieur** : pour un polygone régulier, c’est 360° divisé par le nombre de côtés, soit 90° pour un carré et 120° pour un triangle équilatéral.',
    figure(
      'scripts-angle-exterieur',
      'Le lutin avance, puis tourne : il tourne de l’angle entre le côté suivant et le prolongement du côté, pas de l’angle de la figure.',
    ),
    'Dans cet exercice, les scripts sont écrits entre guillemets : chaque phrase est une instruction. Une boucle répète tout ce qui suit ses deux-points, jusqu’au point.',
  ),
  example: [
    {
      statement:
        'Voici un script : « Mettre n à 2. Répéter 4 fois : ajouter 3 à n. Si n > 12 alors dire Grand, sinon dire Petit. » Que dit le lutin ?',
      figure: {
        id: 'scripts-exemple-condition',
        alt: 'Le script en blocs : mettre n à 2, répéter 4 fois ajouter 3 à n, puis si n > 12 alors dire Grand, sinon dire Petit.',
      },
      steps: [
        [
          'n vaut 2',
          'On suit le script instruction par instruction, en notant la valeur de la variable. « Mettre n à 2 » range 2 dans n.',
        ],
        [
          'n vaut 5, puis 8, puis 11, puis 14',
          'La boucle exécute 4 fois « ajouter 3 à n ». À chaque passage, n augmente de 3 : on écrit les quatre valeurs, sans en sauter.',
        ],
        ['2 + 4 × 3 = 14', 'On contrôle par un calcul : la valeur de départ, plus 4 fois 3.'],
        [
          '14 > 12 : la condition est vraie',
          'Le test se fait avec la valeur de n à ce moment du script, 14. La condition est vraie : le lutin exécute ce qui suit « alors », et seulement cela.',
        ],
      ],
      conclusion: 'Le lutin dit Grand.',
    },
    {
      statement:
        'Voici un script : « Répéter 4 fois : avancer de 50 pas, puis tourner de 90 degrés à droite. » Quelle figure le lutin trace-t-il, et quelle distance parcourt-il ?',
      figure: {
        id: 'scripts-exemple-carre',
        alt: 'Le script en blocs, répéter 4 fois avancer de 50 pas et tourner de 90 degrés, à côté du carré tracé par le lutin.',
      },
      steps: [
        [
          '4 côtés de 50 pas',
          'À chaque passage dans la boucle, le lutin trace un segment de 50 pas, puis pivote sur place. Avec 4 passages, la figure a 4 côtés de même longueur.',
        ],
        [
          '4 × 90 = 360',
          'Entre deux côtés, le lutin tourne de 90° : deux côtés qui se suivent sont perpendiculaires. En tout, il tourne de 360°, un tour complet : comme les côtés sont égaux, il termine à son point de départ.',
        ],
        [
          '4 × 50 = 200',
          'La distance parcourue est la somme des longueurs des côtés. Tourner ne fait pas avancer : les angles ne comptent pas.',
        ],
      ],
      conclusion: 'Le lutin trace un carré de côté 50 pas et parcourt 200 pas.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'Voici un script : « Mettre n à 5. Répéter 3 fois : ajouter 4 à n. » Quelle est la valeur de n à la fin du script ?',
      figure: {
        id: 'scripts-q1-boucle',
        alt: 'Le script en blocs : mettre n à 5, puis répéter 3 fois ajouter 4 à n.',
      },
      choices: ['9', '12', '17', '27'],
      answer: '17',
      correction: {
        steps: [
          ['n vaut 5', '« Mettre n à 5 » range la valeur 5 dans la variable n.'],
          [
            'n vaut 9, puis 13, puis 17',
            'La boucle exécute 3 fois « ajouter 4 à n ». Chaque passage repart de la valeur laissée par le précédent.',
          ],
          [
            '5 + 3 × 4 = 17',
            'On contrôle par un calcul : la valeur de départ, plus 3 fois 4. À la fin du script, n vaut 17.',
          ],
        ],
        traps: [
          [
            '9',
            'la boucle n’a été exécutée qu’une fois : 5 + 4 = 9. « Répéter 3 fois » demande trois passages.',
          ],
          [
            '12',
            'la valeur de départ a été oubliée : 3 × 4 = 12. « Ajouter 4 à n » augmente la valeur déjà rangée dans n, qui vaut 5 au début.',
          ],
          [
            '27',
            'c’est (5 + 4) × 3 = 27. La boucle ne multiplie pas n par 3 : elle lui ajoute 4, trois fois de suite.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Voici un script : « Demander un nombre et mettre n à la réponse. Multiplier n par 2. Ajouter 4 à n. Si n > 20 alors dire Gagné, sinon dire Perdu. » Que dit le lutin si on répond 8 ?',
      figure: {
        id: 'scripts-q2-condition',
        alt: 'Le script en blocs : demander un nombre, mettre n à la réponse, multiplier n par 2, ajouter 4 à n, puis si n > 20 alors dire Gagné, sinon dire Perdu.',
      },
      choices: [
        'Gagné, car n vaut 24',
        'Gagné, car n vaut 20',
        'Perdu, car n vaut 8',
        'Perdu, car n vaut 20',
      ],
      answer: 'Perdu, car n vaut 20',
      correction: {
        steps: [
          [
            '8 × 2 = 16',
            'On répond 8 : n vaut d’abord 8. « Multiplier n par 2 » remplace cette valeur par son double.',
          ],
          [
            '16 + 4 = 20',
            '« Ajouter 4 à n » : n vaut maintenant 20. C’est cette valeur que le test va lire.',
          ],
          [
            '20 > 20 est faux',
            'La condition n > 20 demande un nombre strictement plus grand que 20. Or n est égal à 20 : la condition est fausse, et le lutin exécute ce qui suit « sinon ».',
          ],
          ['Perdu, car n vaut 20', 'Le lutin dit Perdu.'],
        ],
        traps: [
          [
            'Gagné, car n vaut 24',
            'les deux calculs ont été faits dans le désordre : 8 + 4 = 12, puis 12 × 2 = 24. On suit l’ordre des instructions.',
          ],
          [
            'Gagné, car n vaut 20',
            'n vaut bien 20, mais 20 > 20 est faux : le signe > exclut l’égalité.',
          ],
          [
            'Perdu, car n vaut 8',
            'le lutin dit bien Perdu, mais la raison est fausse. Au moment du test, n ne vaut plus 8 : les deux instructions de calcul ont changé sa valeur.',
          ],
        ],
        check: 'avec la réponse 9, n vaudrait 2 × 9 + 4 = 22 : le lutin dirait Gagné.',
      },
    }),
    qcm({
      prompt:
        'Voici un script où une boucle est placée dans une autre : « Mettre n à 0. Répéter 3 fois : répéter 4 fois : ajouter 2 à n. » Combien de fois l’instruction « ajouter 2 à n » est-elle exécutée ?',
      figure: {
        id: 'scripts-q3-boucles-imbriquees',
        alt: 'Le script en blocs : mettre n à 0, puis un bloc répéter 3 fois qui contient répéter 4 fois ajouter 2 à n.',
      },
      choices: ['7', '12', '24', '4'],
      answer: '12',
      correction: {
        steps: [
          [
            '4 exécutions par passage',
            'La boucle intérieure, « répéter 4 fois », exécute 4 fois l’instruction « ajouter 2 à n ».',
          ],
          [
            '3 × 4 = 12',
            'La boucle extérieure fait recommencer 3 fois toute la boucle intérieure : cela fait 3 séries de 4 exécutions. L’instruction est exécutée 12 fois.',
          ],
        ],
        traps: [
          [
            '7',
            'les deux nombres de répétitions ont été ajoutés : 3 + 4 = 7. Quand une boucle est placée dans une autre, on les multiplie.',
          ],
          [
            '24',
            'c’est la valeur de n à la fin du script : 12 × 2 = 24. La question porte sur le nombre d’exécutions, pas sur la valeur de la variable.',
          ],
          [
            '4',
            'la boucle intérieure n’a été comptée qu’une fois. La boucle extérieure la fait recommencer 3 fois.',
          ],
        ],
        check:
          'n augmente de 2 à chaque exécution et vaut 24 à la fin : il y a bien eu 24 ÷ 2 = 12 exécutions.',
      },
    }),
    qcm({
      prompt:
        'Voici un script : « Répéter 3 fois : avancer de 80 pas, puis tourner de 120 degrés à gauche. » Quelle figure le lutin trace-t-il ?',
      figure: {
        id: 'scripts-q4-figure',
        alt: 'Le script en blocs : répéter 3 fois avancer de 80 pas, puis tourner de 120 degrés à gauche.',
      },
      choices: [
        'Un triangle équilatéral',
        'Un hexagone régulier',
        'Un triangle rectangle',
        'Une ligne brisée qui ne se referme pas',
      ],
      answer: 'Un triangle équilatéral',
      correction: {
        steps: [
          [
            '3 côtés de 80 pas',
            'La boucle est répétée 3 fois, et chaque passage trace un segment de 80 pas : la figure a 3 côtés de même longueur.',
          ],
          [
            '3 × 120 = 360',
            'Le lutin tourne 3 fois de 120°, toujours dans le même sens : 360° en tout, un tour complet. Comme tous les côtés ont la même longueur, il termine à son point de départ : la figure se referme.',
          ],
          [
            '180 − 120 = 60',
            'Le lutin tourne de l’angle extérieur. L’angle de la figure, à l’intérieur, est ce qui manque pour faire 180° : il mesure 60°.',
          ],
          [
            'Un triangle équilatéral',
            'Trois côtés de même longueur et trois angles de 60° : la figure est un triangle équilatéral de côté 80 pas.',
          ],
        ],
        traps: [
          [
            'Un hexagone régulier',
            '120° est bien l’angle intérieur d’un hexagone régulier, mais le lutin tourne de l’angle extérieur. De plus, la boucle n’est répétée que 3 fois : la figure n’a que 3 côtés.',
          ],
          [
            'Un triangle rectangle',
            'pour tracer un angle droit, le lutin devrait tourner de 90°. Ici, les trois angles de la figure mesurent 60°.',
          ],
          [
            'Une ligne brisée qui ne se referme pas',
            'la figure se referme, car le lutin a fait un tour complet. On croit souvent qu’il doit tourner de 60°, l’angle du triangle : c’est de l’angle extérieur, 120°, qu’il tourne.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Voici un script : « Répéter 2 fois : avancer de 120 pas, tourner de 90 degrés à droite, avancer de 70 pas, puis tourner de 90 degrés à droite. » Quelle distance le lutin parcourt-il en tout ?',
      figure: {
        id: 'scripts-q5-distance',
        alt: 'Le script en blocs : répéter 2 fois avancer de 120 pas, tourner de 90 degrés, avancer de 70 pas, tourner de 90 degrés.',
      },
      choices: ['190 pas', '380 pas', '740 pas', '8 400 pas'],
      answer: '380 pas',
      correction: {
        steps: [
          [
            '120 + 70 = 190',
            'À chaque passage dans la boucle, le lutin avance de 120 pas, puis de 70 pas. Tourner ne fait pas avancer : les angles ne comptent pas dans la distance.',
          ],
          [
            '2 × 190 = 380',
            'La boucle est répétée 2 fois. Le lutin trace un rectangle de 120 pas sur 70 pas, et la distance parcourue est son périmètre : 380 pas.',
          ],
        ],
        traps: [
          [
            '190 pas',
            'un seul passage dans la boucle a été compté. Avec « répéter 2 fois », le lutin trace les quatre côtés du rectangle.',
          ],
          [
            '740 pas',
            'les angles ont été ajoutés aux longueurs : 120 + 90 + 70 + 90 = 370, puis 2 × 370 = 740. Un angle se mesure en degrés : ce n’est pas une distance.',
          ],
          [
            '8 400 pas',
            'c’est le produit 120 × 70 = 8 400, l’aire du rectangle. La distance parcourue est son périmètre.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Lina a 20 € dans sa tirelire et y ajoute 15 € chaque semaine. Ce script compte les semaines qu’il lui faut pour dépasser 100 € : « Mettre total à 20. Mettre semaines à 0. Répéter jusqu’à ce que total > 100 : ajouter 15 à total, puis ajouter 1 à semaines. Dire semaines. » Que dit le lutin ?',
      figure: {
        id: 'scripts-q6-jusqua',
        alt: 'Le script en blocs : mettre total à 20 et semaines à 0, répéter jusqu’à ce que total > 100 ajouter 15 à total et 1 à semaines, puis dire semaines.',
      },
      choices: ['5', '7', '110', '6'],
      answer: '6',
      correction: {
        steps: [
          [
            'total : 20, 35, 50, 65, 80, 95',
            'Avant chaque passage, le script teste la condition total > 100. Tant qu’elle est fausse, il exécute le bloc : total augmente de 15 et semaines augmente de 1. Après 5 passages, total vaut 95.',
          ],
          [
            '95 > 100 est faux',
            'La condition n’est pas encore vraie : la boucle continue, pour un sixième passage.',
          ],
          [
            '95 + 15 = 110',
            'Après le sixième passage, total vaut 110 et semaines vaut 6. Cette fois, 110 > 100 est vrai : la boucle s’arrête.',
          ],
          [
            'Le lutin dit 6',
            'La variable semaines a compté les passages dans la boucle : Lina dépasse 100 € au bout de 6 semaines.',
          ],
        ],
        traps: [
          [
            '5',
            'la boucle a été arrêtée quand total vaut 95. Or 95 > 100 est faux : il faut encore un passage.',
          ],
          [
            '7',
            'deux erreurs y mènent. Un passage de trop a été compté : dès que total vaut 110, la condition est vraie et la boucle s’arrête, sans septième passage. Ou bien les 20 € de départ ont été oubliés : en partant de 0, il faudrait 7 semaines, car 6 × 15 = 90 ne dépasse pas 100, alors que 7 × 15 = 105 le dépasse.',
          ],
          [
            '110',
            'c’est la valeur de la variable total à la fin du script. Le lutin dit la variable semaines.',
          ],
        ],
        check:
          'il manque 100 − 20 = 80 € à Lina. Or 5 × 15 = 75 ne suffit pas, alors que 6 × 15 = 90 dépasse 80.',
      },
    }),
  ],
})

export const algorithmique = [programmesDeCalcul, scripts]
