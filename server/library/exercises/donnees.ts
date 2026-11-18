import { defineExercise, exact, paragraphs, qcm } from '../authoring.js'

/**
 * Statistiques et probabilités. Les séries sont écrites en texte, leurs valeurs
 * séparées par des points-virgules ; les arbres et les tableaux à double entrée
 * sont décrits par l'énoncé. Les probabilités sont données en fraction
 * irréductible.
 */

const statistiques = defineExercise({
  id: 'statistiques-moyenne-mediane-etendue',
  title: 'Statistiques : moyenne, médiane, étendue',
  theme: 'donnees',
  difficulty: 'medium',
  description:
    'Calculer une moyenne, une étendue, une médiane (effectif impair, puis pair) et une moyenne pondérée par des effectifs, puis trouver la note qui permet d’atteindre une moyenne donnée. Réponses à saisir.',
  lesson: paragraphs(
    'Une série statistique est une liste de valeurs. Son **effectif total** est le nombre de valeurs.',
    [
      '- **Moyenne :** la somme des valeurs, divisée par l’effectif total.',
      '- **Moyenne pondérée :** quand les valeurs ont des coefficients ou des effectifs, on multiplie chaque valeur par le sien, on additionne, puis on divise par la somme des coefficients (ou par l’effectif total).',
      '- **Médiane :** une valeur qui partage la série, rangée dans l’ordre croissant, en deux groupes de même effectif. Si l’effectif est impair, c’est la valeur du milieu. S’il est pair, on prend la moyenne des deux valeurs du milieu.',
      '- **Étendue :** la différence entre la plus grande valeur et la plus petite.',
    ].join('\n'),
    'Exemple : pour la série 2 ; 5 ; 11, la moyenne est (2 + 5 + 11) ÷ 3 = 6, la médiane est 5 et l’étendue est 11 − 2 = 9.',
    'Avant de chercher une médiane, range toujours les valeurs dans l’ordre croissant.',
  ),
  example: [
    {
      statement:
        'Ce trimestre, Yanis a eu trois notes : 10 (coefficient 1), 13 (coefficient 2) et 16 (coefficient 3). Calcule sa moyenne.',
      steps: [
        [
          '10 × 1 + 13 × 2 + 16 × 3 = 84',
          'Une note de coefficient 2 compte deux fois, une note de coefficient 3 compte trois fois. On multiplie donc chaque note par son coefficient, puis on additionne.',
        ],
        [
          '1 + 2 + 3 = 6',
          'On additionne les coefficients : tout se passe comme si Yanis avait eu 6 notes.',
        ],
        ['84 ÷ 6 = 14', 'On divise la somme obtenue par la somme des coefficients.'],
      ],
      conclusion:
        'La moyenne de Yanis est 14. Sans les coefficients, on aurait trouvé (10 + 13 + 16) ÷ 3 = 13 : le 16, qui compte trois fois, tire la moyenne vers le haut.',
    },
    {
      statement:
        'Voici le nombre de pompes réalisées par six élèves : 16 ; 8 ; 21 ; 12 ; 8 ; 19. Détermine la médiane et l’étendue de cette série.',
      steps: [
        [
          '8 ; 8 ; 12 ; 16 ; 19 ; 21',
          'On range les valeurs dans l’ordre croissant, sans en oublier : la valeur 8 figure deux fois dans la série, on l’écrit deux fois.',
        ],
        [
          '(12 + 16) ÷ 2 = 14',
          'L’effectif est 6, un nombre pair : aucune valeur n’est au milieu. On prend la moyenne des deux valeurs du milieu, la 3e et la 4e valeur.',
        ],
        [
          '21 − 8 = 13',
          'L’étendue est la différence entre la plus grande valeur et la plus petite.',
        ],
      ],
      conclusion:
        'La médiane est 14 : trois élèves ont fait moins de 14 pompes, trois en ont fait plus. L’étendue est 13.',
    },
  ],
  questions: [
    exact({
      prompt:
        'Voici les températures relevées à midi pendant cinq jours, en °C : 14 ; 17 ; 12 ; 19 ; 13. Calcule la température moyenne, en °C.',
      answers: ['15'],
      correction: {
        steps: [
          ['14 + 17 + 12 + 19 + 13 = 75', 'On additionne toutes les valeurs de la série.'],
          [
            '75 ÷ 5 = 15',
            'On divise la somme par l’effectif total, c’est-à-dire le nombre de valeurs : 5. La température moyenne est 15 °C.',
          ],
        ],
        mistake:
          'taper 14 + 17 + 12 + 19 + 13 ÷ 5 sans parenthèses. La calculatrice ne divise alors que le dernier nombre, 13 : elle calcule 14 + 17 + 12 + 19 + 2,6 = 64,6. On calcule d’abord la somme, puis on divise.',
        check:
          'une moyenne est toujours comprise entre la plus petite valeur et la plus grande : 15 est bien entre 12 et 19.',
      },
    }),
    exact({
      prompt:
        'Voici les tailles de six élèves, en cm : 158 ; 172 ; 149 ; 165 ; 180 ; 161. Calcule l’étendue de cette série, en cm.',
      answers: ['31'],
      correction: {
        steps: [
          [
            '149 ; 158 ; 161 ; 165 ; 172 ; 180',
            'On range les valeurs dans l’ordre croissant pour repérer les deux extrêmes : la plus petite valeur est 149, la plus grande est 180.',
          ],
          [
            '180 − 149 = 31',
            'L’étendue est la différence entre la plus grande valeur et la plus petite : 31 cm.',
          ],
        ],
        mistake:
          'soustraire la première valeur de la liste à la dernière. On trouverait 161 − 158 = 3. L’étendue se calcule avec la plus grande et la plus petite valeur, où qu’elles soient dans la liste.',
      },
    }),
    exact({
      prompt:
        'Voici les notes de sept élèves à un contrôle : 14 ; 7 ; 12 ; 9 ; 18 ; 11 ; 15. Détermine la médiane de cette série.',
      answers: ['12'],
      correction: {
        steps: [
          [
            '7 ; 9 ; 11 ; 12 ; 14 ; 15 ; 18',
            'On range d’abord les valeurs dans l’ordre croissant.',
          ],
          [
            '7 = 3 + 1 + 3',
            'L’effectif est 7, un nombre impair : la médiane est la valeur du milieu. C’est la 4e valeur, car elle a 3 valeurs avant elle et 3 valeurs après elle.',
          ],
          ['Médiane = 12', 'On lit la 4e valeur de la série rangée : la médiane est 12.'],
        ],
        mistake:
          'prendre la valeur du milieu sans ranger la série. Dans la liste de l’énoncé, la 4e valeur est 9 : ce n’est pas la médiane.',
        check:
          'trois notes sont inférieures à 12 (7 ; 9 ; 11) et trois lui sont supérieures (14 ; 15 ; 18).',
      },
    }),
    exact({
      prompt:
        'Voici le nombre de livres lus cette année par huit élèves : 5 ; 13 ; 2 ; 12 ; 20 ; 6 ; 15 ; 4. Détermine la médiane de cette série.',
      answers: ['9'],
      correction: {
        steps: [
          ['2 ; 4 ; 5 ; 6 ; 12 ; 13 ; 15 ; 20', 'On range les valeurs dans l’ordre croissant.'],
          [
            '8 = 4 + 4',
            'L’effectif est 8, un nombre pair : aucune valeur n’est au milieu. La série se coupe en deux groupes de 4 valeurs. Les deux valeurs du milieu sont la 4e et la 5e valeur : 6 et 12.',
          ],
          [
            '(6 + 12) ÷ 2 = 9',
            'On prend pour médiane la moyenne des deux valeurs du milieu : la médiane est 9.',
          ],
        ],
        mistake:
          'choisir l’une des deux valeurs du milieu, 6 ou 12, ou ne pas ranger la série. La médiane, 9, n’est pas une valeur de la série : c’est fréquent quand l’effectif est pair.',
        check:
          'quatre élèves ont lu moins de 9 livres (2 ; 4 ; 5 ; 6) et quatre en ont lu plus (12 ; 13 ; 15 ; 20).',
      },
    }),
    exact({
      prompt:
        'Une équipe de football a joué 20 matchs cette saison. Elle a marqué 0 but dans 4 matchs, 1 but dans 7 matchs, 2 buts dans 6 matchs et 3 buts dans 3 matchs. Calcule le nombre moyen de buts marqués par match.',
      answers: ['1,4', '1,4 but', '1,4 buts'],
      correction: {
        steps: [
          [
            '0 × 4 + 1 × 7 + 2 × 6 + 3 × 3 = 28',
            'Ici, chaque valeur (un nombre de buts) a un effectif (un nombre de matchs). On multiplie chaque valeur par son effectif, puis on additionne : l’équipe a marqué 28 buts en tout.',
          ],
          [
            '4 + 7 + 6 + 3 = 20',
            'On contrôle l’effectif total : c’est bien le nombre de matchs joués.',
          ],
          [
            '28 ÷ 20 = 1,4',
            'On divise le nombre total de buts par l’effectif total : l’équipe marque en moyenne 1,4 but par match.',
          ],
        ],
        mistake:
          'oublier les effectifs et calculer (0 + 1 + 2 + 3) ÷ 4 = 1,5. Les quatre valeurs n’ont pas le même poids : la valeur 1 compte 7 fois, la valeur 3 seulement 3 fois.',
        check:
          '1,4 × 20 = 28 : avec 1,4 but par match pendant 20 matchs, on retrouve bien les 28 buts marqués.',
      },
    }),
    exact({
      prompt:
        'Ce trimestre, Hugo a cinq contrôles de maths, tous de même coefficient. Il a obtenu 9 ; 13 ; 10 ; 12 aux quatre premiers. Quelle note doit-il obtenir au cinquième pour avoir exactement 12 de moyenne ?',
      answers: ['16', '16/20'],
      correction: {
        steps: [
          [
            '12 × 5 = 60',
            'La somme des notes est égale à la moyenne multipliée par le nombre de notes. Pour avoir 12 de moyenne sur 5 contrôles, il faut donc un total de 60 points.',
          ],
          ['9 + 13 + 10 + 12 = 44', 'On calcule le total des quatre notes déjà obtenues.'],
          [
            '60 − 44 = 16',
            'La cinquième note doit apporter les points qui manquent : Hugo doit obtenir 16.',
          ],
        ],
        mistake:
          'répondre 13 en pensant que (11 + 13) ÷ 2 = 12 suffit. La moyenne actuelle, 11, résume quatre notes : elle pèse quatre fois plus que la nouvelle note.',
        check: '(9 + 13 + 10 + 12 + 16) ÷ 5 = 60 ÷ 5 = 12.',
      },
    }),
  ],
})

const probabilites = defineExercise({
  id: 'probabilites-calculer-une-probabilite',
  title: 'Probabilités : calculer une probabilité',
  theme: 'donnees',
  difficulty: 'easy',
  description:
    'Vocabulaire des probabilités, puis calculs en situation d’équiprobabilité : dé, urne, roue de loterie, jeu de 32 cartes. Événement certain, impossible, contraire. Réponses en fraction irréductible.',
  lesson: paragraphs(
    'Une **expérience aléatoire** est une expérience dont on connaît les résultats possibles, sans pouvoir prévoir lequel se produira : lancer un dé, tirer une carte. Ces résultats sont les **issues**. Un **événement** est un ensemble d’issues : pour un dé, « obtenir un multiple de 3 » regroupe les issues 3 et 6. Ce sont ses issues **favorables**.',
    'Quand toutes les issues ont la même chance de se produire, on parle d’**équiprobabilité**. La probabilité d’un événement est alors :',
    '**nombre d’issues favorables ÷ nombre d’issues possibles**',
    [
      '- Une probabilité est un nombre compris entre 0 et 1. Dans ce QCM, elle est écrite en fraction irréductible : simplifie ton résultat avant de choisir.',
      '- Un événement **impossible** a pour probabilité 0. Un événement **certain** a pour probabilité 1.',
      '- L’**événement contraire** de A, noté « non A », se réalise quand A ne se réalise pas : p(non A) = 1 − p(A).',
    ].join('\n'),
  ),
  example: [
    {
      statement:
        'Un sac contient 3 jetons rouges, 4 jetons verts et 5 jetons bleus, indiscernables au toucher. On tire un jeton au hasard. Quelle est la probabilité de tirer un jeton vert ?',
      steps: [
        [
          '3 + 4 + 5 = 12',
          'On compte les issues possibles : le sac contient 12 jetons. Ils sont indiscernables au toucher : chacun a la même chance d’être tiré, c’est une situation d’équiprobabilité.',
        ],
        [
          '4 ÷ 12 = 4/12',
          'Il y a 4 issues favorables, les 4 jetons verts. On divise ce nombre par le nombre d’issues possibles.',
        ],
        [
          '4/12 = 1/3',
          'On donne la probabilité en fraction irréductible : on divise le numérateur et le dénominateur par 4.',
        ],
      ],
      conclusion:
        'La probabilité de tirer un jeton vert est 1/3. Ce nombre est bien compris entre 0 et 1.',
    },
    {
      statement:
        'On lance un dé équilibré à six faces. Quelle est la probabilité de ne pas obtenir 6 ?',
      steps: [
        [
          'p(obtenir 6) = 1/6',
          'Le dé est équilibré : ses 6 issues ont la même chance de sortir. Une seule est favorable à l’événement « obtenir 6 ».',
        ],
        [
          '1 − 1/6 = 5/6',
          '« Ne pas obtenir 6 » est l’événement contraire de « obtenir 6 ». On soustrait donc de 1 la probabilité d’obtenir 6.',
        ],
      ],
      conclusion:
        'La probabilité de ne pas obtenir 6 est 5/6. On le vérifie en comptant : 5 issues sur 6 conviennent (1, 2, 3, 4 et 5).',
    },
  ],
  questions: [
    qcm({
      prompt:
        'On lance un dé équilibré à six faces et on lit le nombre obtenu. Dans cette expérience aléatoire, que désigne « obtenir un nombre pair » ?',
      choices: ['une issue', 'un événement', 'une probabilité', 'une expérience aléatoire'],
      answer: 'un événement',
      correction: {
        steps: [
          [
            'Issues : 1 ; 2 ; 3 ; 4 ; 5 ; 6',
            'L’expérience aléatoire, c’est le lancer du dé. Ses résultats possibles sont les issues : il y en a six.',
          ],
          [
            'Nombre pair : 2 ; 4 ; 6',
            '« Obtenir un nombre pair » regroupe trois issues. Un ensemble d’issues s’appelle un événement : la bonne réponse est « un événement ».',
          ],
        ],
        traps: [
          [
            'une issue',
            'une issue est un seul résultat possible, comme « obtenir 4 ». Ici, trois issues conviennent.',
          ],
          [
            'une probabilité',
            'une probabilité est un nombre. Celle de cet événement est 3/6, soit 1/2.',
          ],
          [
            'une expérience aléatoire',
            'l’expérience aléatoire est l’action elle-même, dont on ne peut pas prévoir le résultat : ici, lancer le dé.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Une urne contient 4 boules rouges, 6 boules bleues et 10 boules jaunes, indiscernables au toucher. On tire une boule au hasard. Quelle est la probabilité de tirer une boule bleue ?',
      choices: ['1/3', '3/7', '3/10', '1/6'],
      answer: '3/10',
      correction: {
        steps: [
          [
            '4 + 6 + 10 = 20',
            'On compte les issues possibles : l’urne contient 20 boules. Elles sont indiscernables au toucher, donc chacune a la même chance d’être tirée.',
          ],
          [
            '6/20 = 3/10',
            'Il y a 6 issues favorables, les 6 boules bleues. On divise par le nombre d’issues possibles, puis on simplifie la fraction par 2 : la probabilité est 3/10.',
          ],
        ],
        traps: [
          [
            '1/3',
            'il y a bien trois couleurs, mais elles n’ont pas la même chance de sortir : les boules jaunes sont les plus nombreuses.',
          ],
          [
            '3/7',
            'on a comparé les 6 boules bleues aux 14 autres boules. On divise par le nombre total de boules, 20.',
          ],
          [
            '1/6',
            'le nombre de boules bleues, 6, est le nombre d’issues favorables : il se place au numérateur, pas au dénominateur.',
          ],
        ],
        check:
          '14 boules ne sont pas bleues : la probabilité de l’événement contraire est 14/20 = 7/10, et 3/10 + 7/10 = 1.',
      },
    }),
    qcm({
      prompt:
        'On lance un dé équilibré à six faces. Quelle est la probabilité d’obtenir un nombre strictement supérieur à 4 ?',
      choices: ['1/3', '1/2', '2/3', '1/6'],
      answer: '1/3',
      correction: {
        steps: [
          [
            'Issues possibles : 1 ; 2 ; 3 ; 4 ; 5 ; 6',
            'Le dé est équilibré : ses 6 issues ont la même chance de sortir.',
          ],
          [
            'Issues favorables : 5 ; 6',
            '« Strictement supérieur à 4 » exclut 4 : seuls 5 et 6 conviennent.',
          ],
          [
            '2/6 = 1/3',
            'On divise le nombre d’issues favorables par le nombre d’issues possibles, puis on simplifie par 2 : la probabilité est 1/3.',
          ],
        ],
        traps: [
          [
            '1/2',
            'on a compté 4 parmi les issues favorables. Or 4 n’est pas strictement supérieur à 4.',
          ],
          [
            '2/3',
            'c’est la probabilité de l’événement contraire : obtenir 1, 2, 3 ou 4, soit 4 issues sur 6.',
          ],
          [
            '1/6',
            'c’est la probabilité d’une seule issue. Ici, deux issues sont favorables : 5 et 6.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Une roue de loterie est partagée en 5 secteurs de même taille, numérotés 2, 4, 6, 8 et 10. On la fait tourner. Quelle est la probabilité qu’elle s’arrête sur un nombre pair ?',
      choices: ['1/2', '5', '0', '1'],
      answer: '1',
      correction: {
        steps: [
          [
            'Issues possibles : 2 ; 4 ; 6 ; 8 ; 10',
            'Les 5 secteurs ont la même taille : les 5 issues ont la même chance de sortir.',
          ],
          [
            '5/5 = 1',
            'Les 5 nombres sont pairs : toutes les issues sont favorables. L’événement est certain, et sa probabilité est 1.',
          ],
        ],
        traps: [
          [
            '1/2',
            'un nombre entier est pair ou impair, mais cette roue ne porte aucun nombre impair : les deux cas n’ont pas la même chance de se produire.',
          ],
          [
            '5',
            'c’est le nombre d’issues favorables. Une probabilité est toujours comprise entre 0 et 1.',
          ],
          [
            '0',
            'c’est la probabilité d’un événement impossible, comme « s’arrêter sur un nombre impair ».',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Un jeu de 32 cartes compte quatre couleurs : pique, cœur, carreau et trèfle. Chaque couleur a huit cartes : 7, 8, 9, 10, valet, dame, roi et as. On tire une carte au hasard. Quelle est la probabilité de tirer une figure, c’est-à-dire un valet, une dame ou un roi ?',
      choices: ['3/32', '3/8', '3/5', '3/13'],
      answer: '3/8',
      correction: {
        steps: [
          [
            '3 × 4 = 12',
            'On compte les issues favorables : 3 figures (valet, dame, roi) dans chacune des 4 couleurs, soit 12 figures.',
          ],
          [
            '12/32 = 3/8',
            'La carte est tirée au hasard : les 32 cartes ont la même chance de sortir. On divise par 32, puis on simplifie la fraction par 4 : la probabilité est 3/8.',
          ],
        ],
        traps: [
          [
            '3/32',
            'on n’a compté que 3 figures. Il y en a 3 dans chaque couleur, donc 12 en tout.',
          ],
          [
            '3/5',
            'on a comparé les 12 figures aux 20 autres cartes. On divise par le nombre total de cartes, 32.',
          ],
          [
            '3/13',
            'c’est la réponse pour un jeu de 52 cartes : 12/52 = 3/13. Ici, le jeu ne compte que 32 cartes.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Un sac contient 20 jetons numérotés de 1 à 20, indiscernables au toucher. On tire un jeton au hasard. Quelle est la probabilité de ne pas tirer un multiple de 5 ?',
      choices: ['1/5', '1/4', '5/4', '4/5'],
      answer: '4/5',
      correction: {
        steps: [
          [
            'Multiples de 5 : 5 ; 10 ; 15 ; 20',
            'On commence par l’événement « tirer un multiple de 5 », plus simple à compter : il a 4 issues favorables.',
          ],
          [
            '4/20 = 1/5',
            'Les 20 jetons ont la même chance d’être tirés : la probabilité de tirer un multiple de 5 est 1/5.',
          ],
          [
            '1 − 1/5 = 4/5',
            '« Ne pas tirer un multiple de 5 » est l’événement contraire. On soustrait de 1 la probabilité de l’événement : la réponse est 4/5.',
          ],
        ],
        traps: [
          [
            '1/5',
            'c’est la probabilité de tirer un multiple de 5. La question porte sur l’événement contraire.',
          ],
          [
            '1/4',
            'on a comparé les 4 multiples de 5 aux 16 autres jetons. On divise toujours par le nombre total d’issues, 20.',
          ],
          ['5/4', 'une probabilité ne dépasse jamais 1. La fraction est écrite à l’envers.'],
        ],
        check:
          'on peut aussi compter directement. 20 − 4 = 16 : il y a 16 jetons qui ne portent pas un multiple de 5, et 16/20 = 4/5.',
      },
    }),
  ],
})

const deuxEpreuves = defineExercise({
  id: 'probabilites-deux-epreuves',
  title: 'Probabilités : expériences à deux épreuves',
  theme: 'donnees',
  difficulty: 'hard',
  description:
    'Dénombrer les issues d’une expérience à deux épreuves avec un arbre ou un tableau à double entrée : deux pièces, deux dés, tirages avec ou sans remise, « au moins une fois ». Chaque mauvais choix est une erreur classique.',
  lesson: paragraphs(
    'Une **expérience à deux épreuves** enchaîne deux expériences aléatoires : deux lancers, deux tirages. Une issue est alors un couple de résultats, écrit dans l’ordre : (pile ; face) et (face ; pile) sont deux issues différentes.',
    'Pour n’oublier aucune issue, range-les :',
    [
      '- dans un **arbre** : une branche par résultat de la première épreuve, puis, au bout de chacune, une branche par résultat de la seconde. Chaque chemin est une issue ;',
      '- dans un **tableau à double entrée** : une ligne par résultat de la première épreuve, une colonne par résultat de la seconde. Chaque case est une issue.',
    ].join('\n'),
    'Les nombres d’issues se **multiplient** : deux lancers d’une pièce donnent 2 × 2 = 4 issues, deux lancers d’un dé en donnent 6 × 6 = 36. Quand toutes les issues ont la même probabilité, on divise le nombre d’issues favorables par le nombre d’issues possibles.',
    '**Tirages dans une urne.** Chaque boule a la même chance d’être tirée : pour compter les issues, on distingue les boules d’une même couleur, par exemple en les numérotant. Avec remise, l’urne est la même aux deux tirages. Sans remise, elle contient une boule de moins au second tirage.',
    '**« Au moins une fois ».** Il est souvent plus simple de calculer la probabilité de l’événement contraire, « aucune fois », puis de la soustraire de 1.',
  ),
  example: [
    {
      statement:
        'On fait tourner deux fois de suite une roue partagée en 3 secteurs de même taille, numérotés 1, 2 et 3. Quelle est la probabilité que la somme des deux numéros obtenus soit égale à 4 ?',
      steps: [
        [
          '3 × 3 = 9',
          'On dresse un tableau à double entrée : 3 lignes pour le premier numéro, 3 colonnes pour le second. Ses 9 cases sont les 9 issues, toutes de même probabilité.',
        ],
        [
          '(1 ; 3), (2 ; 2), (3 ; 1)',
          'On cherche les cases dont la somme vaut 4, en écrivant chaque issue comme un couple. L’ordre compte : (1 ; 3) et (3 ; 1) sont deux cases différentes. La case (2 ; 2), elle, n’existe qu’une fois.',
        ],
        [
          '3/9 = 1/3',
          'On divise le nombre d’issues favorables par le nombre d’issues possibles, puis on simplifie par 3.',
        ],
      ],
      conclusion: 'La probabilité que la somme soit égale à 4 est 1/3.',
    },
    {
      statement:
        'Un sac contient 3 jetons rouges et 1 jeton noir, indiscernables au toucher. On tire un jeton, on ne le remet pas dans le sac, puis on tire un second jeton. Quelle est la probabilité de tirer deux jetons rouges ?',
      steps: [
        [
          '4 × 3 = 12',
          'On donne un nom à chaque jeton : R1, R2 et R3 pour les rouges, N pour le noir. Puis on imagine l’arbre. Premier tirage : 4 jetons possibles, donc 4 branches. Le jeton tiré n’est pas remis : il n’en reste que 3 pour le second tirage, donc 3 branches au bout de chacune. L’arbre a 12 chemins, tous de même probabilité.',
        ],
        [
          '3 × 2 = 6',
          'Chemins favorables : 3 choix pour le premier jeton rouge (R1, R2 ou R3). Il ne reste alors que 2 jetons rouges pour le second.',
        ],
        [
          '6/12 = 1/2',
          'On divise le nombre d’issues favorables par le nombre d’issues possibles, puis on simplifie par 6.',
        ],
      ],
      conclusion:
        'La probabilité de tirer deux jetons rouges est 1/2. Avec remise, on aurait trouvé (3 × 3)/(4 × 4) = 9/16 : remettre ou non le premier jeton change le résultat.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'On lance deux fois de suite une pièce équilibrée. Quelle est la probabilité d’obtenir deux fois pile ?',
      choices: ['1/3', '1/2', '1/4', '1'],
      answer: '1/4',
      correction: {
        steps: [
          [
            '(P ; P), (P ; F), (F ; P), (F ; F)',
            'On note P pour pile et F pour face. Chaque issue est un couple : le résultat du premier lancer, puis celui du second. Il y a 2 × 2 = 4 issues, toutes de même probabilité.',
          ],
          ['Issue favorable : (P ; P)', 'Une seule issue donne deux fois pile.'],
          [
            '1 ÷ 4 = 1/4',
            'On divise le nombre d’issues favorables par le nombre d’issues possibles : la probabilité est 1/4.',
          ],
        ],
        traps: [
          [
            '1/3',
            'on a compté trois issues : « deux piles », « deux faces » et « un de chaque ». Mais « un de chaque » regroupe deux issues, (P ; F) et (F ; P) : il y a 4 issues, pas 3.',
          ],
          [
            '1/2',
            'c’est la probabilité d’obtenir pile à un seul lancer. Ici, il faut pile au premier lancer, puis encore pile au second.',
          ],
          [
            '1',
            'on a additionné 1/2 et 1/2. Une probabilité de 1 voudrait dire qu’on obtient deux fois pile à coup sûr.',
          ],
        ],
        check:
          'la moitié des 4 issues commence par pile, et la moitié de celles-ci se termine par pile. La moitié de la moitié, c’est 1/2 × 1/2 = 1/4.',
      },
    }),
    qcm({
      prompt:
        'On lance une pièce équilibrée, puis un dé équilibré à six faces. On représente l’expérience par un arbre : 2 branches pour la pièce (pile, face), puis, au bout de chacune, 6 branches pour le dé (de 1 à 6). Quelle est la probabilité d’obtenir pile, puis un nombre supérieur ou égal à 5 ?',
      choices: ['1/4', '1/6', '5/6', '1/3'],
      answer: '1/6',
      correction: {
        steps: [
          [
            '2 × 6 = 12',
            'Chacune des 2 branches de la pièce porte 6 branches du dé : l’arbre a 12 chemins. Chaque chemin est une issue, et toutes ont la même probabilité.',
          ],
          [
            '(pile ; 5) et (pile ; 6)',
            'On cherche les chemins favorables : la branche « pile », suivie de la branche 5 ou de la branche 6. Il y en a 2.',
          ],
          [
            '2/12 = 1/6',
            'On divise le nombre d’issues favorables par le nombre d’issues possibles, puis on simplifie par 2 : la probabilité est 1/6.',
          ],
        ],
        traps: [
          [
            '1/4',
            'on a compté 2 + 6 = 8 issues. Les 6 branches du dé partent de chaque branche de la pièce : on multiplie, on n’additionne pas.',
          ],
          [
            '5/6',
            'on a additionné 1/2 et 1/3. Exiger à la fois pile et un nombre supérieur ou égal à 5 rend l’événement moins probable, pas plus.',
          ],
          [
            '1/3',
            'c’est la probabilité d’obtenir 5 ou 6 avec le dé seul. Il faut aussi que la pièce donne pile.',
          ],
        ],
        check:
          '1/2 × 1/3 = 1/6. La moitié des chemins commence par pile, et un tiers de ceux-ci se termine par 5 ou 6.',
      },
    }),
    qcm({
      prompt:
        'On lance deux dés équilibrés à six faces, un rouge et un bleu, et on additionne les deux nombres obtenus. On range les issues dans un tableau à double entrée : une ligne par résultat du dé rouge, une colonne par résultat du dé bleu, et la somme dans chaque case. Quelle est la probabilité que la somme soit égale à 8 ?',
      choices: ['1/11', '5/12', '1/12', '5/36'],
      answer: '5/36',
      correction: {
        steps: [
          [
            '6 × 6 = 36',
            'Le tableau a 6 lignes et 6 colonnes, donc 36 cases. Chaque case est une issue, et toutes ont la même probabilité.',
          ],
          [
            '(2 ; 6), (3 ; 5), (4 ; 4), (5 ; 3), (6 ; 2)',
            'On cherche les cases où la somme vaut 8, en écrivant d’abord le résultat du dé rouge. Les cases (2 ; 6) et (6 ; 2) sont différentes. La case (4 ; 4), elle, n’existe qu’une fois.',
          ],
          [
            '5 issues favorables sur 36 : 5/36',
            'On divise le nombre d’issues favorables par le nombre d’issues possibles. La fraction ne se simplifie pas : la probabilité est 5/36.',
          ],
        ],
        traps: [
          [
            '1/11',
            'la somme peut prendre 11 valeurs, de 2 à 12, mais elles n’ont pas la même probabilité : une seule case donne 2, alors que cinq cases donnent 8.',
          ],
          [
            '5/12',
            'on a compté 6 + 6 = 12 issues. Chaque résultat du dé rouge se combine avec les 6 résultats du dé bleu : il y a 6 × 6 = 36 issues.',
          ],
          [
            '1/12',
            'on n’a compté que 3 cases, sans tenir compte de l’ordre : 3/36 = 1/12. Or (2 ; 6) et (6 ; 2) sont deux cases différentes du tableau.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Une urne contient 2 boules rouges et 3 boules bleues, indiscernables au toucher. On tire une boule, on note sa couleur, on la remet dans l’urne, puis on tire une seconde boule. Quelle est la probabilité de tirer deux boules rouges ?',
      choices: ['4/25', '4/5', '1/10', '1/4'],
      answer: '4/25',
      correction: {
        steps: [
          [
            '5 × 5 = 25',
            'La première boule est remise dans l’urne : au second tirage, il y a de nouveau 5 boules. Chaque boule du premier tirage se combine avec les 5 boules du second : 25 issues, toutes de même probabilité.',
          ],
          [
            '2 × 2 = 4',
            'Issues favorables : on nomme R1 et R2 les deux boules rouges. Il y a 2 choix pour la première boule rouge, et encore 2 choix pour la seconde, puisque l’urne n’a pas changé : (R1 ; R1), (R1 ; R2), (R2 ; R1) et (R2 ; R2).',
          ],
          [
            '4 ÷ 25 = 4/25',
            'On divise le nombre d’issues favorables par le nombre d’issues possibles : la probabilité est 4/25.',
          ],
        ],
        traps: [
          [
            '4/5',
            'on a additionné 2/5 et 2/5. Obtenir deux boules rouges de suite est plus difficile qu’en obtenir une seule : la probabilité doit être plus petite que 2/5.',
          ],
          [
            '1/10',
            'c’est la réponse pour un tirage sans remise : 2 × 1 = 2 issues favorables, pour 5 × 4 = 20 issues possibles. Ici, la boule est remise.',
          ],
          [
            '1/4',
            'les quatre résultats rouge-rouge, rouge-bleue, bleue-rouge et bleue-bleue n’ont pas la même probabilité, car l’urne contient plus de boules bleues que de boules rouges.',
          ],
        ],
        check:
          '2/5 des 25 issues commencent par une boule rouge, soit 10 issues. Parmi elles, 2/5 se terminent par une boule rouge, soit 4 issues. On retrouve 2/5 × 2/5 = 4/25.',
      },
    }),
    qcm({
      prompt:
        'Une urne contient 3 boules rouges et 2 boules vertes, indiscernables au toucher. On tire une boule, on ne la remet pas dans l’urne, puis on tire une seconde boule. Quelle est la probabilité de tirer deux boules de couleurs différentes ?',
      choices: ['12/25', '3/10', '3/5', '1/2'],
      answer: '3/5',
      correction: {
        steps: [
          [
            '5 × 4 = 20',
            'On donne un nom à chaque boule : R1, R2, R3 pour les rouges, V1 et V2 pour les vertes. On imagine l’arbre des tirages : 5 branches pour la première boule, puis, au bout de chacune, 4 branches seulement pour la seconde, car la boule tirée n’est pas remise. L’arbre a 20 chemins, tous de même probabilité.',
          ],
          [
            '3 × 2 = 6',
            'Chemins « rouge puis verte » : 3 choix pour la boule rouge (R1, R2 ou R3), puis 2 choix pour la boule verte (V1 ou V2).',
          ],
          [
            '2 × 3 = 6',
            'Chemins « verte puis rouge » : 2 choix pour la boule verte, puis 3 choix pour la boule rouge. Cet ordre compte aussi.',
          ],
          [
            '(6 + 6)/20 = 12/20 = 3/5',
            'On additionne les chemins favorables, on divise par le nombre de chemins, puis on simplifie par 4 : la probabilité est 3/5.',
          ],
        ],
        traps: [
          [
            '12/25',
            'on a compté 5 × 5 = 25 chemins, comme si la première boule était remise dans l’urne. Sans remise, il ne reste que 4 boules au second tirage.',
          ],
          [
            '3/10',
            'on n’a compté qu’un seul ordre, « rouge puis verte » : 6/20 = 3/10. Il manque les 6 chemins « verte puis rouge ».',
          ],
          [
            '1/2',
            'les quatre résultats rouge-rouge, rouge-verte, verte-rouge et verte-verte n’ont pas la même probabilité : on ne peut pas répondre « 2 cas sur 4 ».',
          ],
        ],
        check:
          'la probabilité de tirer deux boules de la même couleur est (3 × 2 + 2 × 1)/20 = 8/20 = 2/5, et 3/5 + 2/5 = 1.',
      },
    }),
    qcm({
      prompt:
        'On lance deux fois de suite un dé équilibré à six faces. Quelle est la probabilité d’obtenir au moins une fois le 6 ?',
      choices: ['1/3', '11/36', '25/36', '5/18'],
      answer: '11/36',
      correction: {
        steps: [
          [
            '6 × 6 = 36',
            'Deux lancers d’un dé donnent 36 issues, toutes de même probabilité : ce sont les 36 cases d’un tableau à double entrée.',
          ],
          [
            '5 × 5 = 25',
            'L’événement contraire de « au moins une fois le 6 » est « aucun 6 ». Il est plus simple à compter : 5 résultats possibles (de 1 à 5) à chaque lancer, soit 25 issues.',
          ],
          [
            '1 − 25/36 = 11/36',
            'La probabilité de n’obtenir aucun 6 est 25/36. On la soustrait de 1 : la probabilité d’obtenir au moins une fois le 6 est 11/36.',
          ],
        ],
        traps: [
          [
            '1/3',
            'on a additionné 1/6 et 1/6, ce qui revient à compter 12 issues favorables. Mais l’issue (6 ; 6) est alors comptée deux fois : il n’y en a que 11.',
          ],
          [
            '25/36',
            'c’est la probabilité de l’événement contraire, « aucun 6 ». Il reste à la soustraire de 1.',
          ],
          [
            '5/18',
            'c’est la probabilité d’obtenir exactement une fois le 6 : 10 issues sur 36. « Au moins une fois » accepte aussi le double 6.',
          ],
        ],
        check:
          'dans le tableau, la ligne du 6 et la colonne du 6 comptent 6 + 6 − 1 = 11 cases, car la case (6 ; 6) leur est commune.',
      },
    }),
  ],
})

export const donnees = [statistiques, probabilites, deuxEpreuves]
