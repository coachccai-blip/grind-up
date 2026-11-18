import { defineExercise, exact, figure, paragraphs, qcm } from '../authoring.js'

/**
 * Proportionnalité et pourcentages : les pourcentages et les évolutions, les
 * vitesses, puis les ratios, les partages et les échelles. Les deux premiers
 * exercices demandent un nombre, le troisième est un QCM dont chaque mauvais
 * choix est une erreur courante.
 */

const pourcentages = defineExercise({
  id: 'pourcentages-et-evolutions',
  title: 'Pourcentages et évolutions',
  theme: 'proportionnalite',
  difficulty: 'medium',
  description:
    'Appliquer et calculer un pourcentage, utiliser le coefficient multiplicateur d’une hausse ou d’une baisse, calculer un pourcentage d’évolution, retrouver un prix de départ, enchaîner deux évolutions. Réponses à saisir.',
  lesson: paragraphs(
    'Un pourcentage est une fraction de dénominateur 100 : 35 % = 35/100 = 0,35.',
    [
      '- **Prendre t % d’une quantité**, c’est la multiplier par t/100 : 35 % de 80, c’est 0,35 × 80 = 28.',
      '- **Exprimer une part en pourcentage** : divise la part par le tout, puis écris le quotient en centièmes. Par exemple, 0,45 = 45/100 = 45 %.',
      '- **Augmenter de t %**, c’est multiplier par 1 + t/100. **Diminuer de t %**, c’est multiplier par 1 − t/100. Ce nombre est le **coefficient multiplicateur** : 1,20 pour +20 %, 0,85 pour −15 %, 1,03 pour +3 %.',
      '- **Valeur d’arrivée** = valeur de départ × coefficient. Pour retrouver la valeur de départ, divise donc la valeur d’arrivée par le coefficient.',
      '- **Pourcentage d’évolution** : (valeur d’arrivée − valeur de départ) ÷ valeur de départ, quotient que l’on écrit en pourcentage.',
    ].join('\n'),
    figure(
      'pourcentages-rappel-barres',
      'Trois barres : le prix de départ (100 %), après une hausse de 20 % (120 %), après une baisse de 15 % (85 %).',
    ),
    figure(
      'pourcentages-rappel-coefficient',
      'De la valeur de départ à la valeur d’arrivée, on multiplie par le coefficient ; pour revenir, on divise par le coefficient.',
    ),
    'Une évolution se calcule toujours par rapport à la valeur de départ.',
  ),
  example: [
    {
      statement: 'Un pull coûte 40 €. Son prix baisse de 15 %. Calcule le nouveau prix.',
      figure: {
        id: 'pourcentages-ex-pull',
        alt: 'De 40 € au nouveau prix : une baisse de 15 %, soit une multiplication par 0,85.',
      },
      steps: [
        [
          '1 − 15/100 = 0,85',
          'Baisser de 15 %, c’est enlever 15 % aux 100 % du prix : il en reste 85 %. Le coefficient multiplicateur est donc 0,85.',
        ],
        [
          '40 × 0,85 = 34',
          'On multiplie le prix de départ par le coefficient : un seul calcul donne directement le nouveau prix.',
        ],
      ],
      conclusion:
        'Le pull coûte 34 €. On vérifie : la réduction vaut 0,15 × 40 = 6, et 40 − 6 = 34.',
    },
    {
      statement:
        'Après une augmentation de 5 %, un loyer est de 630 €. Quel était le loyer avant l’augmentation ?',
      figure: {
        id: 'pourcentages-ex-loyer',
        alt: 'Du loyer de départ, inconnu, à 630 € : une hausse de 5 %, soit une multiplication par 1,05.',
      },
      steps: [
        [
          '1 + 5/100 = 1,05',
          'Augmenter de 5 %, c’est multiplier par 1,05. Attention : 1,5 correspondrait à une augmentation de 50 %.',
        ],
        [
          'loyer de départ × 1,05 = 630',
          'On écrit ce que dit l’énoncé : le loyer de départ, multiplié par le coefficient, donne 630 €.',
        ],
        [
          '630 ÷ 1,05 = 600',
          'On cherche le nombre qui, multiplié par 1,05, donne 630 : on divise 630 par 1,05.',
        ],
      ],
      conclusion:
        'Le loyer était de 600 €. On vérifie : 600 × 1,05 = 630. Enlever 5 % à 630 € serait une erreur : les 5 % ont été calculés sur le loyer de départ, pas sur 630 €.',
    },
  ],
  questions: [
    exact({
      prompt:
        'Un collège compte 450 élèves. 60 % d’entre eux sont demi-pensionnaires. Combien d’élèves sont demi-pensionnaires ?',
      figure: {
        id: 'pourcentages-q1-demi-pension',
        alt: 'Une bande de 450 élèves partagée en 10 cases ; 6 cases, les 60 %, sont coloriées.',
      },
      answers: ['270'],
      correction: {
        steps: [
          [
            '60 % = 60/100 = 0,60',
            'Un pourcentage est une fraction de dénominateur 100 : 60 %, c’est 60 centièmes.',
          ],
          [
            '0,60 × 450 = 270',
            'Prendre 60 % de 450, c’est multiplier 450 par 0,60. Le collège compte 270 demi-pensionnaires.',
          ],
        ],
        mistake:
          'oublier de diviser par 100. On trouverait 60 × 450 = 27 000 : il y aurait bien plus de demi-pensionnaires que d’élèves dans le collège.',
        check: '10 % de 450, c’est 45. Or 60 %, c’est 6 fois 10 % : 6 × 45 = 270.',
      },
    }),
    exact({
      prompt:
        'Dans une classe de 25 élèves, 8 font partie de la chorale. Quel pourcentage des élèves de la classe cela représente-t-il ? Donne ta réponse en %.',
      figure: {
        id: 'pourcentages-q2-chorale',
        alt: 'Une bande de 25 cases, une par élève ; 8 cases, les choristes, sont coloriées.',
      },
      answers: ['32'],
      correction: {
        steps: [
          [
            '8 ÷ 25 = 0,32',
            'On divise la part (les 8 choristes) par le tout (les 25 élèves de la classe).',
          ],
          [
            '0,32 = 32/100 = 32 %',
            'On écrit le quotient en centièmes : 0,32, c’est 32 centièmes, donc 32 %. La réponse est 32.',
          ],
        ],
        mistake:
          'diviser dans le mauvais sens : 25 ÷ 8 = 3,125. On divise la part par le tout. Ici, la part est plus petite que le tout : le pourcentage est forcément inférieur à 100 %.',
        check: 'on prend 32 % de 25 : 0,32 × 25 = 8. On retrouve bien les 8 choristes.',
      },
    }),
    exact({
      prompt:
        'Un abonnement de sport coûte 350 € par an. Son prix augmente de 6 %. Calcule le nouveau prix, en euros.',
      figure: {
        id: 'pourcentages-q3-abonnement',
        alt: 'De 350 € au nouveau prix, inconnu : une hausse de 6 %.',
      },
      answers: ['371'],
      correction: {
        steps: [
          [
            '1 + 6/100 = 1,06',
            'Augmenter de 6 %, c’est garder 100 % du prix et lui ajouter 6 % : on multiplie par 1,06. C’est le coefficient multiplicateur.',
          ],
          [
            '350 × 1,06 = 371',
            'On multiplie le prix de départ par le coefficient : le nouveau prix est 371 €.',
          ],
        ],
        mistake:
          'multiplier par 1,6 : ce coefficient correspond à une augmentation de 60 %. Autre erreur : ajouter 6 € au prix, alors que 6 % de 350 € font 21 €.',
        check: 'l’augmentation vaut 0,06 × 350 = 21, et 350 + 21 = 371.',
      },
    }),
    exact({
      prompt:
        'En un an, le nombre d’adhérents d’un club d’échecs passe de 160 à 200. Calcule le pourcentage d’augmentation. Donne ta réponse en %.',
      figure: {
        id: 'pourcentages-q4-club',
        alt: 'De 160 à 200 adhérents : le pourcentage d’augmentation est cherché.',
      },
      answers: ['25'],
      correction: {
        steps: [
          ['200 − 160 = 40', 'On calcule d’abord l’augmentation : le club a gagné 40 adhérents.'],
          [
            '40 ÷ 160 = 0,25',
            'On compare cette augmentation à la valeur de départ, 160 : c’est elle qui sert de référence.',
          ],
          [
            '0,25 = 25/100 = 25 %',
            'On écrit le quotient en pourcentage : le nombre d’adhérents a augmenté de 25 %. La réponse est 25.',
          ],
        ],
        mistake:
          'diviser par la valeur d’arrivée. On trouverait 40 ÷ 200 = 0,20, soit 20 %. Une évolution se mesure toujours par rapport à la valeur de départ.',
        check: '160 × 1,25 = 200 : augmenter de 25 %, c’est bien multiplier par 1,25.',
      },
    }),
    exact({
      prompt:
        'Pendant les soldes, un blouson est vendu 68 € après une réduction de 20 %. Quel était son prix avant les soldes, en euros ?',
      figure: {
        id: 'pourcentages-q5-blouson',
        alt: 'Du prix de départ, inconnu, à 68 € : une baisse de 20 %.',
      },
      answers: ['85'],
      correction: {
        steps: [
          [
            '1 − 20/100 = 0,80',
            'Baisser de 20 %, c’est multiplier par 0,80 : on ne paie plus que 80 % du prix.',
          ],
          [
            'prix de départ × 0,80 = 68',
            'On écrit ce que dit l’énoncé : le prix de départ, multiplié par le coefficient, donne le prix soldé.',
          ],
          [
            '68 ÷ 0,80 = 85',
            'Pour revenir au prix de départ, on fait l’opération inverse : on divise par 0,80. Le blouson coûtait 85 €.',
          ],
        ],
        mistake:
          'ajouter 20 % au prix soldé. On trouverait 68 × 1,20 = 81,60, ce qui n’est pas le prix de départ : les 20 % de réduction ont été calculés sur ce prix de départ, pas sur 68 €.',
        check: '85 × 0,80 = 68 : on retrouve bien le prix soldé.',
      },
    }),
    exact({
      prompt:
        'Un téléphone coûte 300 €. Son prix augmente de 20 %, puis le nouveau prix baisse de 20 %. Calcule le prix final, en euros.',
      figure: {
        id: 'pourcentages-q6-telephone',
        alt: 'De 300 € à un prix intermédiaire par une hausse de 20 %, puis au prix final par une baisse de 20 %.',
      },
      answers: ['288'],
      correction: {
        steps: [
          [
            '300 × 1,20 = 360',
            'Première évolution : augmenter de 20 %, c’est multiplier par 1,20. Le prix monte à 360 €.',
          ],
          [
            '360 × 0,80 = 288',
            'Seconde évolution : baisser de 20 %, c’est multiplier par 0,80. La baisse porte sur le nouveau prix, 360 €, et non sur 300 €. Le prix final est 288 €.',
          ],
        ],
        mistake:
          'croire que +20 % puis −20 % se compensent, et répondre 300. La baisse est calculée sur 360 € : elle vaut 72 €, plus que la hausse de 60 €.',
        check:
          '1,20 × 0,80 = 0,96. Au total, le prix est multiplié par 0,96 : il a baissé de 4 %. Et 300 × 0,96 = 288.',
      },
    }),
  ],
})

const vitesse = defineExercise({
  id: 'vitesse-duree-distance',
  title: 'Vitesse, durée, distance',
  theme: 'proportionnalite',
  difficulty: 'medium',
  description:
    'Utiliser v = d ÷ t sous ses trois formes, écrire une durée en heures décimales, passer des m/s aux km/h, puis résoudre un problème de vitesse moyenne sur un trajet en deux parties. Réponses à saisir.',
  lesson: paragraphs(
    'La **vitesse moyenne** d’un trajet est le quotient de la distance parcourue par la durée du trajet. Avec v pour la vitesse, d pour la distance et t pour la durée :',
    [
      '- v = d ÷ t, pour calculer une vitesse ;',
      '- d = v × t, pour calculer une distance ;',
      '- t = d ÷ v, pour calculer une durée.',
    ].join('\n'),
    figure(
      'vitesse-rappel-triangle',
      'Le triangle des vitesses : d en haut, v et t en bas, et les trois formules.',
    ),
    'Les unités doivent s’accorder : avec d en km et t en h, v est en km/h.',
    '**Durées.** Une heure compte 60 minutes, pas 100. Pour écrire des minutes en heures, divise par 60 : 30 min = 0,5 h ; 15 min = 0,25 h ; 45 min = 0,75 h. Ainsi 1 h 30 min = 1,5 h, et non 1,3 h. Dans l’autre sens, multiplie par 60 : 0,2 h = 12 min.',
    figure(
      'vitesse-rappel-heure',
      'Une horloge dont un quart est colorié : 15 min, c’est un quart d’heure ; puis 30, 45 et 60 min écrites en heures.',
    ),
    '**Conversions.** 1 m/s = 3,6 km/h. Pour passer des km/h aux m/s, divise par 3,6. Pour passer des m/s aux km/h, multiplie par 3,6.',
    figure(
      'vitesse-rappel-conversion',
      'Des m/s aux km/h, on multiplie par 3,6 ; des km/h aux m/s, on divise par 3,6.',
    ),
  ),
  example: [
    {
      statement: 'Un car parcourt 105 km en 1 h 30 min. Calcule sa vitesse moyenne, en km/h.',
      figure: {
        id: 'vitesse-ex-car',
        alt: 'Un véhicule sur une route de 105 km, parcourue en 1 h 30 min ; la vitesse est cherchée.',
      },
      steps: [
        [
          '30 ÷ 60 = 0,5',
          'On écrit d’abord la durée en heures. Une heure compte 60 minutes : 30 min, c’est 0,5 h. Le trajet dure donc 1,5 h, et non 1,30 h.',
        ],
        [
          'v = d ÷ t',
          'On cherche une vitesse : on choisit la formule qui la donne. La distance est en km et la durée en h.',
        ],
        [
          'v = 105 ÷ 1,5 = 70',
          'On remplace par les valeurs. Le résultat est en km/h, puisque la distance est en km et la durée en h.',
        ],
      ],
      conclusion:
        'La vitesse moyenne du car est 70 km/h. On vérifie : en 1,5 h à 70 km/h, le car parcourt bien 105 km, car 70 × 1,5 = 105.',
    },
    {
      statement: 'Une voiture roule à 90 km/h. Convertis cette vitesse en m/s.',
      steps: [
        [
          '90 × 1 000 = 90 000',
          'Rouler à 90 km/h, c’est parcourir 90 km en 1 h. On convertit la distance en mètres : 90 km font 90 000 m.',
        ],
        [
          '60 × 60 = 3 600',
          'On convertit la durée en secondes : 1 h compte 60 min, et chaque minute compte 60 s.',
        ],
        [
          '90 000 ÷ 3 600 = 25',
          'On divise la distance en mètres par la durée en secondes : la voiture parcourt 25 m chaque seconde.',
        ],
        [
          '90 ÷ 3,6 = 25',
          'Le raccourci : multiplier par 1 000 puis diviser par 3 600 revient à diviser par 3,6.',
        ],
      ],
      conclusion:
        'La voiture roule à 25 m/s. Dans l’autre sens, on multiplie par 3,6 : 25 × 3,6 = 90.',
    },
  ],
  questions: [
    exact({
      prompt: 'Écris la durée 2 h 18 min en heures, sous forme décimale.',
      answers: ['2,3'],
      correction: {
        steps: [
          [
            '18 ÷ 60 = 0,3',
            'Une heure compte 60 minutes : pour écrire 18 min en heures, on divise par 60.',
          ],
          ['2 + 0,3 = 2,3', 'On ajoute les 2 heures entières : la durée est 2,3 h.'],
        ],
        mistake:
          'écrire 2,18 h. Les minutes ne sont pas des centièmes d’heure : 0,18 × 60 = 10,8, donc 0,18 h dure moins de 11 minutes, et non 18.',
        check: '0,3 × 60 = 18 : on retrouve bien les 18 minutes.',
      },
    }),
    exact({
      prompt: 'Une voiture parcourt 150 km en 2 h 30 min. Calcule sa vitesse moyenne, en km/h.',
      figure: {
        id: 'vitesse-q2-voiture',
        alt: 'Une voiture sur une route de 150 km, parcourue en 2 h 30 min ; la vitesse est cherchée.',
      },
      answers: ['60'],
      correction: {
        steps: [
          [
            '30 ÷ 60 = 0,5',
            'On écrit la durée en heures : 30 min, c’est 0,5 h. Le trajet dure donc 2,5 h.',
          ],
          ['v = d ÷ t', 'On cherche la vitesse : on divise la distance par la durée.'],
          [
            'v = 150 ÷ 2,5 = 60',
            'La distance est en km et la durée en h : la vitesse moyenne est 60 km/h.',
          ],
        ],
        mistake:
          'taper 150 ÷ 2,30 à la calculatrice. Elle ne connaît pas les minutes : pour elle, 2,30 h vaut 2 h 18 min, pas 2 h 30 min.',
        check: 'en 2,5 h à 60 km/h, la voiture parcourt bien 150 km, car 60 × 2,5 = 150.',
      },
    }),
    exact({
      prompt:
        'Un coureur court pendant 45 min à la vitesse moyenne de 12 km/h. Quelle distance parcourt-il, en km ?',
      figure: {
        id: 'vitesse-q3-coureur',
        alt: 'Un coureur : 45 min à 12 km/h ; la distance est cherchée.',
      },
      answers: ['9'],
      correction: {
        steps: [
          [
            '45 ÷ 60 = 0,75',
            'La vitesse est en km/h : la durée doit être en heures. 45 min, c’est trois quarts d’heure, soit 0,75 h.',
          ],
          ['d = v × t', 'On cherche la distance : on multiplie la vitesse par la durée.'],
          [
            'd = 12 × 0,75 = 9',
            'On remplace par les valeurs. La vitesse est en km/h et la durée en h : la distance est en km. Le coureur parcourt 9 km.',
          ],
        ],
        mistake:
          'laisser la durée en minutes. On trouverait 12 × 45 = 540, soit 540 km en trois quarts d’heure : c’est impossible. Autre piège : écrire que 45 min font 0,45 h.',
        check:
          'en une heure, il parcourrait 12 km. En trois quarts d’heure, il en parcourt les trois quarts : 3/4 × 12 = 9.',
      },
    }),
    exact({
      prompt:
        'Une cycliste roule à la vitesse moyenne de 25 km/h. Combien de temps met-elle pour parcourir 10 km ? Donne ta réponse en minutes.',
      figure: {
        id: 'vitesse-q4-cycliste',
        alt: 'Une cycliste à 25 km/h sur une route de 10 km ; la durée, en minutes, est cherchée.',
      },
      answers: ['24'],
      correction: {
        steps: [
          ['t = d ÷ v', 'On cherche la durée : on divise la distance par la vitesse.'],
          [
            't = 10 ÷ 25 = 0,4',
            'La distance est en km et la vitesse en km/h : la durée obtenue est en heures, soit 0,4 h.',
          ],
          [
            '0,4 × 60 = 24',
            'On convertit en minutes : une heure compte 60 minutes, donc on multiplie par 60. Le trajet dure 24 min.',
          ],
        ],
        mistake:
          'lire 0,4 h comme « 40 minutes ». 0,4 h, c’est 4 dixièmes d’heure, et un dixième d’heure dure 6 min.',
        check:
          '24 min, c’est bien 0,4 h, car 24 ÷ 60 = 0,4. Et 25 × 0,4 = 10 : on retrouve les 10 km.',
      },
    }),
    exact({
      prompt: 'Un guépard peut courir à 30 m/s. Convertis cette vitesse en km/h.',
      answers: ['108'],
      correction: {
        steps: [
          [
            '30 × 3 600 = 108 000',
            'À 30 m/s, le guépard parcourt 30 m chaque seconde. Une heure compte 3 600 secondes : en une heure, il parcourrait 108 000 m.',
          ],
          [
            '108 000 ÷ 1 000 = 108',
            'On convertit les mètres en kilomètres en divisant par 1 000 : la vitesse est 108 km/h.',
          ],
          ['30 × 3,6 = 108', 'Le raccourci : pour passer des m/s aux km/h, on multiplie par 3,6.'],
        ],
        mistake:
          'diviser par 3,6 au lieu de multiplier. On trouverait environ 8 km/h, la vitesse d’une personne qui trottine : un guépard va bien plus vite.',
        check: '108 ÷ 3,6 = 30 : en divisant par 3,6, on retrouve bien la vitesse en m/s.',
      },
    }),
    exact({
      prompt:
        'Pour partir en vacances, une famille roule 2 h sur l’autoroute à 110 km/h, puis 1 h sur une route de campagne à 50 km/h. Calcule sa vitesse moyenne sur l’ensemble du trajet, en km/h.',
      figure: {
        id: 'vitesse-q6-vacances',
        alt: 'Le trajet en deux parties : 2 h d’autoroute à 110 km/h, puis 1 h de campagne à 50 km/h ; la vitesse moyenne est cherchée.',
      },
      answers: ['90'],
      correction: {
        steps: [
          [
            '110 × 2 = 220',
            'On calcule la distance parcourue sur l’autoroute, avec d = v × t : 220 km.',
          ],
          ['50 × 1 = 50', 'De la même façon, la famille parcourt 50 km sur la route de campagne.'],
          [
            '220 + 50 = 270 et 2 + 1 = 3',
            'On additionne les distances, puis les durées : le trajet complet fait 270 km et dure 3 h.',
          ],
          [
            'v = 270 ÷ 3 = 90',
            'La vitesse moyenne est la distance totale divisée par la durée totale : 90 km/h.',
          ],
        ],
        mistake:
          'faire la moyenne des deux vitesses. On trouverait (110 + 50) ÷ 2 = 80. Or la famille roule deux fois plus longtemps à 110 km/h qu’à 50 km/h : les deux vitesses ne comptent pas autant.',
        check: 'en 3 h à 90 km/h, on parcourt bien les 270 km du trajet, car 90 × 3 = 270.',
      },
    }),
  ],
})

const ratios = defineExercise({
  id: 'ratios-partages-echelles',
  title: 'Ratios, partages et échelles',
  theme: 'proportionnalite',
  difficulty: 'easy',
  description:
    'Compléter un tableau de proportionnalité avec le produit en croix, reconnaître un ratio, partager une somme dans le ratio 2:3 ou 2:3:5, utiliser l’échelle d’une carte, adapter une recette. Chaque mauvais choix est une erreur courante.',
  lesson: paragraphs(
    'Deux grandeurs sont **proportionnelles** quand on passe de l’une à l’autre en multipliant toujours par le même nombre, le **coefficient de proportionnalité**.',
    '**Produit en croix.** Dans un tableau de proportionnalité, la valeur manquante s’obtient en multipliant les deux nombres de la diagonale complète, puis en divisant par le troisième nombre. Exemple : 4 m de tissu coûtent 10 €. Pour le prix de 6 m, on calcule 10 × 6 ÷ 4 = 15 : ils coûtent 15 €.',
    figure(
      'ratios-rappel-tableau',
      'Le tableau du tissu : 4 m pour 10 €, 6 m pour 15 € ; on passe d’une ligne à l’autre par × 2,5, d’une colonne à l’autre par × 1,5.',
    ),
    '**Ratio.** Deux quantités sont dans le ratio 2:3 (on lit « 2 pour 3 ») quand la première compte 2 parts chaque fois que la seconde en compte 3, toutes les parts étant égales. Avec trois quantités, on écrit de même 2:3:5. Pour partager une quantité dans un ratio donné :',
    [
      '1. compte le nombre total de parts ;',
      '2. calcule la valeur d’une part ;',
      '3. multiplie-la par le nombre de parts de chacun.',
    ].join('\n'),
    figure(
      'ratios-rappel-bande',
      'Une bande de 5 parts égales : 2 parts d’une couleur, 3 parts d’une autre, pour le ratio 2:3.',
    ),
    '**Échelle.** Sur une carte, les longueurs sont proportionnelles aux longueurs réelles. À l’échelle 1/50 000, 1 cm sur la carte représente 50 000 cm en réalité, soit 500 m.',
    figure(
      'ratios-rappel-echelle',
      'Une carte et sa barre d’échelle : à l’échelle 1/50 000, 1 cm sur la carte représente 50 000 cm, soit 500 m.',
    ),
  ),
  example: [
    {
      statement:
        'Adam et Inès se partagent 56 billes dans le ratio 3:4. Combien de billes reçoit chacun ?',
      figure: {
        id: 'ratios-ex-billes',
        alt: 'Une bande de 56 billes partagée en 7 parts égales : 3 pour Adam, 4 pour Inès.',
      },
      steps: [
        [
          '3 + 4 = 7',
          'Le ratio 3:4 dit qu’Adam reçoit 3 parts quand Inès en reçoit 4. On compte d’abord le nombre total de parts.',
        ],
        [
          '56 ÷ 7 = 8',
          'Toutes les parts sont égales : on divise les 56 billes par le nombre de parts. Une part vaut 8 billes.',
        ],
        [
          '3 × 8 = 24 et 4 × 8 = 32',
          'On multiplie la valeur d’une part par le nombre de parts de chacun.',
        ],
      ],
      conclusion:
        'Adam reçoit 24 billes et Inès 32. On vérifie que le partage est complet : 24 + 32 = 56.',
    },
    {
      statement:
        'Sur un plan à l’échelle 1/200, une chambre mesure 2,5 cm de long. Quelle est sa longueur réelle ?',
      steps: [
        [
          '2,5 × 200 = 500',
          'À l’échelle 1/200, les longueurs réelles sont 200 fois plus grandes que celles du plan. Le résultat garde l’unité du plan : 500 cm.',
        ],
        [
          '500 ÷ 100 = 5',
          'On convertit dans une unité adaptée à une chambre : il y a 100 cm dans 1 m, donc on divise par 100.',
        ],
      ],
      conclusion: 'La chambre mesure 5 m de long.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'Dans un tableau de proportionnalité, la première ligne donne la masse de pommes : 3 kg, puis 5 kg. La seconde ligne donne le prix : 7,50 € sous les 3 kg, et une case vide sous les 5 kg. Quel prix faut-il écrire dans la case vide ?',
      figure: {
        id: 'ratios-q1-tableau',
        alt: 'Le tableau : 3 kg pour 7,50 €, 5 kg pour un prix cherché.',
      },
      choices: ['9,50 €', '12,50 €', '4,50 €', '37,50 €'],
      answer: '12,50 €',
      correction: {
        steps: [
          [
            '7,50 × 5 = 37,50',
            'Produit en croix : la case vide est en diagonale avec 3. On multiplie les deux nombres de l’autre diagonale, 7,50 et 5.',
          ],
          [
            '37,50 ÷ 3 = 12,50',
            'On divise par le troisième nombre, 3. Dans la case vide, on écrit 12,50 €.',
          ],
        ],
        traps: [
          [
            '9,50 €',
            'on a ajouté 2 € parce qu’il y a 2 kg de plus. Or 2 kg de plus coûtent 2 × 2,50 = 5, soit 5 € de plus, et non 2 € : on passe de la masse au prix en multipliant, pas en ajoutant.',
          ],
          [
            '4,50 €',
            'le produit en croix est mal posé. On a calculé 7,50 × 3 ÷ 5 = 4,50. Or 5 kg coûtent forcément plus cher que 3 kg.',
          ],
          ['37,50 €', 'il manque la division par 3. Ce prix est celui de 5 fois 3 kg, soit 15 kg.'],
        ],
        check: 'le prix d’un kilogramme est 7,50 ÷ 3 = 2,50, et 5 × 2,50 = 12,50.',
      },
    }),
    qcm({
      prompt:
        'Dans un club de judo, le nombre de filles et le nombre de garçons sont dans le ratio 2:3. Quelle composition du club respecte ce ratio ?',
      figure: {
        id: 'ratios-q2-judo',
        alt: 'Une bande de 5 parts égales : 2 parts de filles, 3 parts de garçons.',
      },
      choices: [
        '10 filles et 15 garçons',
        '15 filles et 10 garçons',
        '10 filles et 11 garçons',
        '10 filles et 5 garçons',
      ],
      answer: '10 filles et 15 garçons',
      correction: {
        steps: [
          [
            '10 ÷ 2 = 5 et 15 ÷ 3 = 5',
            'Dans le ratio 2:3, les filles comptent 2 parts quand les garçons en comptent 3, et toutes les parts sont égales. On calcule la valeur d’une part de chaque côté : on trouve le même nombre, 5.',
          ],
          [
            '10 = 2 × 5 et 15 = 3 × 5',
            'Le club compte 2 parts de 5 filles et 3 parts de 5 garçons : la bonne réponse est « 10 filles et 15 garçons ».',
          ],
        ],
        traps: [
          [
            '15 filles et 10 garçons',
            'l’ordre est inversé. Ce club compte 3 parts de filles pour 2 parts de garçons : c’est le ratio 3:2.',
          ],
          [
            '10 filles et 11 garçons',
            'on a ajouté 1, comme pour passer de 2 à 3. Un ratio ne compare pas des écarts, mais des parts égales : 10 ÷ 2 = 5, alors que 11 ÷ 3 ne donne pas 5.',
          ],
          [
            '10 filles et 5 garçons',
            'le ratio 2:3 ne veut pas dire « 2 sur 3 ». Ici, les filles sont 10 sur 15 membres : filles et garçons sont dans le ratio 2:1.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Léo et Jade se partagent 60 € dans le ratio 2:3. Léo reçoit donc 2 parts quand Jade en reçoit 3. Combien reçoit Jade ?',
      figure: {
        id: 'ratios-q3-partage',
        alt: 'Une bande de 60 € en 5 parts égales : 2 pour Léo, 3 pour Jade, dont la somme est cherchée.',
      },
      choices: ['12 €', '20 €', '40 €', '36 €'],
      answer: '36 €',
      correction: {
        steps: [
          ['2 + 3 = 5', 'On compte le nombre total de parts : 2 pour Léo et 3 pour Jade.'],
          ['60 ÷ 5 = 12', 'On partage les 60 € en 5 parts égales : une part vaut 12 €.'],
          [
            '3 × 12 = 36',
            'On multiplie la valeur d’une part par le nombre de parts de Jade : elle reçoit 36 €.',
          ],
        ],
        traps: [
          ['12 €', 'c’est la valeur d’une seule part. Jade en reçoit 3.'],
          [
            '20 €',
            'on a divisé 60 par 3, le nombre de parts de Jade. On divise par le nombre total de parts, 5.',
          ],
          [
            '40 €',
            'ce sont les deux tiers de 60 €. Le ratio 2:3 ne veut pas dire « deux tiers » : Jade reçoit 3 parts sur 5.',
          ],
        ],
        check:
          'Léo reçoit 2 × 12 = 24. Le partage est complet, car 24 + 36 = 60, et il respecte le ratio, car 24 ÷ 2 = 36 ÷ 3.',
      },
    }),
    qcm({
      prompt:
        'Ali, Bianca et Chloé se partagent 90 € dans le ratio 2:3:5. Combien reçoit Chloé, qui a 5 parts ?',
      figure: {
        id: 'ratios-q4-partage',
        alt: 'Une bande de 90 € en 10 parts égales : 2 pour Ali, 3 pour Bianca, 5 pour Chloé, dont la somme est cherchée.',
      },
      choices: ['45 €', '18 €', '30 €', '9 €'],
      answer: '45 €',
      correction: {
        steps: [
          [
            '2 + 3 + 5 = 10',
            'Avec trois nombres, la méthode ne change pas : on compte d’abord le nombre total de parts.',
          ],
          ['90 ÷ 10 = 9', 'On partage les 90 € en 10 parts égales : une part vaut 9 €.'],
          [
            '5 × 9 = 45',
            'On multiplie la valeur d’une part par le nombre de parts de Chloé : elle reçoit 45 €.',
          ],
        ],
        traps: [
          [
            '18 €',
            'on a divisé 90 par 5, le nombre de parts de Chloé. On divise par le nombre total de parts, 10. C’est aussi la somme que reçoit Ali, qui n’a que 2 parts.',
          ],
          [
            '30 €',
            'c’est un partage en trois parts égales. Dans le ratio 2:3:5, les trois amis ne reçoivent pas la même somme.',
          ],
          ['9 €', 'c’est la valeur d’une seule part. Chloé en reçoit 5.'],
        ],
        check:
          'Ali reçoit 2 × 9 = 18 et Bianca 3 × 9 = 27. Le partage est complet : 18 + 27 + 45 = 90.',
      },
    }),
    qcm({
      prompt:
        'Sur une carte de randonnée à l’échelle 1/25 000, deux refuges sont distants de 6 cm. Quelle est la distance réelle entre ces deux refuges ?',
      figure: {
        id: 'ratios-q5-carte',
        alt: 'Une carte à l’échelle 1/25 000 : deux refuges à 6 cm l’un de l’autre ; la distance réelle est cherchée.',
      },
      choices: ['150 m', '15 km', '1,5 km', '150 km'],
      answer: '1,5 km',
      correction: {
        steps: [
          [
            '6 × 25 000 = 150 000',
            'À l’échelle 1/25 000, 1 cm sur la carte représente 25 000 cm en réalité. On multiplie donc la distance mesurée sur la carte par 25 000 : le résultat est en centimètres.',
          ],
          [
            '150 000 ÷ 100 = 1 500',
            'On convertit en mètres : il y a 100 cm dans 1 m, donc on divise par 100.',
          ],
          [
            '1 500 ÷ 1 000 = 1,5',
            'On convertit en kilomètres : il y a 1 000 m dans 1 km. La distance réelle est 1,5 km.',
          ],
        ],
        traps: [
          ['150 m', 'la conversion en mètres est fausse : 150 000 cm font 1 500 m, pas 150 m.'],
          [
            '15 km',
            'la conversion en kilomètres est fausse : 1 km vaut 100 000 cm, pas 10 000 cm.',
          ],
          [
            '150 km',
            'les 150 000 obtenus sont des centimètres, pas des mètres. Il faut encore diviser par 100 avant de passer aux kilomètres.',
          ],
        ],
        check:
          '1 cm sur la carte représente 250 m. Or 6 × 250 = 1 500 : les 6 cm représentent 1 500 m, soit 1,5 km.',
      },
    }),
    qcm({
      prompt:
        'Une recette de pâte à crêpes prévue pour 4 personnes demande 250 g de farine. Quelle masse de farine faut-il pour 10 personnes ?',
      figure: {
        id: 'ratios-q6-recette',
        alt: 'Le tableau de la recette : 250 g de farine pour 4 personnes, une masse cherchée pour 10 personnes.',
      },
      choices: ['500 g', '625 g', '2 500 g', '100 g'],
      answer: '625 g',
      correction: {
        steps: [
          [
            '250 ÷ 4 = 62,5',
            'La masse de farine est proportionnelle au nombre de personnes. On cherche d’abord la masse pour une personne : c’est le passage à l’unité.',
          ],
          [
            '62,5 × 10 = 625',
            'On multiplie par le nombre de personnes : pour 10 personnes, il faut 625 g de farine.',
          ],
        ],
        traps: [
          [
            '500 g',
            'c’est le double de la recette, donc la farine pour 8 personnes. Il manque celle de 2 personnes.',
          ],
          [
            '2 500 g',
            'on a multiplié par 10 sans diviser par 4. C’est la farine pour 10 recettes, soit 40 personnes.',
          ],
          [
            '100 g',
            'le produit en croix est inversé. On a calculé 250 × 4 ÷ 10 = 100. Pour plus de personnes, il faut plus de farine, pas moins.',
          ],
        ],
        check:
          'avec le produit en croix, 250 × 10 ÷ 4 = 625. Autre contrôle : 10 personnes, c’est 2,5 fois 4 personnes, et 250 × 2,5 = 625.',
      },
    }),
  ],
})

export const proportionnalite = [pourcentages, vitesse, ratios]
