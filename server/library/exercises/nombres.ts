import { defineExercise, figure, paragraphs, qcm } from '../authoring.js'

/**
 * Nombres et calculs : fractions, puissances, racines carrées, nombres premiers.
 * Quatre QCM. Chaque mauvais choix est le résultat d'une erreur courante, que la
 * correction nomme.
 */

const fractions = defineExercise({
  id: 'fractions-quatre-operations',
  title: 'Fractions : les quatre opérations',
  theme: 'nombres',
  difficulty: 'medium',
  description:
    'Additionner, soustraire, multiplier et diviser des fractions, respecter les priorités et simplifier le résultat. Six questions, dont un problème ; chaque mauvais choix correspond à une erreur courante.',
  intro:
    'Travaille sans calculatrice. Chaque résultat est attendu sous la forme d’une fraction irréductible.',
  lesson: paragraphs(
    'Chaque opération sur les fractions a sa règle.',
    [
      '- **Additionner ou soustraire** : on écrit les deux fractions avec le même dénominateur, un multiple commun aux deux dénominateurs. Puis on ajoute ou on soustrait les numérateurs, et on garde le dénominateur commun.',
      '- **Multiplier** : a/b × c/d = (a × c)/(b × d). On multiplie les numérateurs entre eux et les dénominateurs entre eux.',
      '- **Diviser** : a/b ÷ c/d = a/b × d/c. Diviser par une fraction, c’est multiplier par son inverse. L’inverse de 3/4 est 4/3.',
      '- **Prendre une fraction d’une quantité**, c’est multiplier : les 2/3 de 60 valent 2/3 × 60 = 40.',
    ].join('\n'),
    'Pourquoi un dénominateur commun ? Pour ajouter 1/2 et 1/3, on redécoupe les deux bandes en parts de même taille, des sixièmes : 1/2 + 1/3 = 3/6 + 2/6 = 5/6.',
    figure(
      'fractions-meme-denominateur',
      'Deux bandes redécoupées en sixièmes : 1/2 devient 3/6, 1/3 devient 2/6, et leur somme couvre 5/6 de la bande.',
    ),
    figure(
      'fractions-d-une-quantite',
      'Une bande de 60 partagée en trois parts de 20 ; deux parts coloriées font les 2/3 de 60, soit 40.',
    ),
    '**Priorités** : sans parenthèses, les multiplications et les divisions se font avant les additions et les soustractions.',
    'Une fraction est **irréductible** quand son numérateur et son dénominateur n’ont plus de diviseur commun autre que 1. On termine toujours un calcul en simplifiant le résultat.',
  ),
  example: [
    {
      statement: 'Calcule P = 7/10 + 2/15.',
      steps: [
        [
          '7/10 = 21/30 et 2/15 = 4/30',
          'On ne peut ajouter que des fractions de même dénominateur. On cherche un multiple commun à 10 et à 15 : on choisit 30, car 30 = 10 × 3 et 30 = 15 × 2. On multiplie donc 7 et 10 par 3, puis 2 et 15 par 2.',
        ],
        [
          '7/10 + 2/15 = 21/30 + 4/30 = 25/30',
          'Les deux fractions s’expriment maintenant en trentièmes : on ajoute les numérateurs, 21 + 4 = 25, et on garde le dénominateur.',
        ],
        [
          '25/30 = (5 × 5)/(5 × 6) = 5/6',
          'Le calcul n’est pas terminé : 25 et 30 sont dans la table de 5, on simplifie donc par 5.',
        ],
      ],
      conclusion: 'P = 5/6. Cette fraction est irréductible.',
    },
    {
      statement: 'Calcule Q = 7/8 − 1/4 ÷ 2/3.',
      steps: [
        [
          '1/4 ÷ 2/3 = 1/4 × 3/2',
          'Il n’y a pas de parenthèses : la division est prioritaire sur la soustraction, on commence donc par elle. Diviser par 2/3, c’est multiplier par son inverse, 3/2.',
        ],
        [
          '1/4 × 3/2 = (1 × 3)/(4 × 2) = 3/8',
          'On multiplie les numérateurs entre eux et les dénominateurs entre eux.',
        ],
        [
          '7/8 − 3/8 = 4/8 = 1/2',
          'Il reste la soustraction. Les deux fractions ont déjà le même dénominateur : on soustrait les numérateurs, puis on simplifie par 4.',
        ],
      ],
      conclusion:
        'Q = 1/2. En calculant de gauche à droite, on aurait trouvé (7/8 − 1/4) ÷ 2/3 = 15/16 : un résultat faux.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Calcule A = 3/4 + 1/6.',
      choices: ['2/5', '11/12', '1/3', '1/8'],
      answer: '11/12',
      correction: {
        steps: [
          [
            '3/4 = 9/12 et 1/6 = 2/12',
            'Les dénominateurs sont différents : on cherche un multiple commun à 4 et à 6. On choisit 12, car 12 = 4 × 3 et 12 = 6 × 2. On multiplie donc 3 et 4 par 3, puis 1 et 6 par 2.',
          ],
          [
            '3/4 + 1/6 = 9/12 + 2/12 = 11/12',
            'Les deux fractions s’expriment maintenant en douzièmes : on ajoute les numérateurs, 9 + 2 = 11, et on garde le dénominateur. Comme 11 et 12 n’ont aucun diviseur commun autre que 1, la fraction 11/12 est irréductible.',
          ],
        ],
        traps: [
          [
            '2/5',
            'les numérateurs et les dénominateurs ont été ajoutés entre eux : (3 + 1)/(4 + 6) = 4/10, soit 2/5. Or 2/5 est plus petit que 3/4 : en ajoutant 1/6 à 3/4, on ne peut pas trouver moins que 3/4.',
          ],
          [
            '1/3',
            'le dénominateur commun 12 est le bon, mais les numérateurs n’ont pas été transformés : (3 + 1)/12 = 4/12, soit 1/3.',
          ],
          [
            '1/8',
            'les fractions ont été multipliées au lieu d’être ajoutées : (3 × 1)/(4 × 6) = 3/24, soit 1/8.',
          ],
        ],
        check: '3/4 = 0,75 et 1/6 ≈ 0,17 : la somme vaut environ 0,92. Or 11/12 ≈ 0,92.',
      },
    }),
    qcm({
      prompt: 'Calcule B = 5/6 − 3/10. Attention : le résultat doit être irréductible.',
      choices: ['16/30', '1/15', '11/15', '8/15'],
      answer: '8/15',
      correction: {
        steps: [
          [
            '5/6 = 25/30 et 3/10 = 9/30',
            'On cherche un multiple commun à 6 et à 10 : on choisit 30, car 30 = 6 × 5 et 30 = 10 × 3. On multiplie donc 5 et 6 par 5, puis 3 et 10 par 3.',
          ],
          [
            '5/6 − 3/10 = 25/30 − 9/30 = 16/30',
            'Les deux fractions ont le même dénominateur : on soustrait les numérateurs, 25 − 9 = 16, et on garde le dénominateur.',
          ],
          [
            '16/30 = (2 × 8)/(2 × 15) = 8/15',
            'Le calcul n’est pas terminé : 16 et 30 sont pairs, on simplifie donc par 2. Ensuite, 8 et 15 n’ont plus de diviseur commun autre que 1 : la fraction 8/15 est irréductible.',
          ],
        ],
        traps: [
          [
            '16/30',
            'cette fraction est bien égale à B, mais elle n’est pas irréductible : 16 et 30 se divisent encore par 2.',
          ],
          [
            '1/15',
            'le dénominateur commun 30 est le bon, mais aucun numérateur n’a été transformé : (5 − 3)/30 = 2/30, soit 1/15.',
          ],
          [
            '11/15',
            'pour 3/10, le dénominateur a bien été remplacé par 30, mais le numérateur n’a pas été multiplié par 3 : 25/30 − 3/30 = 22/30, soit 11/15.',
          ],
        ],
        check: '5/6 ≈ 0,83 et 3/10 = 0,3 : la différence vaut environ 0,53. Or 8/15 ≈ 0,53.',
      },
    }),
    qcm({
      prompt: 'Calcule C = 4/9 × 3/8.',
      choices: ['1/6', '32/27', '12/17', '7/17'],
      answer: '1/6',
      correction: {
        steps: [
          [
            '4/9 × 3/8 = (4 × 3)/(9 × 8)',
            'Pour multiplier deux fractions, on multiplie les numérateurs entre eux et les dénominateurs entre eux. Aucun dénominateur commun n’est nécessaire.',
          ],
          [
            '(4 × 3)/(9 × 8) = (4 × 3)/(3 × 3 × 4 × 2)',
            'Avant de calculer, on décompose le dénominateur : 9 = 3 × 3 et 8 = 4 × 2. Les facteurs 4 et 3 figurent alors au numérateur et au dénominateur.',
          ],
          [
            '(4 × 3)/(3 × 3 × 4 × 2) = 1/(3 × 2) = 1/6',
            'On simplifie par 4 et par 3. Il reste 1 au numérateur, et non 0, et 3 × 2 = 6 au dénominateur.',
          ],
        ],
        traps: [
          [
            '32/27',
            'la seconde fraction a été inversée : 4/9 × 8/3 = 32/27. Inverser, c’est la règle de la division.',
          ],
          [
            '12/17',
            'les numérateurs ont bien été multipliés, mais les dénominateurs ont été ajoutés : 9 + 8 = 17.',
          ],
          [
            '7/17',
            'les numérateurs et les dénominateurs ont été ajoutés entre eux : (4 + 3)/(9 + 8) = 7/17.',
          ],
        ],
        check:
          'sans simplifier d’abord, on trouve (4 × 3)/(9 × 8) = 12/72, et 12/72 = 1/6 en simplifiant par 12.',
      },
    }),
    qcm({
      prompt: 'Calcule D = 3/5 ÷ 9/10.',
      choices: ['27/50', '3/2', '2/3', '50/27'],
      answer: '2/3',
      correction: {
        steps: [
          [
            '3/5 ÷ 9/10 = 3/5 × 10/9',
            'Diviser par une fraction, c’est multiplier par son inverse. L’inverse de 9/10 est 10/9 : on échange le numérateur et le dénominateur. La première fraction, 3/5, ne change pas.',
          ],
          [
            '3/5 × 10/9 = (3 × 10)/(5 × 9) = (3 × 2 × 5)/(5 × 3 × 3)',
            'On multiplie les numérateurs entre eux et les dénominateurs entre eux, puis on décompose : 10 = 2 × 5 et 9 = 3 × 3.',
          ],
          [
            '(3 × 2 × 5)/(5 × 3 × 3) = 2/3',
            'On simplifie par 3 et par 5 : il reste 2 au numérateur et 3 au dénominateur.',
          ],
        ],
        traps: [
          [
            '27/50',
            'la seconde fraction n’a pas été inversée : c’est le produit 3/5 × 9/10, et non le quotient.',
          ],
          [
            '3/2',
            'c’est la première fraction qui a été inversée : 5/3 × 9/10 = 45/30, soit 3/2. On inverse toujours la fraction par laquelle on divise.',
          ],
          [
            '50/27',
            'les deux fractions ont été inversées : 5/3 × 10/9 = 50/27. Seule la seconde doit l’être.',
          ],
        ],
        check:
          'on multiplie le résultat par le diviseur : 2/3 × 9/10 = 18/30 = 3/5. On retrouve bien la fraction de départ.',
      },
    }),
    qcm({
      prompt: 'Calcule E = 5/6 − 1/3 × 3/4.',
      choices: ['3/8', '2', '7/18', '7/12'],
      answer: '7/12',
      correction: {
        steps: [
          [
            '1/3 × 3/4 = 3/12 = 1/4',
            'Il n’y a pas de parenthèses : la multiplication est prioritaire sur la soustraction. On calcule donc d’abord le produit, puis on le simplifie par 3.',
          ],
          ['E = 5/6 − 1/4', 'On remplace le produit par son résultat. Il reste une soustraction.'],
          [
            '5/6 − 1/4 = 10/12 − 3/12 = 7/12',
            'On met les deux fractions au même dénominateur, 12, puis on soustrait les numérateurs : 10 − 3 = 7. La fraction 7/12 est irréductible.',
          ],
        ],
        traps: [
          [
            '3/8',
            'le calcul a été fait de gauche à droite : (5/6 − 1/3) × 3/4 = 1/2 × 3/4 = 3/8. Sans parenthèses, la multiplication passe avant la soustraction.',
          ],
          [
            '2',
            'la priorité est respectée, mais dans 5/6 − 1/4 les numérateurs et les dénominateurs ont été soustraits entre eux : 5 − 1 = 4 et 6 − 4 = 2, ce qui donne 4/2, soit 2.',
          ],
          [
            '7/18',
            'la priorité est respectée, mais le produit est faux : la fraction 3/4 a été inversée, comme dans une division. On obtient alors 1/3 × 4/3 = 4/9, puis 5/6 − 4/9 = 7/18.',
          ],
        ],
        check: '5/6 ≈ 0,83 et 1/4 = 0,25 : la différence vaut environ 0,58. Or 7/12 ≈ 0,58.',
      },
    }),
    qcm({
      prompt:
        'Léa reçoit de l’argent pour son anniversaire. Elle en dépense 1/4 pour un livre, puis 2/5 de ce qui lui reste pour un jeu. Quelle fraction de la somme de départ lui reste-t-il à la fin ?',
      figure: {
        id: 'fractions-lea-barre',
        alt: 'Une barre : 1/4 pour le livre ; le reste, partagé en cinq, dont 2/5 pour le jeu ; ce qui reste à la fin est cherché.',
      },
      choices: ['7/20', '9/20', '3/10', '11/20'],
      answer: '9/20',
      correction: {
        steps: [
          [
            '1 − 1/4 = 3/4',
            'La somme de départ correspond à 1, c’est-à-dire à 4/4. Après l’achat du livre, il reste les 3/4 de la somme.',
          ],
          [
            '2/5 × 3/4 = 6/20 = 3/10',
            'Le jeu coûte 2/5 de ce qui reste, donc 2/5 des 3/4 de la somme. Prendre une fraction d’une quantité, c’est multiplier : le jeu coûte 3/10 de la somme de départ.',
          ],
          [
            '3/4 − 3/10 = 15/20 − 6/20 = 9/20',
            'On retire le prix du jeu de ce qui restait. On met au même dénominateur, 20, puis on soustrait : il reste à Léa 9/20 de la somme de départ.',
          ],
        ],
        traps: [
          [
            '7/20',
            'les 2/5 ont été pris sur la somme de départ, et non sur ce qui reste : 1 − 1/4 − 2/5 = 7/20. L’énoncé dit pourtant « 2/5 de ce qui lui reste ».',
          ],
          [
            '3/10',
            'c’est la fraction de la somme dépensée pour le jeu, pas celle qui reste à la fin.',
          ],
          [
            '11/20',
            'c’est la fraction dépensée en tout : 1/4 + 3/10 = 11/20. La question porte sur ce qui reste.',
          ],
        ],
        check:
          'avec une somme de 40 €, le livre coûte 10 € et il reste 30 €. Le jeu coûte 2/5 × 30 = 12, soit 12 €. Il reste 18 € à la fin, et 18/40 = 9/20.',
      },
    }),
  ],
})

const puissances = defineExercise({
  id: 'puissances-et-notation-scientifique',
  title: 'Puissances et notation scientifique',
  theme: 'nombres',
  difficulty: 'medium',
  description:
    'Calculer avec les puissances d’un nombre, lire une puissance de 10 d’exposant négatif, passer à l’écriture scientifique, multiplier deux nombres ainsi écrits et estimer un ordre de grandeur.',
  intro: 'Travaille sans calculatrice : elle sert seulement à vérifier tes résultats.',
  lesson: paragraphs(
    'La **puissance** 2⁵ est le produit de 5 facteurs égaux à 2 : 2⁵ = 2 × 2 × 2 × 2 × 2 = 32. Le nombre 5 est l’**exposant**.',
    [
      '- Exposant négatif : 2⁻³ est l’inverse de 2³, donc 2⁻³ = 1/2³ = 1/8.',
      '- Puissances de 10 : 10⁴ = 10 000 (un 1 suivi de 4 zéros) et 10⁻⁴ = 0,0001 (le 1 est le quatrième chiffre après la virgule).',
    ].join('\n'),
    figure(
      'puissances-echelle-de-10',
      'L’échelle des puissances de 10, de 10⁻³ à 10⁶, avec leurs écritures décimales ; on monte d’une marche en multipliant par 10.',
    ),
    'Pour calculer avec des puissances d’un même nombre, on revient à la définition et on compte les facteurs :',
    [
      '- produit : 2³ × 2⁴ = 2⁷, car 3 + 4 = 7 ;',
      '- quotient : 2⁷ ÷ 2⁴ = 2³, car 7 − 4 = 3 ;',
      '- puissance de puissance : (2³)² = 2³ × 2³ = 2⁶, car 2 × 3 = 6.',
    ].join('\n'),
    'L’**écriture scientifique** d’un nombre positif est le produit d’un nombre décimal a, tel que 1 ≤ a < 10, par une puissance de 10. Le nombre a s’écrit donc avec un seul chiffre avant la virgule, différent de 0. Par exemple, 5 300 = 5,3 × 10³ et 0,0026 = 2,6 × 10⁻³.',
    figure(
      'puissances-decalage-virgule',
      'Multiplier par 10³ décale la virgule de 3 rangs vers la droite ; multiplier par 10⁻³ la décale de 3 rangs vers la gauche.',
    ),
    'Un **ordre de grandeur** d’un nombre est une valeur simple, proche de ce nombre. Dans cet exercice, comme en physique-chimie, on prend la puissance de 10 la plus proche : pour 2,1 × 10⁵, c’est 10⁵ ; pour 8,7 × 10⁵, c’est 10⁶, car 8,7 est plus proche de 10 que de 1.',
  ),
  example: [
    {
      statement: 'Écris P = (7³)² × 7⁴ ÷ 7⁸ sous la forme d’une puissance de 7.',
      steps: [
        [
          '(7³)² = 7³ × 7³ = 7⁶',
          'On commence par la parenthèse. Élever 7³ au carré, c’est le multiplier par lui-même : on obtient 2 fois 3 facteurs égaux à 7, soit 6 facteurs.',
        ],
        [
          '7⁶ × 7⁴ = 7¹⁰',
          'On multiplie : 6 facteurs, puis 4 facteurs, cela fait 6 + 4 = 10 facteurs égaux à 7.',
        ],
        [
          '7¹⁰ ÷ 7⁸ = 7²',
          'On divise : les 8 facteurs du diviseur se simplifient avec 8 des 10 facteurs. Il en reste 10 − 8 = 2.',
        ],
      ],
      conclusion: 'P = 7², c’est-à-dire 49.',
    },
    {
      statement: 'Donne l’écriture scientifique de Q = 6 × 10⁴ × 4,5 × 10⁻⁷.',
      steps: [
        [
          'Q = (6 × 4,5) × (10⁴ × 10⁻⁷)',
          'Dans un produit, on peut changer l’ordre des facteurs : on regroupe les nombres d’un côté, les puissances de 10 de l’autre.',
        ],
        [
          '6 × 4,5 = 27 et 10⁴ × 10⁻⁷ = 10⁻³',
          'On calcule chaque groupe. Multiplier par 10⁻⁷, c’est diviser par 10⁷ : les 4 facteurs 10 se simplifient, il en reste 3 au dénominateur. Cela revient à ajouter les exposants : 4 + (−7) = −3.',
        ],
        [
          '27 × 10⁻³ = 2,7 × 10 × 10⁻³ = 2,7 × 10⁻²',
          '27 dépasse 10 : ce n’est pas encore une écriture scientifique. On écrit 27 = 2,7 × 10, puis on regroupe les puissances de 10 : 1 + (−3) = −2.',
        ],
      ],
      conclusion: 'Q = 2,7 × 10⁻², c’est-à-dire 0,027.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Écris 3⁴ × 3² sous la forme d’une puissance de 3.',
      choices: ['3⁸', '9⁶', '3⁶', '9⁸'],
      answer: '3⁶',
      correction: {
        steps: [
          [
            '3⁴ × 3² = (3 × 3 × 3 × 3) × (3 × 3)',
            'On revient à la définition : 3⁴ est le produit de 4 facteurs égaux à 3, et 3² le produit de 2 facteurs égaux à 3.',
          ],
          [
            '3⁴ × 3² = 3⁶',
            'En tout, on compte 4 + 2 = 6 facteurs égaux à 3. Pour multiplier deux puissances d’un même nombre, on ajoute les exposants.',
          ],
        ],
        traps: [
          [
            '3⁸',
            'les exposants ont été multipliés : 4 × 2 = 8. On les multiplie pour une puissance de puissance, comme (3⁴)² ; dans un produit, on les ajoute.',
          ],
          [
            '9⁶',
            'les exposants sont bien ajoutés, mais les deux 3 ont été multipliés entre eux. Le nombre 3 ne change pas : seul le nombre de facteurs augmente.',
          ],
          ['9⁸', 'les 3 ont été multipliés entre eux, et les exposants aussi.'],
        ],
        check: '3⁴ × 3² = 81 × 9 = 729, et 3⁶ = 729.',
      },
    }),
    qcm({
      prompt: 'Écris (5²)³ ÷ 5⁴ sous la forme d’une puissance de 5.',
      choices: ['5¹', '5²', '1²', '5¹⁰'],
      answer: '5²',
      correction: {
        steps: [
          [
            '(5²)³ = 5² × 5² × 5² = 5⁶',
            'On commence par la parenthèse. Élever 5² au cube, c’est écrire 3 facteurs égaux à 5². Chacun d’eux est le produit de 2 facteurs égaux à 5 : en tout, 3 × 2 = 6 facteurs.',
          ],
          [
            '5⁶ = 5⁴ × 5²',
            'Pour diviser par 5⁴, on sépare les 6 facteurs de 5⁶ en deux groupes : 4 facteurs d’un côté, 2 de l’autre.',
          ],
          [
            '5⁶ ÷ 5⁴ = 5²',
            'Diviser par 5⁴ supprime le groupe de 4 facteurs : il en reste 6 − 4 = 2. Pour diviser deux puissances d’un même nombre, on soustrait les exposants.',
          ],
        ],
        traps: [
          [
            '5¹',
            'dans (5²)³, les exposants ont été ajoutés : 2 + 3 = 5, ce qui donne 5⁵ ÷ 5⁴ = 5¹. Or (5²)³ contient 3 fois 2 facteurs, soit 6 facteurs.',
          ],
          [
            '1²',
            'les deux 5 ont été divisés entre eux. Le nombre 5 ne change pas : seuls les exposants se soustraient.',
          ],
          [
            '5¹⁰',
            'les exposants 6 et 4 ont été ajoutés : c’est la règle du produit. Dans un quotient, on les soustrait.',
          ],
        ],
        check: '(5²)³ = 25³ = 15 625 et 5⁴ = 625. Or 15 625 ÷ 625 = 25, et 25 = 5².',
      },
    }),
    qcm({
      prompt: 'Quelle est l’écriture décimale de 10² × 10⁻⁵ ?',
      choices: ['1 000', '−1 000', '0,0001', '0,001'],
      answer: '0,001',
      correction: {
        steps: [
          [
            '10² × 10⁻⁵ = 10²/10⁵',
            'Par définition, 10⁻⁵ est l’inverse de 10⁵ : multiplier par 10⁻⁵, c’est diviser par 10⁵.',
          ],
          [
            '10²/10⁵ = 1/10³ = 10⁻³',
            'On simplifie par les 2 facteurs 10 du numérateur : il en reste 5 − 2 = 3 au dénominateur. On retrouve la règle du produit, où l’on ajoute les exposants : 2 + (−5) = −3.',
          ],
          [
            '10⁻³ = 1/1 000 = 0,001',
            'C’est un millième : le chiffre 1 est le troisième chiffre après la virgule.',
          ],
        ],
        traps: [
          ['1 000', 'c’est 10³ : le signe de l’exposant a été oublié. 2 + (−5) = −3, et non 3.'],
          [
            '−1 000',
            'un exposant négatif ne donne pas un nombre négatif. 10⁻³ est l’inverse de 10³ : c’est un nombre positif, très petit.',
          ],
          [
            '0,0001',
            'trois zéros ont été écrits après la virgule : c’est 10⁻⁴. Dans 10⁻³, le chiffre 1 est le troisième chiffre après la virgule, il n’y a donc que deux zéros entre la virgule et lui.',
          ],
        ],
        check: 'la calculatrice confirme : 10² × 10⁻⁵ = 100 × 0,00001 = 0,001.',
      },
    }),
    qcm({
      prompt:
        'Le diamètre du Soleil est d’environ 1 390 000 km. Celui d’un globule rouge est d’environ 0,000007 m. Quelles sont, dans cet ordre, les écritures scientifiques de 1 390 000 et de 0,000007 ?',
      figure: {
        id: 'puissances-soleil-globule',
        alt: 'Le Soleil, de diamètre 1 390 000 km, et un globule rouge, de diamètre 0,000007 m ; schéma pas à l’échelle.',
      },
      choices: [
        '1,39 × 10⁶ et 7 × 10⁻⁶',
        '13,9 × 10⁵ et 7 × 10⁻⁶',
        '1,39 × 10⁶ et 7 × 10⁻⁵',
        '1,39 × 10⁻⁶ et 7 × 10⁶',
      ],
      answer: '1,39 × 10⁶ et 7 × 10⁻⁶',
      correction: {
        steps: [
          [
            '1 390 000 = 1,39 × 1 000 000 = 1,39 × 10⁶',
            'On place la virgule après le premier chiffre : 1,39 est bien compris entre 1 et 10. Pour retrouver 1 390 000, il faut décaler la virgule de 6 rangs vers la droite, donc multiplier par 1 000 000, c’est-à-dire par 10⁶.',
          ],
          [
            '0,000007 = 7 × 0,000001 = 7 × 10⁻⁶',
            'Le premier chiffre non nul est 7. Pour retrouver 0,000007, il faut décaler la virgule de 6 rangs vers la gauche, donc multiplier par 0,000001, c’est-à-dire par 10⁻⁶.',
          ],
          [
            '1,39 × 10⁶ et 7 × 10⁻⁶',
            'Un nombre plus grand que 10 a un exposant positif ; un nombre compris entre 0 et 1 a un exposant négatif.',
          ],
        ],
        traps: [
          [
            '13,9 × 10⁵ et 7 × 10⁻⁶',
            '13,9 × 10⁵ est bien égal à 1 390 000, mais 13,9 dépasse 10 : ce n’est pas une écriture scientifique.',
          ],
          [
            '1,39 × 10⁶ et 7 × 10⁻⁵',
            'pour 0,000007, seuls les 5 zéros placés après la virgule ont été comptés. Le 7 est le sixième chiffre après la virgule : l’exposant est −6.',
          ],
          [
            '1,39 × 10⁻⁶ et 7 × 10⁶',
            'les signes des deux exposants sont échangés. C’est le grand nombre qui a l’exposant positif.',
          ],
        ],
        check: 'on revient à l’écriture décimale : 1,39 × 10⁶ = 1 390 000 et 7 × 10⁻⁶ = 0,000007.',
      },
    }),
    qcm({
      prompt: 'Donne l’écriture scientifique du produit (5 × 10⁴) × (7 × 10⁻⁹).',
      choices: ['35 × 10⁻⁵', '3,5 × 10⁻⁶', '3,5 × 10⁻⁴', '3,5 × 10⁶'],
      answer: '3,5 × 10⁻⁴',
      correction: {
        steps: [
          [
            '(5 × 10⁴) × (7 × 10⁻⁹) = (5 × 7) × (10⁴ × 10⁻⁹)',
            'Dans un produit, on peut changer l’ordre des facteurs : on regroupe les nombres d’un côté, les puissances de 10 de l’autre.',
          ],
          [
            '5 × 7 = 35 et 10⁴ × 10⁻⁹ = 10⁻⁵',
            'On calcule chaque groupe. Pour les puissances de 10, on ajoute les exposants : 4 + (−9) = −5.',
          ],
          [
            '35 × 10⁻⁵ = 3,5 × 10 × 10⁻⁵ = 3,5 × 10⁻⁴',
            '35 dépasse 10 : ce n’est pas encore une écriture scientifique. On écrit 35 = 3,5 × 10, puis on regroupe les puissances de 10 : 1 + (−5) = −4.',
          ],
        ],
        traps: [
          [
            '35 × 10⁻⁵',
            'ce nombre est bien égal au produit, mais 35 n’est pas compris entre 1 et 10 : ce n’est pas une écriture scientifique.',
          ],
          [
            '3,5 × 10⁻⁶',
            'l’exposant a été corrigé dans le mauvais sens. 35 est 10 fois plus grand que 3,5 : pour compenser, l’exposant augmente de 1 et passe de −5 à −4.',
          ],
          [
            '3,5 × 10⁶',
            'les exposants ont été mal ajoutés : 4 + (−9) = −5, et non 5. Avec 35 × 10⁵, on arrive à 3,5 × 10⁶, un nombre de plusieurs millions.',
          ],
        ],
        check: 'la calculatrice confirme : 5 × 10⁴ × 7 × 10⁻⁹ = 0,00035, c’est-à-dire 3,5 × 10⁻⁴.',
      },
    }),
    qcm({
      prompt:
        'La lumière parcourt environ 3 × 10⁵ km par seconde. Une année dure environ 3,2 × 10⁷ secondes. Quel est l’ordre de grandeur, en km, de la distance que la lumière parcourt en une année ? On attend la puissance de 10 la plus proche.',
      figure: {
        id: 'puissances-annee-lumiere',
        alt: 'La lumière d’une étoile : 3 × 10⁵ km en 1 s ; en 1 an, soit 3,2 × 10⁷ s, la distance parcourue est cherchée.',
      },
      choices: ['10¹²', '10¹³', '10³⁵', '10²'],
      answer: '10¹³',
      correction: {
        steps: [
          [
            '3 × 10⁵ × 3,2 × 10⁷ = (3 × 3,2) × (10⁵ × 10⁷)',
            'La distance s’obtient en multipliant la distance parcourue en une seconde par le nombre de secondes. On regroupe les nombres d’un côté, les puissances de 10 de l’autre.',
          ],
          [
            '(3 × 3,2) × (10⁵ × 10⁷) = 9,6 × 10¹²',
            'On calcule 3 × 3,2 = 9,6, puis on ajoute les exposants : 5 + 7 = 12. La lumière parcourt environ 9,6 × 10¹² km en une année.',
          ],
          [
            '10 × 10¹² = 10¹³',
            'Le nombre 9,6 est très proche de 10 : la distance est donc proche de 10 × 10¹² km. La puissance de 10 la plus proche est 10¹³.',
          ],
        ],
        traps: [
          [
            '10¹²',
            'le facteur 9,6 a été oublié. Or 9,6 × 10¹² est presque dix fois plus grand que 10¹² : il est bien plus proche de 10¹³.',
          ],
          [
            '10³⁵',
            'les exposants ont été multipliés : 5 × 7 = 35. Dans un produit de puissances de 10, on les ajoute.',
          ],
          [
            '10²',
            'les exposants ont été soustraits : 7 − 5 = 2. On les soustrait dans un quotient, pas dans un produit.',
          ],
        ],
        check:
          'cette distance s’appelle une année-lumière. Une valeur plus précise est 9 461 milliards de kilomètres, soit près de 10 000 milliards : c’est bien 10¹³ km.',
      },
    }),
  ],
})

const racines = defineExercise({
  id: 'racines-carrees',
  title: 'Racines carrées',
  theme: 'nombres',
  difficulty: 'easy',
  description:
    'Définition de la racine carrée, carrés parfaits jusqu’à 225, encadrement entre deux entiers consécutifs, valeur approchée à la calculatrice, et le piège de la racine carrée d’une somme.',
  intro: 'Réponds sans calculatrice, sauf à la dernière question.',
  lesson: paragraphs(
    'La **racine carrée** d’un nombre positif a est le nombre positif dont le carré est égal à a. On la note √a.',
    [
      '- √49 = 7, car 7 est positif et 7² = 49. Attention : (−7)² = 49 aussi, mais −7 est négatif, ce n’est donc pas √49.',
      '- Pour tout nombre positif a : (√a)² = a.',
      '- Un nombre strictement négatif, comme −9, n’a pas de racine carrée : le carré d’un nombre est toujours positif.',
    ].join('\n'),
    'Pour le voir : un carré d’aire a a pour côté √a. Un carré d’aire 49 a pour côté 7.',
    figure(
      'racines-carre-aire',
      'Un carré d’aire a, de côté √a, et un carré d’aire 49, de côté 7.',
    ),
    'Les **carrés parfaits** sont les carrés des nombres entiers. De 1² à 15² : 1 ; 4 ; 9 ; 16 ; 25 ; 36 ; 49 ; 64 ; 81 ; 100 ; 121 ; 144 ; 169 ; 196 ; 225. Ceux de 1 à 144 sont à connaître par cœur.',
    'Quand un entier n’est pas un carré parfait, sa racine carrée n’est pas un entier. On l’encadre alors entre deux entiers consécutifs, ou on en donne une valeur approchée avec la calculatrice : √2 ≈ 1,41.',
    'Attention : en général, la racine carrée d’une somme n’est pas la somme des racines carrées. On calcule d’abord la somme, puis sa racine carrée.',
  ),
  example: [
    {
      statement: 'Encadre √40 entre deux entiers consécutifs.',
      figure: {
        id: 'racines-encadrement-40',
        alt: 'Deux droites graduées : 40 se place entre 36 et 49, donc √40 se place entre 6 et 7.',
      },
      steps: [
        [
          '6² = 36 et 7² = 49',
          '40 n’est pas un carré parfait : √40 n’est pas un entier. On cherche les deux carrés parfaits consécutifs qui entourent 40.',
        ],
        ['36 < 40 < 49', 'Le nombre 40 est compris entre ces deux carrés parfaits.'],
        [
          '6 < √40 < 7',
          'Les racines carrées sont rangées dans le même ordre que les nombres : √36 < √40 < √49.',
        ],
      ],
      conclusion: '6 < √40 < 7. La calculatrice le confirme : √40 ≈ 6,32.',
    },
    {
      statement: 'Calcule √(36 + 64).',
      figure: {
        id: 'racines-somme-triangle',
        alt: 'Un triangle rectangle de côtés 6 et 8 : son hypoténuse mesure 10, moins que le détour 6 + 8.',
      },
      steps: [
        [
          '36 + 64 = 100',
          'Le symbole √ porte sur toute la parenthèse : on calcule d’abord la somme.',
        ],
        [
          '√(36 + 64) = √100 = 10',
          'On prend ensuite la racine carrée du résultat : 10 est positif et 10² = 100.',
        ],
      ],
      conclusion:
        '√(36 + 64) = 10. Ce n’est pas √36 + √64 = 6 + 8 = 14 : on ne peut pas prendre séparément la racine carrée de chaque terme.',
    },
  ],
  questions: [
    qcm({
      prompt: 'Combien vaut √81 ?',
      choices: ['40,5', '−9', '9', '6 561'],
      answer: '9',
      correction: {
        steps: [
          [
            '9² = 9 × 9 = 81',
            'On cherche le nombre positif dont le carré est égal à 81. On reconnaît un carré parfait : 81 est le carré de 9.',
          ],
          [
            '√81 = 9',
            'Le nombre 9 est positif et son carré vaut 81 : c’est la racine carrée de 81.',
          ],
        ],
        traps: [
          [
            '40,5',
            '81 a été divisé par 2. Prendre la racine carrée, ce n’est pas prendre la moitié : 40,5² est bien plus grand que 81.',
          ],
          ['−9', '(−9)² = 81 aussi, mais une racine carrée est toujours un nombre positif.'],
          [
            '6 561',
            'c’est 81², le carré de 81. La racine carrée fait le chemin inverse : on cherche le nombre dont 81 est le carré.',
          ],
        ],
      },
    }),
    qcm({
      prompt: 'Combien vaut √196 ?',
      choices: ['14', '15', '16', '13'],
      answer: '14',
      correction: {
        steps: [
          [
            '14² = 14 × 14 = 196',
            'On cherche le nombre positif dont le carré est égal à 196. C’est un carré parfait de la liste du rappel : celui de 14.',
          ],
          ['√196 = 14', 'Le nombre 14 est positif et son carré vaut 196.'],
        ],
        traps: [
          ['15', 'c’est une confusion avec un autre carré parfait : 15² = 225.'],
          [
            '16',
            '16² = 256, et non 196. Ce carré se termine par 6, comme 196, mais il est trop grand.',
          ],
          [
            '13',
            '13² = 169. Les nombres 169 et 196 ont les mêmes chiffres, dans un ordre différent : attention à ne pas les confondre.',
          ],
        ],
        check:
          'on peut retrouver ce carré sans le connaître par cœur. 196 est compris entre 10² = 100 et 15² = 225, et il se termine par 6 : seul 14 convient, car 4 × 4 = 16.',
      },
    }),
    qcm({
      prompt: 'Combien vaut (√7)² ?',
      choices: ['49', '7', '14', '√7'],
      answer: '7',
      correction: {
        steps: [
          ['(√7)² = √7 × √7', 'Élever un nombre au carré, c’est le multiplier par lui-même.'],
          [
            '(√7)² = 7',
            'Par définition, √7 est le nombre positif dont le carré vaut 7. Aucun calcul n’est nécessaire : le carré « défait » la racine carrée.',
          ],
        ],
        traps: [
          ['49', 'c’est 7². La racine carrée a été oubliée : on élève √7 au carré, pas 7.'],
          ['14', 'le carré a été confondu avec le double : 2 × 7 = 14.'],
          [
            '√7',
            'le carré a été oublié. Le nombre √7 vaut environ 2,65 : c’est son carré qui vaut 7.',
          ],
        ],
        check: 'à la calculatrice, √7 ≈ 2,65 et 2,65² ≈ 7,02 : on retrouve 7, à l’arrondi près.',
      },
    }),
    qcm({
      prompt: 'Encadre √75 entre deux entiers consécutifs.',
      choices: ['7 < √75 < 8', '9 < √75 < 10', '64 < √75 < 81', '8 < √75 < 9'],
      answer: '8 < √75 < 9',
      correction: {
        steps: [
          [
            '8² = 64 et 9² = 81',
            '75 n’est pas un carré parfait. On cherche les deux carrés parfaits consécutifs qui l’entourent.',
          ],
          ['64 < 75 < 81', 'Le nombre 75 est compris entre 8² et 9².'],
          [
            '8 < √75 < 9',
            'Les racines carrées sont rangées dans le même ordre que les nombres : √64 < √75 < √81.',
          ],
        ],
        traps: [
          [
            '7 < √75 < 8',
            '75 a été placé entre 70 et 80, comme si les carrés de 7 et de 8 valaient 70 et 80. En réalité, 8² = 64 est plus petit que 75 : √75 est donc plus grand que 8.',
          ],
          [
            '9 < √75 < 10',
            'l’encadrement est décalé d’un rang : 9² = 81 est déjà plus grand que 75, donc √75 est plus petit que 9.',
          ],
          [
            '64 < √75 < 81',
            'ces deux carrés parfaits encadrent 75, et non √75. Il reste à prendre leurs racines carrées : 8 et 9.',
          ],
        ],
        check: 'la calculatrice donne √75 ≈ 8,66 : ce nombre est bien compris entre 8 et 9.',
      },
    }),
    qcm({
      prompt: 'Combien vaut √(9 + 16) ?',
      choices: ['7', '25', '5', '19'],
      answer: '5',
      correction: {
        steps: [
          [
            '9 + 16 = 25',
            'Le symbole √ porte sur toute la parenthèse : on calcule d’abord la somme.',
          ],
          [
            '√(9 + 16) = √25 = 5',
            'On prend ensuite la racine carrée du résultat : 5 est positif et 5² = 25.',
          ],
        ],
        traps: [
          [
            '7',
            'c’est √9 + √16 = 3 + 4. La racine carrée d’une somme n’est pas la somme des racines carrées : on ne peut pas prendre séparément la racine carrée de chaque terme.',
          ],
          ['25', 'la racine carrée a été oubliée : 25 est la somme 9 + 16, pas sa racine carrée.'],
          [
            '19',
            'la racine carrée n’a été prise que pour le premier terme : √9 + 16 = 3 + 16. Or le symbole √ porte sur toute la parenthèse.',
          ],
        ],
        check:
          '5² = 25, alors que 7² = 49. On retrouve ce calcul avec le théorème de Pythagore : si les côtés de l’angle droit mesurent 3 cm et 4 cm, l’hypoténuse mesure 5 cm, et non 7 cm.',
      },
    }),
    qcm({
      prompt:
        'Un carré a une aire de 30 cm². Avec la calculatrice, calcule la longueur de son côté, arrondie au dixième de centimètre.',
      figure: {
        id: 'racines-carre-aire-30',
        alt: 'Un carré d’aire 30 cm² ; la longueur de son côté est cherchée.',
      },
      choices: ['15 cm', '5,5 cm', '7,5 cm', '5,4 cm'],
      answer: '5,5 cm',
      correction: {
        steps: [
          [
            'x² = 30',
            'On appelle x la longueur du côté, en cm. L’aire d’un carré est le carré de son côté : on cherche donc le nombre positif dont le carré vaut 30.',
          ],
          [
            'x = √30',
            'Une longueur est un nombre positif : c’est la racine carrée de 30. Comme 30 n’est pas un carré parfait, on utilise la calculatrice.',
          ],
          [
            '√30 ≈ 5,5',
            'La calculatrice affiche 5,477… Le chiffre des dixièmes est 4, celui des centièmes est 7. Comme 7 est supérieur ou égal à 5, on arrondit au dixième supérieur. Le côté mesure environ 5,5 cm.',
          ],
        ],
        traps: [
          [
            '15 cm',
            '30 a été divisé par 2. Prendre la racine carrée, ce n’est pas prendre la moitié : un carré de côté 15 cm a une aire de 225 cm².',
          ],
          [
            '7,5 cm',
            '30 a été divisé par 4 : c’est le côté d’un carré de périmètre 30 cm, et non d’aire 30 cm².',
          ],
          [
            '5,4 cm',
            'c’est une troncature : la valeur 5,477… a été coupée après le chiffre des dixièmes. Comme le chiffre suivant est 7, l’arrondi au dixième est 5,5.',
          ],
        ],
        check:
          '5,5² = 30,25 : on retrouve une aire proche de 30. On pouvait aussi prévoir un résultat entre 5 et 6, car 25 < 30 < 36.',
      },
    }),
  ],
})

const premiers = defineExercise({
  id: 'nombres-premiers-et-fractions-irreductibles',
  title: 'Nombres premiers et fractions irréductibles',
  theme: 'nombres',
  difficulty: 'medium',
  description:
    'Lister des diviseurs, appliquer les critères de divisibilité, reconnaître un nombre premier, décomposer en facteurs premiers, rendre une fraction irréductible et résoudre un problème de partage.',
  lesson: paragraphs(
    'Un entier d est un **diviseur** d’un entier n quand la division de n par d tombe juste : le reste est 0. Par exemple, 6 est un diviseur de 54, car 54 = 6 × 9.',
    [
      'Critères de divisibilité :',
      '- par 2 : le chiffre des unités est 0, 2, 4, 6 ou 8 ;',
      '- par 5 : le chiffre des unités est 0 ou 5 ;',
      '- par 3 : la somme des chiffres est divisible par 3 ;',
      '- par 9 : la somme des chiffres est divisible par 9.',
    ].join('\n'),
    'Un **nombre premier** est un entier qui a exactement deux diviseurs : 1 et lui-même. Voici les plus petits : 2 ; 3 ; 5 ; 7 ; 11 ; 13 ; 17 ; 19 ; 23… Le nombre 1 n’est pas premier : il n’a qu’un seul diviseur. Pour savoir si un nombre est premier, on essaie de le diviser par 2, 3, 5, 7… Il est inutile d’essayer un nombre dont le carré dépasse le nombre étudié : pour 37, on essaie 2, 3 et 5, mais pas 7, car 7 × 7 = 49.',
    'Tout entier supérieur ou égal à 2 se décompose en produit de facteurs premiers, d’une seule façon, à l’ordre des facteurs près : 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5. Pour trouver cette décomposition, on divise par 2 autant de fois que possible, puis par 3, puis par 5, et ainsi de suite.',
    figure(
      'premiers-arbre-60',
      'L’arbre de décomposition de 60 : 60 donne 2 et 30, 30 donne 2 et 15, 15 donne 3 et 5.',
    ),
    'Une fraction est **irréductible** quand son numérateur et son dénominateur n’ont plus de diviseur commun autre que 1. Pour rendre une fraction irréductible, on décompose son numérateur et son dénominateur, puis on simplifie par tous leurs facteurs communs. Le produit de ces facteurs communs est le plus grand diviseur commun aux deux nombres.',
  ),
  example: {
    statement: 'Rends irréductible la fraction 90/108.',
    steps: [
      [
        '90 = 2 × 45 = 2 × 3 × 15 = 2 × 3 × 3 × 5',
        'On décompose le numérateur en divisant par les nombres premiers, du plus petit au plus grand. 90 est pair : on divise par 2. Puis 45 et 15 sont divisibles par 3. Enfin, 5 est premier : on s’arrête.',
      ],
      [
        '108 = 2 × 54 = 2 × 2 × 27 = 2 × 2 × 3 × 3 × 3',
        'On décompose le dénominateur de la même façon : deux divisions par 2, puis 27 = 3 × 3 × 3.',
      ],
      [
        '90/108 = (2 × 3 × 3 × 5)/(2 × 2 × 3 × 3 × 3)',
        'On remplace chaque nombre par sa décomposition. Tous les facteurs communs apparaissent : on est sûr de n’en oublier aucun.',
      ],
      [
        '(2 × 3 × 3 × 5)/(2 × 2 × 3 × 3 × 3) = 5/(2 × 3) = 5/6',
        'On simplifie par un facteur 2 et par deux facteurs 3, présents au numérateur et au dénominateur. Il reste 5 au numérateur, et 2 × 3 au dénominateur.',
      ],
    ],
    conclusion:
      '90/108 = 5/6. Cette fraction est irréductible : 5 et 6 n’ont aucun diviseur commun autre que 1. On a simplifié par 2 × 3 × 3 = 18, le plus grand diviseur commun à 90 et à 108.',
  },
  questions: [
    qcm({
      prompt: 'Quelle est la liste de tous les diviseurs de 28 ?',
      choices: [
        '2 ; 4 ; 7 ; 14',
        '1 ; 2 ; 4 ; 7 ; 14 ; 28',
        '28 ; 56 ; 84 ; 112',
        '1 ; 2 ; 7 ; 14 ; 28',
      ],
      answer: '1 ; 2 ; 4 ; 7 ; 14 ; 28',
      correction: {
        steps: [
          [
            '28 = 1 × 28 = 2 × 14 = 4 × 7',
            'Un diviseur de 28 est un entier qui divise 28 sans reste. On cherche donc toutes les façons d’écrire 28 comme un produit de deux entiers, en essayant 1, puis 2, puis 3… dans l’ordre. Les divisions par 3, 5 et 6 ne tombent pas juste.',
          ],
          [
            '1 ; 2 ; 4 ; 7 ; 14 ; 28',
            'Chaque produit donne deux diviseurs. On s’arrête après 4 × 7 : le produit suivant serait 7 × 4, déjà trouvé. Le nombre 28 a six diviseurs.',
          ],
        ],
        traps: [
          [
            '2 ; 4 ; 7 ; 14',
            'il manque 1 et 28. Tout nombre entier est divisible par 1 et par lui-même.',
          ],
          [
            '28 ; 56 ; 84 ; 112',
            'ce sont des multiples de 28, pas des diviseurs. Un diviseur de 28 ne peut pas être plus grand que 28.',
          ],
          [
            '1 ; 2 ; 7 ; 14 ; 28',
            'il manque 4, alors que 7 est dans la liste : 28 = 4 × 7. Chercher les diviseurs deux par deux évite cet oubli.',
          ],
        ],
        check:
          'les diviseurs vont par paires : 1 et 28 ; 2 et 14 ; 4 et 7. Le produit des deux nombres de chaque paire vaut 28.',
      },
    }),
    qcm({
      prompt: 'Parmi les nombres 2, 3, 5 et 9, donne tous ceux qui sont des diviseurs de 570.',
      choices: ['2 et 5', '2, 3, 5 et 9', '3 et 5', '2, 3 et 5'],
      answer: '2, 3 et 5',
      correction: {
        steps: [
          [
            '570 se termine par 0',
            'Pour 2 et pour 5, on regarde le chiffre des unités. Il vaut 0 : le nombre 570 est pair, donc divisible par 2, et il est aussi divisible par 5.',
          ],
          ['5 + 7 + 0 = 12', 'Pour 3 et pour 9, on calcule la somme des chiffres.'],
          [
            '12 = 3 × 4',
            'La somme 12 est divisible par 3, donc 570 aussi. Mais 12 n’est pas divisible par 9, donc 570 non plus.',
          ],
          [
            '2, 3 et 5',
            'Parmi les quatre nombres proposés, trois sont des diviseurs de 570. Seul 9 n’en est pas un.',
          ],
        ],
        traps: [
          [
            '2 et 5',
            'le critère de divisibilité par 3 a été oublié : 5 + 7 + 0 = 12, et 12 est divisible par 3.',
          ],
          [
            '2, 3, 5 et 9',
            'la somme des chiffres, 12, est divisible par 3 mais pas par 9. Un nombre divisible par 3 n’est pas toujours divisible par 9.',
          ],
          [
            '3 et 5',
            'un nombre qui se termine par 0 est pair : 0 fait partie des chiffres pairs. On a bien 570 = 2 × 285.',
          ],
        ],
        check:
          '570 = 2 × 285 ; 570 = 3 × 190 ; 570 = 5 × 114. En revanche, 570 ÷ 9 ≈ 63,3 : cette division ne tombe pas juste.',
      },
    }),
    qcm({
      prompt: 'Lequel de ces nombres est un nombre premier ?',
      choices: ['59', '51', '1', '91'],
      answer: '59',
      correction: {
        steps: [
          [
            '59 n’est divisible ni par 2, ni par 3, ni par 5',
            'On essaie les nombres premiers dans l’ordre. 59 est impair. La somme de ses chiffres, 5 + 9 = 14, n’est pas divisible par 3. Il ne se termine ni par 0 ni par 5.',
          ],
          [
            '59 = 7 × 8 + 3',
            '59 n’est pas divisible par 7 non plus : il reste 3. On peut s’arrêter là. Si 59 était le produit de deux entiers autres que 1 et 59, ils ne pourraient pas dépasser 7 tous les deux : leur produit vaudrait au moins 8 × 8 = 64, ce qui dépasse 59. L’un des deux serait donc compris entre 2 et 7, et 59 serait divisible par 2, 3, 5 ou 7 (un nombre divisible par 4 ou par 6 l’est déjà par 2). Ce n’est pas le cas.',
          ],
          ['59 est un nombre premier', 'Ses seuls diviseurs sont 1 et 59.'],
        ],
        traps: [
          ['51', '5 + 1 = 6 est divisible par 3, donc 51 aussi : 51 = 3 × 17.'],
          [
            '1',
            'le nombre 1 n’a qu’un seul diviseur, lui-même. Un nombre premier en a exactement deux.',
          ],
          [
            '91',
            'les critères ne suffisent pas : 91 n’est divisible ni par 2, ni par 3, ni par 5, mais il l’est par 7, car 91 = 7 × 13.',
          ],
        ],
        check:
          'aucune des quatre divisions ne tombe juste : 59 = 2 × 29 + 1 ; 59 = 3 × 19 + 2 ; 59 = 5 × 11 + 4 ; 59 = 7 × 8 + 3.',
      },
    }),
    qcm({
      prompt: 'Quelle est la décomposition de 84 en produit de facteurs premiers ?',
      choices: ['4 × 3 × 7', '2² × 21', '2² × 3 × 7', '2 × 3² × 7'],
      answer: '2² × 3 × 7',
      correction: {
        steps: [
          ['84 = 2 × 42', '84 est pair : on divise par 2, le plus petit nombre premier.'],
          ['84 = 2 × 2 × 21', '42 est encore pair : on divise de nouveau par 2.'],
          [
            '84 = 2 × 2 × 3 × 7',
            '21 n’est plus pair, mais il est divisible par 3 : 21 = 3 × 7. Comme 7 est premier, la décomposition est terminée.',
          ],
          ['84 = 2² × 3 × 7', 'On regroupe les deux facteurs 2 avec une puissance : 2 × 2 = 2².'],
        ],
        traps: [
          ['4 × 3 × 7', 'le produit vaut bien 84, mais 4 n’est pas un nombre premier : 4 = 2 × 2.'],
          [
            '2² × 21',
            'le produit vaut bien 84, mais 21 n’est pas un nombre premier : 21 = 3 × 7. La décomposition n’est pas terminée.',
          ],
          [
            '2 × 3² × 7',
            'ce produit vaut 2 × 9 × 7 = 126, et non 84 : la puissance est placée sur le mauvais facteur.',
          ],
        ],
        check:
          'on recalcule le produit : 2² × 3 × 7 = 4 × 21 = 84. De plus, les facteurs 2, 3 et 7 sont bien premiers.',
      },
    }),
    qcm({
      prompt:
        'Décompose 126 et 210 en produits de facteurs premiers, puis rends irréductible la fraction 126/210.',
      choices: ['21/35', '3/5', '1/5', '9/15'],
      answer: '3/5',
      correction: {
        steps: [
          [
            '126 = 2 × 63 = 2 × 3 × 21 = 2 × 3 × 3 × 7',
            'On décompose le numérateur : une division par 2, puis deux divisions par 3. Comme 7 est premier, on s’arrête.',
          ],
          [
            '210 = 2 × 105 = 2 × 3 × 35 = 2 × 3 × 5 × 7',
            'On décompose le dénominateur de la même façon. 105 est divisible par 3, car 1 + 0 + 5 = 6. Puis 35 = 5 × 7.',
          ],
          [
            '126/210 = (2 × 3 × 3 × 7)/(2 × 3 × 5 × 7)',
            'On remplace chaque nombre par sa décomposition. Les facteurs 2, 3 et 7 figurent au numérateur et au dénominateur.',
          ],
          [
            '(2 × 3 × 3 × 7)/(2 × 3 × 5 × 7) = 3/5',
            'On simplifie par 2, par 3 et par 7. Il reste un facteur 3 au numérateur et le facteur 5 au dénominateur : la fraction 3/5 est irréductible.',
          ],
        ],
        traps: [
          [
            '21/35',
            'la fraction a été simplifiée par 2 et par 3, mais pas par 7 : 21 = 3 × 7 et 35 = 5 × 7. Elle n’est pas encore irréductible.',
          ],
          [
            '1/5',
            'les deux facteurs 3 du numérateur ont été barrés, alors que le dénominateur n’en contient qu’un. On ne simplifie que par un facteur présent à la fois au numérateur et au dénominateur.',
          ],
          [
            '9/15',
            'la fraction a été simplifiée par 2 et par 7, mais 9 et 15 sont encore divisibles par 3. Elle n’est pas encore irréductible.',
          ],
        ],
        check: 'on a simplifié par 2 × 3 × 7 = 42. En effet, 126 = 42 × 3 et 210 = 42 × 5.',
      },
    }),
    qcm({
      prompt:
        'Pour une kermesse, on répartit 72 sucettes et 120 bonbons dans des sachets identiques : tous contiennent le même nombre de sucettes et le même nombre de bonbons. Toutes les friandises sont utilisées. Quel est le plus grand nombre de sachets possible ?',
      figure: {
        id: 'premiers-kermesse-sachets',
        alt: '72 sucettes et 120 bonbons à répartir dans des sachets identiques, en nombre cherché.',
      },
      choices: ['6', '72', '360', '24'],
      answer: '24',
      correction: {
        steps: [
          [
            '72 = 2 × 2 × 2 × 3 × 3',
            'Le nombre de sachets doit diviser à la fois 72 et 120 : c’est un diviseur commun, et on cherche le plus grand. On décompose d’abord 72 en produit de facteurs premiers.',
          ],
          ['120 = 2 × 2 × 2 × 3 × 5', 'On décompose 120 de la même façon.'],
          [
            '2 × 2 × 2 × 3 = 24',
            'On garde tous les facteurs communs aux deux décompositions : trois facteurs 2 et un seul facteur 3. Leur produit est le plus grand diviseur commun.',
          ],
          [
            '72 = 24 × 3 et 120 = 24 × 5',
            'On peut préparer 24 sachets au plus. Chacun contient 3 sucettes et 5 bonbons.',
          ],
        ],
        traps: [
          [
            '6',
            'chaque facteur commun n’a été pris qu’une fois : 2 × 3 = 6. Or le facteur 2 est commun trois fois. On peut bien faire 6 sachets, mais ce n’est pas le plus grand nombre possible.',
          ],
          [
            '72',
            'le facteur 3 a été pris deux fois, comme dans 72. Mais 120 ne contient qu’un seul facteur 3 : 72 ne divise pas 120.',
          ],
          [
            '360',
            'c’est le produit 2 × 2 × 2 × 3 × 3 × 5, qui réunit tous les facteurs des deux nombres : un multiple commun, pas un diviseur. On ne peut pas faire plus de sachets qu’il n’y a de sucettes.',
          ],
        ],
        check:
          '24 × 3 = 72 et 24 × 5 = 120. Comme 3 et 5 n’ont aucun diviseur commun autre que 1, on ne peut pas faire davantage de sachets.',
      },
    }),
  ],
})

export const nombres = [fractions, puissances, racines, premiers]
