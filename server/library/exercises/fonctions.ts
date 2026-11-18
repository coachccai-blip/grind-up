import { defineExercise, figure, paragraphs, qcm } from '../authoring.js'

/**
 * Fonctions. Trois QCM : la notion de fonction (image et antécédent), les
 * fonctions linéaires, puis les fonctions affines. Une fonction est donnée par
 * une formule ou par un tableau de valeurs, écrit en texte et dessiné ; une
 * droite est décrite par les points où elle passe. Les figures sont dans
 * server/library/figures/fonctions.ts ; aucune ne montre une droite qu'une
 * question demande de reconnaître.
 */

/** Le tableau de valeurs de la fonction h, lu deux fois : pour une image, puis pour des antécédents. */
const TABLE =
  'Voici un tableau de valeurs d’une fonction h. Chaque flèche va d’un nombre x à son image h(x) : −2 → 4 ; −1 → 1 ; 0 → 3 ; 2 → 4 ; 3 → −1 ; 4 → 7.'

const notion = defineExercise({
  id: 'notion-de-fonction',
  title: 'Notion de fonction : image et antécédent',
  theme: 'fonctions',
  difficulty: 'easy',
  description:
    'Le vocabulaire des fonctions : notations f(x) et x ↦ f(x), image, antécédent. Calculer une image, lire un tableau de valeurs, trouver un antécédent par une équation.',
  lesson: paragraphs(
    'Une **fonction** est un procédé qui, à chaque nombre x, fait correspondre un seul nombre. Si la fonction s’appelle f, ce nombre se note f(x) et se lit « f de x ».',
    figure(
      'fonction-machine-rappel',
      'Une machine f, de formule x ↦ 2x + 3 : le nombre 4 entre, c’est l’antécédent ; 11 sort, c’est l’image.',
    ),
    [
      '- **Deux notations.** f : x ↦ 2x + 3 se lit « la fonction f qui, à x, associe 2x + 3 ». On écrit aussi f(x) = 2x + 3.',
      '- **Image.** f(x) est l’image de x par f. Pour la calculer, remplace x par sa valeur : f(4) = 2 × 4 + 3 = 11. L’image de 4 par f est 11.',
      '- **Antécédent.** Un antécédent de 11 par f est un nombre dont l’image est 11. Comme f(4) = 11, le nombre 4 est un antécédent de 11.',
      '- **Tableau de valeurs.** Il donne quelques nombres et leur image. Ici, il s’écrit avec des flèches : 4 → 11 veut dire f(4) = 11.',
    ].join('\n'),
    'À retenir : dans f(4) = 11, le nombre entre parenthèses est l’antécédent, le résultat est l’image. Un nombre n’a qu’une seule image, mais il peut avoir plusieurs antécédents, ou aucun.',
  ),
  example: [
    {
      statement: 'La fonction f est définie par f(x) = 3x − 5. Calcule l’image de 6 par f.',
      figure: {
        id: 'fonction-exemple-image',
        alt: 'La machine f, de formule x ↦ 3x − 5 : 6 entre, l’image qui sort est cherchée.',
      },
      steps: [
        [
          'f(6) = 3 × 6 − 5',
          'L’image de 6 se note f(6). Pour la calculer, on remplace x par 6 dans la formule : 3x veut dire 3 × x.',
        ],
        [
          'f(6) = 18 − 5 = 13',
          'On respecte les priorités : la multiplication d’abord, la soustraction ensuite.',
        ],
      ],
      conclusion: 'L’image de 6 par f est 13.',
    },
    {
      statement:
        'La fonction f est toujours définie par f(x) = 3x − 5. Trouve l’antécédent de 10 par f.',
      figure: {
        id: 'fonction-exemple-antecedent',
        alt: 'La machine f, de formule x ↦ 3x − 5 : 10 sort, le nombre qui entre est cherché.',
      },
      steps: [
        [
          '3x − 5 = 10',
          'On cherche le nombre x dont l’image est 10, c’est-à-dire tel que f(x) = 10. On remplace f(x) par son expression : on obtient une équation.',
        ],
        ['3x = 10 + 5 = 15', 'On ajoute 5 aux deux membres.'],
        ['x = 15 ÷ 3 = 5', 'On divise les deux membres par 3.'],
      ],
      conclusion: 'L’antécédent de 10 par f est 5. On vérifie : f(5) = 3 × 5 − 5 = 10.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Pour une fonction f, on sait que f(3) = 8. Quelle phrase traduit cette égalité ?',
      figure: { id: 'fonction-q1-machine', alt: 'Une machine f : le nombre 3 entre, 8 sort.' },
      choices: [
        '3 est l’image de 8 par f',
        '8 est l’image de 3 par f',
        '8 est un antécédent de 3 par f',
        'f multiplié par 3 donne 8',
      ],
      answer: '8 est l’image de 3 par f',
      correction: {
        steps: [
          [
            'f(3) = 8',
            'Le nombre entre parenthèses, 3, est le nombre de départ. Le nombre écrit après le signe égal, 8, est le résultat que la fonction lui fait correspondre.',
          ],
          [
            '8 est l’image de 3 par f',
            'Le résultat s’appelle l’image. On peut dire aussi, dans l’autre sens, que 3 est un antécédent de 8 par f. À retenir : f(antécédent) = image.',
          ],
        ],
        traps: [
          [
            '3 est l’image de 8 par f',
            'les rôles sont inversés. L’image est le résultat, 8, et non le nombre de départ.',
          ],
          [
            '8 est un antécédent de 3 par f',
            'les deux mots sont échangés. C’est 3 qui est un antécédent de 8.',
          ],
          [
            'f multiplié par 3 donne 8',
            'f(3) n’est pas un produit. Les parenthèses entourent le nombre auquel on applique la fonction f.',
          ],
        ],
      },
    }),
    qcm({
      prompt: 'La fonction g est définie par g : x ↦ 5x − 2. Quelle est l’image de 4 par g ?',
      choices: ['18', '52', '10', '1,2'],
      answer: '18',
      correction: {
        steps: [
          [
            'g(4) = 5 × 4 − 2',
            'La notation g : x ↦ 5x − 2 veut dire g(x) = 5x − 2. L’image de 4 se note g(4) : on remplace x par 4, et 5x veut dire 5 × x.',
          ],
          [
            'g(4) = 20 − 2 = 18',
            'La multiplication est prioritaire : on calcule 5 × 4 = 20, puis on soustrait 2. L’image de 4 par g est 18.',
          ],
        ],
        traps: [
          [
            '52',
            '5x a été lu « 54 ». Entre 5 et x, il y a une multiplication sous-entendue : 5 × 4 = 20.',
          ],
          [
            '10',
            'la soustraction a été faite avant la multiplication : 5 × (4 − 2) = 10. Sans parenthèses, la multiplication passe en premier.',
          ],
          [
            '1,2',
            'c’est l’antécédent de 4, car 5 × 1,2 − 2 = 4. La question demande l’image de 4, et non son antécédent.',
          ],
        ],
      },
    }),
    qcm({
      prompt: `${TABLE} Quelle est l’image de 3 par h ?`,
      figure: {
        id: 'fonction-tableau-h',
        alt: 'Le tableau de valeurs de h : x vaut −2, −1, 0, 2, 3, 4 ; h(x) vaut 4, 1, 3, 4, −1, 7.',
      },
      choices: ['0', '4', '−1', '1'],
      answer: '−1',
      correction: {
        steps: [
          [
            '3 → −1',
            'Pour lire une image, on cherche 3 parmi les nombres de départ, à gauche des flèches. On suit ensuite la flèche qui part de 3 : elle arrive sur −1.',
          ],
          ['h(3) = −1', 'L’image de 3 par h est −1.'],
        ],
        traps: [
          [
            '0',
            'c’est un antécédent de 3, car la flèche 0 → 3 arrive sur 3. Pour une image, on part de 3.',
          ],
          [
            '4',
            'c’est l’image de 2, le nombre voisin de 3 dans le tableau. On a suivi la mauvaise flèche.',
          ],
          ['1', 'le signe moins est oublié. La flèche qui part de 3 arrive sur −1, et non sur 1.'],
        ],
      },
    }),
    qcm({
      prompt: `${TABLE} Quels sont les antécédents de 4 par h dans ce tableau ?`,
      figure: {
        id: 'fonction-tableau-h',
        alt: 'Le tableau de valeurs de h : x vaut −2, −1, 0, 2, 3, 4 ; h(x) vaut 4, 1, 3, 4, −1, 7.',
      },
      choices: ['7', '−2 et 2', '3', '−2'],
      answer: '−2 et 2',
      correction: {
        steps: [
          [
            '−2 → 4 et 2 → 4',
            'Pour lire un antécédent, on cherche 4 parmi les images, à droite des flèches. On le trouve deux fois.',
          ],
          [
            '−2 et 2',
            'On remonte chaque flèche jusqu’à son nombre de départ. Le nombre 4 a deux antécédents dans ce tableau : un nombre peut avoir plusieurs antécédents.',
          ],
        ],
        traps: [
          [
            '7',
            'c’est l’image de 4. On a suivi la flèche qui part de 4, alors que, pour un antécédent, on cherche les flèches qui arrivent sur 4.',
          ],
          [
            '3',
            'c’est le nombre de départ placé juste avant 4 dans le tableau. Or « antécédent » ne veut pas dire « celui d’avant » : un antécédent de 4 est un nombre dont l’image est 4.',
          ],
          ['−2', 'il en manque un. La flèche qui part de 2 arrive aussi sur 4.'],
        ],
        check: 'h(−2) = 4 et h(2) = 4 : les deux nombres ont bien 4 pour image.',
      },
    }),
    qcm({
      prompt: 'La fonction k est définie par k(x) = 2x + 6. Quel est l’antécédent de 20 par k ?',
      choices: ['46', '13', '4', '7'],
      answer: '7',
      correction: {
        steps: [
          [
            '2x + 6 = 20',
            'On cherche le nombre x dont l’image est 20, c’est-à-dire tel que k(x) = 20. On remplace k(x) par son expression : on obtient une équation.',
          ],
          ['2x = 20 − 6 = 14', 'On soustrait 6 aux deux membres.'],
          ['x = 14 ÷ 2 = 7', 'On divise les deux membres par 2 : l’antécédent de 20 par k est 7.'],
        ],
        traps: [
          [
            '46',
            'c’est l’image de 20, car 2 × 20 + 6 = 46. Ici, 20 est le résultat, et non le nombre de départ.',
          ],
          ['13', 'le nombre 6 a été ajouté au lieu d’être soustrait : (20 + 6) ÷ 2 = 13.'],
          [
            '4',
            'la division par 2 a été faite en premier, sans diviser le 6 : 20 ÷ 2 − 6 = 4. On soustrait 6 d’abord, on divise ensuite.',
          ],
        ],
        check: 'k(7) = 2 × 7 + 6 = 20 : l’image de 7 est bien 20.',
      },
    }),
    qcm({
      prompt: 'La fonction p est définie par p(x) = x². Quelle affirmation est vraie ?',
      choices: [
        'Le nombre 9 a deux antécédents : 3 et −3',
        'Le nombre 3 a deux images : 9 et −9',
        'L’image de −3 est −9',
        'Le nombre −9 a un antécédent : −3',
      ],
      answer: 'Le nombre 9 a deux antécédents : 3 et −3',
      correction: {
        steps: [
          ['p(3) = 3² = 9', 'On calcule l’image de 3 : c’est 9.'],
          [
            'p(−3) = (−3)² = 9',
            'On calcule l’image de −3. Le carré d’un nombre négatif est positif : c’est encore 9.',
          ],
          [
            'Le nombre 9 a deux antécédents : 3 et −3',
            'Deux nombres différents ont la même image, 9. Ce sont les seuls : l’équation x² = 9 n’a que deux solutions, 3 et −3. Un nombre peut donc avoir plusieurs antécédents.',
          ],
        ],
        traps: [
          [
            'Le nombre 3 a deux images : 9 et −9',
            'un nombre n’a qu’une seule image. Celle de 3 est 3² = 9, et rien d’autre.',
          ],
          [
            'L’image de −3 est −9',
            'le signe moins est élevé au carré, lui aussi : (−3)² = (−3) × (−3) = 9.',
          ],
          [
            'Le nombre −9 a un antécédent : −3',
            'un carré n’est jamais négatif. Aucun nombre n’a pour image −9 : ce nombre n’a pas d’antécédent par p.',
          ],
        ],
      },
    }),
  ],
})

const lineaires = defineExercise({
  id: 'fonctions-lineaires',
  title: 'Fonctions linéaires et proportionnalité',
  theme: 'fonctions',
  difficulty: 'medium',
  description:
    'Fonctions linéaires f(x) = ax : image, antécédent, coefficient, droite passant par l’origine, puis deux situations concrètes, un prix au kilo et une baisse en pourcentage.',
  lesson: paragraphs(
    'Une **fonction linéaire** est une fonction de la forme f(x) = ax, où a est un nombre fixé : son **coefficient**. Pour calculer une image, tu multiplies par a. Pour trouver un antécédent, tu divises par a, si a n’est pas nul.',
    [
      '- **Proportionnalité.** Une fonction linéaire traduit une situation de proportionnalité, et a est le coefficient de proportionnalité. À 3 € le kilo, x kilos coûtent 3x euros.',
      '- **Trouver a.** Divise une image par son antécédent : si f(2) = 7, alors a = 7 ÷ 2 = 3,5.',
      '- **Graphique.** Une fonction linéaire est représentée par une droite qui passe par l’origine du repère, car f(0) = 0. Cette droite passe aussi par le point (1 ; a).',
      '- **Pourcentages.** Augmenter un nombre de 20 %, c’est le multiplier par 1 + 0,20 = 1,2 : la fonction est x ↦ 1,2x. Le diminuer de 20 %, c’est le multiplier par 1 − 0,20 = 0,8.',
    ].join('\n'),
    figure(
      'fonction-lineaire-prix-kilo',
      'Un tableau de proportionnalité : 1, 2 et 4 kg coûtent 3, 6 et 12 € ; une flèche « × 3 » va de la masse au prix.',
    ),
    figure(
      'fonction-lineaire-droite',
      'Dans un repère, la droite d’une fonction linéaire f passe par l’origine O et par le point (1 ; a).',
    ),
  ),
  example: [
    {
      statement:
        'La fonction linéaire f vérifie f(6) = 9. Trouve son coefficient, puis calcule l’image de 10 et l’antécédent de 12.',
      figure: {
        id: 'fonction-lineaire-exemple-tableau',
        alt: 'Tableau : x vaut 6, 10, ? ; f(x) vaut 9, ?, 12 ; une flèche « × a » va de x à f(x).',
      },
      steps: [
        [
          'a × 6 = 9',
          'La fonction f est linéaire, donc f(x) = ax. L’égalité f(6) = 9 veut dire que 6, multiplié par a, donne 9.',
        ],
        [
          'a = 9 ÷ 6 = 1,5',
          'On divise l’image par son antécédent. La fonction est donc définie par f(x) = 1,5x.',
        ],
        ['f(10) = 1,5 × 10 = 15', 'Pour calculer une image, on multiplie par le coefficient.'],
        ['1,5x = 12', 'Pour trouver l’antécédent de 12, on cherche le nombre x tel que f(x) = 12.'],
        [
          'x = 12 ÷ 1,5 = 8',
          'On divise les deux membres par le coefficient : c’est le chemin inverse.',
        ],
      ],
      conclusion: 'Le coefficient de f est 1,5. L’image de 10 est 15 et l’antécédent de 12 est 8.',
    },
    {
      statement:
        'Un magasin baisse tous ses prix de 30 %. Quelle fonction donne le nouveau prix à partir de l’ancien prix x ? Calcule le nouveau prix d’un article qui coûtait 60 €.',
      figure: {
        id: 'fonction-lineaire-exemple-baisse',
        alt: 'Une bande de 10 parts pour l’ancien prix de 60 € : 3 parts pour la baisse de 30 %, 7 parts pour le nouveau prix.',
      },
      steps: [
        [
          'x − 0,30 × x',
          'Baisser un prix de 30 %, c’est lui retirer 30 % de sa valeur, soit 0,30 × x.',
        ],
        [
          'x − 0,30x = 0,7x',
          'On réduit : 1 fois x, moins 0,30 fois x, cela fait 0,7 fois x. Le nouveau prix est donné par la fonction linéaire x ↦ 0,7x.',
        ],
        ['0,7 × 60 = 42', 'On calcule l’image de 60 par cette fonction.'],
      ],
      conclusion: 'Diminuer de 30 %, c’est multiplier par 0,7. L’article coûte maintenant 42 €.',
    },
  ],
  questions: [
    qcm({
      prompt: 'La fonction linéaire f est définie par f(x) = −5x. Quelle est l’image de 3 par f ?',
      choices: ['15', '−2', '−15', '−0,6'],
      answer: '−15',
      correction: {
        steps: [
          [
            'f(3) = −5 × 3',
            'L’image de 3 se note f(3). On remplace x par 3 : −5x veut dire −5 × x.',
          ],
          [
            'f(3) = −15',
            'Le produit d’un nombre négatif par un nombre positif est négatif. L’image de 3 par f est −15.',
          ],
        ],
        traps: [
          ['15', 'le signe du coefficient est oublié : −5 × 3 = −15.'],
          ['−2', 'les nombres −5 et 3 ont été ajoutés. Or, dans −5x, le coefficient multiplie x.'],
          [
            '−0,6',
            'c’est l’antécédent de 3, car −5 × (−0,6) = 3. La question demande l’image de 3.',
          ],
        ],
        check:
          'le coefficient est négatif et 3 est positif : l’image est forcément un nombre négatif.',
      },
    }),
    qcm({
      prompt:
        'La fonction linéaire g est définie par g(x) = 4x. Quel est l’antécédent de 10 par g ?',
      choices: ['40', '2,5', '6', '0,4'],
      answer: '2,5',
      correction: {
        steps: [
          [
            '4x = 10',
            'On cherche le nombre x dont l’image est 10, c’est-à-dire tel que g(x) = 10.',
          ],
          [
            'x = 10 ÷ 4 = 2,5',
            'On divise les deux membres par le coefficient 4 : l’antécédent de 10 par g est 2,5.',
          ],
        ],
        traps: [
          [
            '40',
            'c’est l’image de 10, car 4 × 10 = 40. Ici, 10 est le résultat, et non le nombre de départ.',
          ],
          [
            '6',
            'le nombre 4 a été soustrait. Or le coefficient multiplie x : pour revenir en arrière, on divise par 4.',
          ],
          [
            '0,4',
            'le quotient est inversé : 4 ÷ 10 = 0,4. On divise l’image par le coefficient, soit 10 ÷ 4.',
          ],
        ],
        check: 'g(2,5) = 4 × 2,5 = 10.',
      },
    }),
    qcm({
      prompt: 'Une fonction linéaire h vérifie h(8) = 2. Quel est son coefficient ?',
      choices: ['4', '6', '0,25', '16'],
      answer: '0,25',
      correction: {
        steps: [
          [
            'a × 8 = 2',
            'La fonction h est linéaire, donc h(x) = ax. L’égalité h(8) = 2 veut dire que 8, multiplié par a, donne 2.',
          ],
          [
            'a = 2 ÷ 8 = 0,25',
            'On divise l’image par son antécédent. Le coefficient de h est 0,25.',
          ],
        ],
        traps: [
          [
            '4',
            'le quotient est inversé : 8 ÷ 2 = 4. On divise l’image, 2, par son antécédent, 8, même si le résultat est plus petit que 1.',
          ],
          [
            '6',
            'c’est la différence 8 − 2. Une fonction linéaire multiplie : on cherche par quel nombre multiplier 8 pour obtenir 2.',
          ],
          ['16', 'c’est le produit 8 × 2. Pour retrouver le coefficient, on divise.'],
        ],
        check: 'avec h(x) = 0,25x, on retrouve h(8) = 0,25 × 8 = 2.',
      },
    }),
    qcm({
      prompt:
        'Dans un repère, quelle est la représentation graphique de la fonction linéaire k définie par k(x) = 2x ?',
      choices: [
        'Une droite qui passe par l’origine et par le point (1 ; 2)',
        'Une droite qui passe par l’origine et par le point (2 ; 1)',
        'Une droite qui passe par les points (0 ; 2) et (1 ; 4)',
        'Une droite horizontale qui passe par le point (0 ; 2)',
      ],
      answer: 'Une droite qui passe par l’origine et par le point (1 ; 2)',
      correction: {
        steps: [
          [
            'k(0) = 2 × 0 = 0',
            'Une fonction linéaire est représentée par une droite qui passe par l’origine du repère, le point (0 ; 0).',
          ],
          [
            'k(1) = 2 × 1 = 2',
            'Pour tracer une droite, il faut un second point. L’image de 1 est 2 : le point (1 ; 2) est sur la droite. L’abscisse est le nombre de départ, l’ordonnée est son image.',
          ],
          [
            'Une droite qui passe par l’origine et par le point (1 ; 2)',
            'Deux points suffisent pour tracer une droite.',
          ],
        ],
        traps: [
          [
            'Une droite qui passe par l’origine et par le point (2 ; 1)',
            'les coordonnées sont inversées. L’abscisse s’écrit en premier : l’image de 2 est 4, et non 1.',
          ],
          [
            'Une droite qui passe par les points (0 ; 2) et (1 ; 4)',
            'cette droite ne passe pas par l’origine. Elle représente la fonction x ↦ 2x + 2, qui n’est pas linéaire.',
          ],
          [
            'Une droite horizontale qui passe par le point (0 ; 2)',
            'cette droite représente la fonction constante x ↦ 2 : avec cette fonction, tous les nombres ont la même image, 2.',
          ],
        ],
        check:
          'on calcule un troisième point : k(3) = 2 × 3 = 6. Le point (3 ; 6) doit être aligné avec les deux autres.',
      },
    }),
    qcm({
      prompt:
        'Au marché, 2,5 kg de cerises coûtent 14 €. Le prix est proportionnel à la masse. Quelle fonction donne le prix, en euros, de x kilogrammes de cerises ?',
      figure: {
        id: 'fonction-lineaire-q5-cerises',
        alt: 'Un panier de cerises sur une balance qui affiche 2,5 kg, avec une étiquette de 14 €.',
      },
      choices: ['x ↦ 14x', 'x ↦ 5,6x', 'x ↦ 35x', 'x ↦ x + 11,5'],
      answer: 'x ↦ 5,6x',
      correction: {
        steps: [
          [
            '14 ÷ 2,5 = 5,6',
            'Le prix est proportionnel à la masse : on calcule d’abord le prix d’un kilogramme, qui est le coefficient de proportionnalité. Un kilogramme coûte 5,60 €.',
          ],
          [
            'x ↦ 5,6x',
            'Pour x kilogrammes, on multiplie le prix d’un kilogramme par x. Le prix est donné par une fonction linéaire de coefficient 5,6.',
          ],
        ],
        traps: [
          ['x ↦ 14x', '14 € est le prix de 2,5 kg, et non celui d’un kilogramme.'],
          [
            'x ↦ 35x',
            'le prix et la masse ont été multipliés : 14 × 2,5 = 35. Pour trouver le prix d’un kilogramme, on divise.',
          ],
          [
            'x ↦ x + 11,5',
            'on passe bien de 2,5 à 14 en ajoutant 11,5, mais une situation de proportionnalité se traduit par une multiplication. Avec cette fonction, 0 kg de cerises coûterait 11,50 €, et 5 kg coûteraient 16,50 € au lieu de 28 €.',
          ],
        ],
        check:
          'pour 2,5 kg, la fonction donne 5,6 × 2,5 = 14. Et le prix reste proportionnel : 0 kg coûte 0 €, et 5 kg, le double de 2,5 kg, coûtent 5,6 × 5 = 28, le double de 14.',
      },
    }),
    qcm({
      prompt:
        'Pendant les soldes, un magasin baisse tous ses prix de 15 %. Quelle fonction donne le nouveau prix à partir de l’ancien prix x ?',
      figure: {
        id: 'fonction-lineaire-q6-soldes',
        alt: 'Une étiquette « Soldes −15 % » ; ancien prix x, nouveau prix cherché.',
      },
      choices: ['x ↦ 0,15x', 'x ↦ x − 15', 'x ↦ 1,15x', 'x ↦ 0,85x'],
      answer: 'x ↦ 0,85x',
      correction: {
        steps: [
          [
            'x − 0,15 × x',
            'Baisser un prix de 15 %, c’est lui retirer 15 % de sa valeur, soit 0,15 × x.',
          ],
          [
            'x − 0,15x = 0,85x',
            'On réduit : 1 fois x, moins 0,15 fois x, cela fait 0,85 fois x, car 1 − 0,15 = 0,85.',
          ],
          [
            'x ↦ 0,85x',
            'Diminuer de 15 %, c’est multiplier par 0,85 : le nouveau prix est donné par une fonction linéaire.',
          ],
        ],
        traps: [
          ['x ↦ 0,15x', 'cette fonction donne le montant de la réduction, et non le nouveau prix.'],
          [
            'x ↦ x − 15',
            'cette fonction retire 15 €, et non 15 %. La réduction dépend du prix : elle vaut 0,15x.',
          ],
          [
            'x ↦ 1,15x',
            'multiplier par 1,15, c’est augmenter de 15 %. Pour une baisse, le coefficient est plus petit que 1.',
          ],
        ],
        check:
          'pour un article à 80 €, la réduction est 0,15 × 80 = 12 et le nouveau prix 80 − 12 = 68. Avec la fonction, on retrouve 0,85 × 80 = 68.',
      },
    }),
  ],
})

const affines = defineExercise({
  id: 'fonctions-affines',
  title: 'Fonctions affines',
  theme: 'fonctions',
  difficulty: 'medium',
  description:
    'Fonctions affines f(x) = ax + b : image, antécédent, rôle de a et de b, point sur la droite, expression à partir de deux images, puis comparaison de deux tarifs.',
  lesson: paragraphs(
    'Une **fonction affine** est une fonction de la forme f(x) = ax + b, où a et b sont deux nombres fixés.',
    [
      '- a est le **coefficient directeur** : quand x augmente de 1, l’image augmente de a (elle diminue si a est négatif).',
      '- b est l’**ordonnée à l’origine** : c’est l’image de 0, car f(0) = a × 0 + b = b.',
      '- La représentation graphique de f est une droite. Un point de coordonnées (x ; y) est sur cette droite si, et seulement si, y = f(x).',
    ].join('\n'),
    figure(
      'fonction-affine-a-et-b',
      'La droite de f, ici avec a égal à 2 et b à 1 : elle coupe l’axe des ordonnées en b ; quand x avance de 1, elle monte de a.',
    ),
    figure(
      'fonction-affine-signe-de-a',
      'Trois droites : elle monte si a > 0, elle descend si a < 0, elle est horizontale si a est nul.',
    ),
    '**Pour aller plus loin : trouver a et b avec deux images.** Calcule d’abord a = différence des images ÷ différence des antécédents, en prenant les deux différences dans le même ordre. Trouve ensuite b en écrivant l’une des deux images.',
    '**Comparer deux tarifs.** Cherche le nombre pour lequel ils coûtent le même prix, puis teste un nombre de chaque côté.',
    'Deux cas particuliers : si b = 0, la fonction est linéaire ; si a = 0, elle est constante.',
  ),
  example: [
    {
      statement: 'La fonction affine f vérifie f(2) = 7 et f(5) = 16. Trouve l’expression de f(x).',
      figure: {
        id: 'fonction-affine-exemple-deux-images',
        alt: 'Tableau : x vaut 2 puis 5, soit + 3 ; f(x) vaut 7 puis 16, soit + 9.',
      },
      steps: [
        [
          'a = (16 − 7) ÷ (5 − 2)',
          'On calcule d’abord le coefficient directeur : la différence des images, divisée par la différence des antécédents. Les deux différences se prennent dans le même ordre : f(5) − f(2) pour les images, 5 − 2 pour les antécédents.',
        ],
        [
          'a = 9 ÷ 3 = 3',
          'Quand x augmente de 3, l’image augmente de 9 : elle augmente donc de 3 quand x augmente de 1.',
        ],
        [
          '3 × 2 + b = 7',
          'On sait maintenant que f(x) = 3x + b. Pour trouver b, on écrit l’une des images connues : ici, f(2) = 7.',
        ],
        ['b = 7 − 6 = 1', 'On calcule 3 × 2 = 6, puis on soustrait 6 aux deux membres.'],
      ],
      conclusion: 'f(x) = 3x + 1. On vérifie avec l’autre image : f(5) = 3 × 5 + 1 = 16.',
    },
    {
      statement:
        'La fonction g est définie par g(x) = 2x − 3. Le point A(4 ; 6) est-il sur la droite qui représente g ?',
      figure: {
        id: 'fonction-affine-exemple-point',
        alt: 'Dans un repère, la droite de g et le point A de coordonnées (4 ; 6).',
      },
      steps: [
        [
          'g(4) = 2 × 4 − 3 = 5',
          'Un point est sur la droite si son ordonnée est l’image de son abscisse. L’abscisse de A est 4 : on calcule g(4).',
        ],
        [
          '5 ≠ 6',
          'On compare l’image trouvée, 5, à l’ordonnée de A, qui est 6 : elles sont différentes.',
        ],
      ],
      conclusion:
        'Le point A n’est pas sur la droite. Le point de la droite qui a pour abscisse 4 est le point (4 ; 5).',
    },
  ],
  questions: [
    qcm({
      prompt:
        'La fonction affine f est définie par f(x) = −3x + 8. Quelle est l’image de 5 par f ?',
      choices: ['23', '1', '25', '−7'],
      answer: '−7',
      correction: {
        steps: [
          [
            'f(5) = −3 × 5 + 8',
            'On remplace x par 5 dans l’expression de f. Le coefficient −3 multiplie 5.',
          ],
          [
            'f(5) = −15 + 8 = −7',
            'La multiplication est prioritaire : −3 × 5 = −15. On ajoute ensuite 8 : l’image de 5 par f est −7.',
          ],
        ],
        traps: [
          ['23', 'le signe du coefficient est oublié : 3 × 5 + 8 = 23, alors que −3 × 5 = −15.'],
          [
            '25',
            'l’addition a été faite avant la multiplication : (−3 + 8) × 5 = 25. Or la multiplication est prioritaire.',
          ],
          ['1', 'c’est l’antécédent de 5, car −3 × 1 + 8 = 5. La question demande l’image de 5.'],
        ],
        check:
          'f(4) = −3 × 4 + 8 = −4. Quand x augmente de 1, l’image diminue de 3 : on retrouve −4 − 3 = −7.',
      },
    }),
    qcm({
      prompt:
        'La fonction affine g est définie par g(x) = 4x − 6. Quel est l’antécédent de 14 par g ?',
      choices: ['50', '2', '5', '9,5'],
      answer: '5',
      correction: {
        steps: [
          [
            '4x − 6 = 14',
            'On cherche le nombre x dont l’image est 14 : on résout l’équation g(x) = 14.',
          ],
          ['4x = 14 + 6 = 20', 'On ajoute 6 aux deux membres.'],
          ['x = 20 ÷ 4 = 5', 'On divise les deux membres par 4 : l’antécédent de 14 par g est 5.'],
        ],
        traps: [
          [
            '50',
            'c’est l’image de 14, car 4 × 14 − 6 = 50. Ici, 14 est le résultat, et non le nombre de départ.',
          ],
          [
            '2',
            'le nombre 6 a été soustrait au lieu d’être ajouté : (14 − 6) ÷ 4 = 2. Pour annuler une soustraction, on ajoute.',
          ],
          [
            '9,5',
            'la division par 4 a été faite en premier, sans diviser le 6 : 14 ÷ 4 + 6 = 9,5. On ajoute 6 d’abord, on divise ensuite.',
          ],
        ],
        check: 'g(5) = 4 × 5 − 6 = 14.',
      },
    }),
    qcm({
      prompt:
        'La fonction affine h est définie par h(x) = 6 − 5x. Quels sont son coefficient directeur a et son ordonnée à l’origine b ?',
      choices: ['a = −5 et b = 6', 'a = 6 et b = −5', 'a = 5 et b = 6', 'a = 6 et b = 5'],
      answer: 'a = −5 et b = 6',
      correction: {
        steps: [
          [
            'h(x) = −5x + 6',
            'On range l’expression sous la forme ax + b, le terme en x en premier : 6 − 5x = −5x + 6.',
          ],
          [
            'h(0) = 6 − 5 × 0 = 6',
            'L’ordonnée à l’origine b est l’image de 0 : c’est le nombre sans x, ici 6.',
          ],
          [
            'a = −5 et b = 6',
            'Le coefficient directeur a est le nombre qui multiplie x, avec son signe : ici −5.',
          ],
        ],
        traps: [
          [
            'a = 6 et b = −5',
            'les deux nombres sont lus dans l’ordre où ils sont écrits. Or a est le nombre qui multiplie x, quelle que soit sa place.',
          ],
          [
            'a = 5 et b = 6',
            'le signe moins fait partie du coefficient directeur : 6 − 5x = 6 + (−5) × x.',
          ],
          [
            'a = 6 et b = 5',
            'les rôles sont inversés, et le signe du coefficient directeur est oublié.',
          ],
        ],
        check:
          'h(0) = 6 et h(1) = 6 − 5 × 1 = 1 : quand x augmente de 1, l’image diminue de 5. Le coefficient directeur est bien −5.',
      },
    }),
    qcm({
      prompt:
        'La fonction affine k est définie par k(x) = 3x − 4. Lequel de ces points, donnés par leurs coordonnées, est sur la droite qui représente k ?',
      choices: ['(11 ; 5)', '(5 ; 11)', '(2 ; 10)', '(0 ; 3)'],
      answer: '(5 ; 11)',
      correction: {
        steps: [
          [
            'k(5) = 3 × 5 − 4 = 11',
            'Un point est sur la droite si son ordonnée est l’image de son abscisse. On teste l’abscisse 5 : son image est 11.',
          ],
          [
            'Le point (5 ; 11) est sur la droite',
            'Son abscisse est 5 et son ordonnée est 11, qui est bien l’image de 5.',
          ],
        ],
        traps: [
          [
            '(11 ; 5)',
            'les coordonnées sont inversées. L’abscisse s’écrit en premier : k(11) = 3 × 11 − 4 = 29, et non 5.',
          ],
          [
            '(2 ; 10)',
            'le nombre 4 a été ajouté au lieu d’être soustrait : k(2) = 3 × 2 − 4 = 2, et non 10.',
          ],
          [
            '(0 ; 3)',
            'l’image de 0 est l’ordonnée à l’origine, −4, et non le coefficient directeur, 3.',
          ],
        ],
      },
    }),
    qcm({
      prompt: 'Une fonction affine p vérifie p(1) = 7 et p(4) = 1. Quelle est son expression ?',
      choices: ['p(x) = 2x + 5', 'p(x) = −6x + 13', 'p(x) = −2x + 7', 'p(x) = −2x + 9'],
      answer: 'p(x) = −2x + 9',
      correction: {
        steps: [
          [
            'p(1) = −2 × 1 + 9 = 7 et p(4) = −2 × 4 + 9 = 1',
            'Première méthode : on teste chaque expression proposée, en calculant l’image de 1 et celle de 4. Seule p(x) = −2x + 9 redonne les deux images de l’énoncé.',
          ],
          [
            'a = (1 − 7) ÷ (4 − 1) = −6 ÷ 3 = −2',
            'Seconde méthode, sans regarder les choix. Quand x passe de 1 à 4, il augmente de 3, et l’image passe de 7 à 1 : elle diminue de 6. Elle diminue donc de 2 quand x augmente de 1 : le coefficient directeur est −2.',
          ],
          [
            '−2 × 1 + b = 7',
            'On sait maintenant que p(x) = −2x + b. Pour trouver b, on écrit l’une des images connues : ici, p(1) = 7.',
          ],
          ['b = 7 + 2 = 9', 'On calcule −2 × 1 = −2, puis on ajoute 2 aux deux membres.'],
          ['p(x) = −2x + 9', 'Les deux méthodes donnent la même expression.'],
        ],
        traps: [
          [
            'p(x) = 2x + 5',
            'les deux différences ne sont pas prises dans le même ordre : (7 − 1) ÷ (4 − 1) = 2. Avec cette expression, l’image de 4 serait 13.',
          ],
          [
            'p(x) = −6x + 13',
            'la différence des images, −6, n’a pas été divisée par la différence des antécédents, 3. Avec cette expression, l’image de 4 serait −11.',
          ],
          [
            'p(x) = −2x + 7',
            'b est l’image de 0, et non celle de 1. Avec cette expression, l’image de 1 serait 5.',
          ],
        ],
        check:
          'quand x augmente de 1, l’image diminue de 2 : p(2) = 5, p(3) = 3, puis p(4) = 1. On retrouve bien l’image de 4.',
      },
    }),
    qcm({
      prompt:
        'Une piscine propose deux tarifs. Tarif A : une carte à 15 €, puis 9 € par entrée. Tarif B : un abonnement à 75 €, puis 3 € par entrée. Pour x entrées, le tarif A coûte 9x + 15 euros et le tarif B coûte 3x + 75 euros : ce sont deux fonctions affines de x. Quel est le tarif le moins cher, selon le nombre d’entrées ?',
      figure: {
        id: 'fonction-affine-q6-piscine',
        alt: 'Les deux tarifs de la piscine. A : carte de 15 €, puis 9 € par entrée. B : abonnement de 75 €, puis 3 € par entrée.',
      },
      choices: [
        'Le tarif B, quel que soit le nombre d’entrées',
        'Le tarif A en dessous de 10 entrées, le tarif B au-dessus',
        'Le tarif B en dessous de 10 entrées, le tarif A au-dessus',
        'Le tarif A en dessous de 60 entrées, le tarif B au-dessus',
      ],
      answer: 'Le tarif A en dessous de 10 entrées, le tarif B au-dessus',
      correction: {
        steps: [
          [
            '9x + 15 = 3x + 75',
            'On cherche d’abord le nombre d’entrées pour lequel les deux tarifs coûtent le même prix.',
          ],
          ['6x = 60', 'On soustrait 3x aux deux membres, puis on soustrait 15 aux deux membres.'],
          [
            'x = 60 ÷ 6 = 10',
            'On divise les deux membres par 6. Pour 10 entrées, les deux tarifs coûtent le même prix.',
          ],
          [
            '9 × 5 + 15 = 60 et 3 × 5 + 75 = 90',
            'On teste un nombre plus petit que 10. Pour 5 entrées, le tarif A coûte 60 € et le tarif B 90 € : le tarif A est le moins cher.',
          ],
          [
            '9 × 20 + 15 = 195 et 3 × 20 + 75 = 135',
            'On teste un nombre plus grand que 10. Pour 20 entrées, le tarif A coûte 195 € et le tarif B 135 € : le tarif B est le moins cher.',
          ],
          [
            'Le tarif A en dessous de 10 entrées, le tarif B au-dessus',
            'À 10 entrées, les prix sont égaux. Chaque entrée de plus coûte 9 € au tarif A contre 3 € au tarif B : au-dessus de 10 entrées, le tarif A est le plus cher. Chaque entrée de moins fait économiser 9 € au tarif A contre 3 € au tarif B : en dessous de 10 entrées, le tarif A est le moins cher. Un test de chaque côté suffit donc.',
          ],
        ],
        traps: [
          [
            'Le tarif B, quel que soit le nombre d’entrées',
            'l’abonnement de 75 € est oublié. Pour une seule entrée, le tarif B coûte 78 € et le tarif A 24 €.',
          ],
          [
            'Le tarif B en dessous de 10 entrées, le tarif A au-dessus',
            'la conclusion est inversée. Pour peu d’entrées, c’est le tarif A, sans gros abonnement, qui coûte le moins.',
          ],
          [
            'Le tarif A en dessous de 60 entrées, le tarif B au-dessus',
            'la résolution s’est arrêtée à 6x = 60. Il reste à diviser les deux membres par 6.',
          ],
        ],
        check:
          'pour 10 entrées, le tarif A coûte 9 × 10 + 15 = 105 et le tarif B coûte 3 × 10 + 75 = 105.',
      },
    }),
  ],
})

export const fonctions = [notion, lineaires, affines]
