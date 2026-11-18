import { defineExercise, paragraphs, qcm } from '../authoring.js'

/**
 * Espace et grandeurs. Aucune figure : chaque solide et chaque plan de coupe
 * sont décrits par l'énoncé, assez précisément pour être dessinés à main levée.
 */

const volumes = defineExercise({
  id: 'volumes-pyramide-cone-boule',
  title: 'Volumes : pyramide, cône, boule',
  theme: 'espace',
  difficulty: 'medium',
  description:
    'Six calculs : volume d’une pyramide, d’un cône et d’une boule, aire d’une sphère, contenance d’un cylindre en litres, puis un cornet de glace. Valeur exacte avec π, puis valeur arrondie.',
  lesson: paragraphs(
    'Pour un prisme droit, un cylindre, une pyramide ou un cône, le volume se calcule à partir de l’aire de la base et de la hauteur. Pour une boule, le rayon suffit. Rappel : l’aire d’un disque de rayon r est π × r².',
    [
      '- **Prisme droit, cylindre :** V = aire de la base × hauteur.',
      '- **Pyramide, cône :** V = 1/3 × aire de la base × hauteur. Un solide pointu occupe le tiers du prisme ou du cylindre de même base et de même hauteur.',
      '- **Boule de rayon r :** V = 4/3 × π × r³.',
      '- **Sphère de rayon r** (la surface de la boule) : aire = 4 × π × r².',
    ].join('\n'),
    'Le **rayon** est la moitié du diamètre. La **valeur exacte** garde la lettre π, comme 36π ; la calculatrice ne sert qu’à la fin, pour donner une valeur arrondie. Utilise alors la touche π de la calculatrice, et non 3,14 : avec 3,14, le dernier chiffre de l’arrondi peut changer.',
    'Avec des longueurs en cm, une aire est en cm² et un volume en cm³. Pour les contenances : 1 L = 1 dm³ = 1 000 cm³.',
  ),
  example: [
    {
      statement:
        'Un cône a pour base un disque de rayon 2 cm ; sa hauteur est 6 cm. Calcule son volume : valeur exacte, puis valeur arrondie au dixième de cm³.',
      steps: [
        [
          'V = 1/3 × aire de la base × hauteur',
          'On fait un schéma à main levée du cône, avec son rayon et sa hauteur, puis on choisit la formule. Le cône est un solide pointu, comme la pyramide : on n’oublie pas le facteur 1/3.',
        ],
        [
          'Aire de la base : π × 2² = 4π',
          'La base est un disque de rayon 2 cm. On garde la lettre π : c’est elle qui rend le résultat exact.',
        ],
        [
          'V = 1/3 × 4π × 6 = 8π',
          'On multiplie l’aire de la base par la hauteur, puis on prend le tiers : 4 × 6 = 24 et 24 ÷ 3 = 8.',
        ],
        [
          '8π ≈ 25,1',
          'La calculatrice ne sert qu’à cette dernière étape, avec la touche π : 8 × π ≈ 25,133. On arrondit au dixième.',
        ],
      ],
      conclusion: 'Le volume du cône est 8π cm³, soit environ 25,1 cm³.',
    },
    {
      statement:
        'Calcule le volume d’une boule de rayon 6 cm : valeur exacte, puis valeur arrondie au cm³.',
      steps: [
        [
          'V = 4/3 × π × r³',
          'Pour une boule, une seule longueur suffit : le rayon. Il est élevé au cube, car un volume se mesure en cm³.',
        ],
        [
          '6³ = 6 × 6 × 6 = 216',
          'On calcule d’abord le cube du rayon. Le cube n’est ni le carré, 6 × 6, ni le triple, 3 × 6.',
        ],
        [
          'V = 4/3 × π × 216 = 288π',
          'On calcule 4 × 216 ÷ 3 = 288 : c’est le nombre qui multiplie π.',
        ],
        ['288π ≈ 905', 'La calculatrice donne 288 × π ≈ 904,8. On arrondit à l’unité.'],
      ],
      conclusion: 'Le volume de la boule est 288π cm³, soit environ 905 cm³.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'Une pyramide a pour base un carré de côté 6 cm ; sa hauteur est 5 cm. Calcule son volume.',
      choices: ['180 cm³', '60 cm³', '90 cm³', '20 cm³'],
      answer: '60 cm³',
      correction: {
        steps: [
          [
            'Aire de la base : 6² = 36',
            'La base est un carré de côté 6 cm : son aire est côté × côté, soit 36 cm².',
          ],
          [
            'V = 1/3 × 36 × 5',
            'On applique la formule de la pyramide : V = 1/3 × aire de la base × hauteur.',
          ],
          [
            'V = 180 ÷ 3 = 60',
            'On calcule 36 × 5 = 180, puis on prend le tiers. Le volume de la pyramide est 60 cm³.',
          ],
        ],
        traps: [
          [
            '180 cm³',
            'le facteur 1/3 est oublié : 36 × 5 = 180 est le volume du pavé droit de même base et de même hauteur.',
          ],
          [
            '90 cm³',
            'le produit 36 × 5 a été divisé par 2, comme pour l’aire d’un triangle. Pour une pyramide, on divise par 3.',
          ],
          ['20 cm³', '6² a été calculé comme 6 × 2 = 12. Or 6² = 6 × 6 = 36.'],
        ],
        check:
          'la pyramide occupe le tiers du pavé droit de même base et de même hauteur : 180 ÷ 3 = 60.',
      },
    }),
    qcm({
      prompt:
        'Un cône a pour base un disque de rayon 5 cm ; sa hauteur est 9 cm. Quelle est la valeur exacte de son volume ?',
      choices: ['225π cm³', '15π cm³', '30π cm³', '75π cm³'],
      answer: '75π cm³',
      correction: {
        steps: [
          [
            'Aire de la base : π × 5² = 25π',
            'La base est un disque de rayon 5 cm : son aire est π × r². On garde π pour rester en valeur exacte.',
          ],
          [
            'V = 1/3 × 25π × 9',
            'On applique la formule du cône, la même que celle de la pyramide : V = 1/3 × aire de la base × hauteur.',
          ],
          [
            'V = 225π ÷ 3 = 75π',
            'On calcule 25 × 9 = 225, puis on prend le tiers. La valeur exacte du volume est 75π cm³.',
          ],
        ],
        traps: [
          [
            '225π cm³',
            'le facteur 1/3 est oublié : 25π × 9 = 225π est le volume du cylindre de même base et de même hauteur.',
          ],
          [
            '15π cm³',
            'le rayon n’a pas été élevé au carré. L’aire d’un disque est π × r², pas π × r.',
          ],
          [
            '30π cm³',
            'l’aire de la base a été prise égale à 10π, puis 1/3 × 10π × 9 = 30π. Deux erreurs y mènent : 5² calculé comme 5 × 2 = 10, ou le périmètre du disque, 2 × π × 5 = 10π, pris pour son aire. Or l’aire du disque est π × 5² = 25π.',
          ],
        ],
        check: 'avec la calculatrice, 75π ≈ 235,6 : le cône contient environ 236 cm³.',
      },
    }),
    qcm({
      prompt: 'Calcule le volume d’une boule de rayon 9 cm, arrondi au cm³.',
      choices: ['339 cm³', '1 018 cm³', '3 054 cm³', '2 290 cm³'],
      answer: '3 054 cm³',
      correction: {
        steps: [
          [
            'V = 4/3 × π × 9³',
            'On applique la formule de la boule, V = 4/3 × π × r³, avec r = 9. Le rayon est élevé au cube.',
          ],
          [
            '9³ = 9 × 9 × 9 = 729',
            'On calcule d’abord le cube du rayon : le produit de trois facteurs égaux à 9, et non 9 × 3.',
          ],
          [
            'V = 4/3 × π × 729 = 972π',
            'On calcule 4 × 729 ÷ 3 = 972 : la valeur exacte du volume est 972π cm³.',
          ],
          [
            '972π ≈ 3 054',
            'La calculatrice donne 972 × π ≈ 3 053,6. Arrondi à l’unité, le volume est 3 054 cm³.',
          ],
        ],
        traps: [
          ['339 cm³', 'le rayon a été élevé au carré au lieu du cube : 4/3 × π × 9² = 108π ≈ 339.'],
          [
            '1 018 cm³',
            'c’est la formule de l’aire de la sphère : 4 × π × 9² = 324π ≈ 1 018. Une aire se mesure en cm², pas en cm³.',
          ],
          ['2 290 cm³', 'le coefficient 4/3 est oublié : π × 9³ = 729π ≈ 2 290.'],
        ],
        check:
          'la boule tient dans un cube d’arête 18 cm, dont le volume est 18³ = 5 832 cm³. Elle en occupe un peu plus de la moitié : 3 054 est plausible.',
      },
    }),
    qcm({
      prompt: 'Une sphère a pour diamètre 10 cm. Calcule son aire, arrondie au dixième de cm².',
      choices: ['314,2 cm²', '1 256,6 cm²', '78,5 cm²', '523,6 cm²'],
      answer: '314,2 cm²',
      correction: {
        steps: [
          [
            'r = 10 ÷ 2 = 5',
            'La formule utilise le rayon, et l’énoncé donne le diamètre. Le rayon est sa moitié : 5 cm.',
          ],
          [
            'A = 4 × π × 5² = 100π',
            'L’aire d’une sphère de rayon r est 4 × π × r². On calcule 4 × 25 = 100 : la valeur exacte est 100π cm².',
          ],
          [
            '100π ≈ 314,2',
            'La calculatrice donne 100 × π ≈ 314,159. Arrondie au dixième, l’aire de la sphère est 314,2 cm².',
          ],
        ],
        traps: [
          ['1 256,6 cm²', 'le diamètre a été pris pour le rayon : 4 × π × 10² = 400π ≈ 1 256,6.'],
          [
            '78,5 cm²',
            'c’est π × 5² = 25π ≈ 78,5, l’aire d’un disque de rayon 5 cm. Le facteur 4 est oublié.',
          ],
          [
            '523,6 cm²',
            'c’est la formule du volume de la boule : 4/3 × π × 5³ ≈ 523,6. Un volume se mesure en cm³, pas en cm².',
          ],
        ],
        check: 'l’aire d’une sphère vaut 4 fois celle d’un disque de même rayon : 4 × 25π = 100π.',
      },
    }),
    qcm({
      prompt:
        'Un récupérateur d’eau de pluie a la forme d’un cylindre de diamètre 80 cm et de hauteur 1 m. Quelle est sa contenance, arrondie au litre ?',
      choices: ['168 L', '2 011 L', '503 L', '5 027 L'],
      answer: '503 L',
      correction: {
        steps: [
          ['r = 80 ÷ 2 = 40', 'On calcule d’abord le rayon, moitié du diamètre : 40 cm.'],
          [
            '40 cm = 4 dm et 1 m = 10 dm',
            'On convertit les deux longueurs en décimètres. Comme 1 dm³ = 1 L, le volume sera directement en litres.',
          ],
          [
            'V = π × 4² × 10 = 160π',
            'On applique la formule du cylindre : V = aire de la base × hauteur, sans facteur 1/3. La base est un disque d’aire π × r².',
          ],
          [
            '160π ≈ 503',
            'La calculatrice donne 160 × π ≈ 502,7. Le volume est d’environ 503 dm³ : la contenance est 503 L.',
          ],
        ],
        traps: [
          ['2 011 L', 'le diamètre a été pris pour le rayon : π × 8² × 10 = 640π ≈ 2 011.'],
          [
            '168 L',
            'le facteur 1/3 a été appliqué, comme pour un cône : 160π ÷ 3 ≈ 168. Un cylindre n’est pas un solide pointu.',
          ],
          [
            '5 027 L',
            'la hauteur est restée en mètres, alors que le rayon est en centimètres : π × 40² × 1 ≈ 5 027. On convertit d’abord les deux longueurs dans la même unité. En décimètres, le volume est directement en litres, car 1 dm³ = 1 L.',
          ],
        ],
        check: 'en centimètres, π × 40² × 100 ≈ 502 655, et 502 655 ÷ 1 000 ≈ 503.',
      },
    }),
    qcm({
      prompt:
        'Un cornet de glace est formé d’un cône de rayon 3 cm et de hauteur 12 cm, surmonté d’une demi-boule de glace de rayon 3 cm. Calcule le volume total, arrondi au cm³.',
      choices: ['396 cm³', '170 cm³', '226 cm³', '132 cm³'],
      answer: '170 cm³',
      correction: {
        steps: [
          [
            'Cône : 1/3 × π × 3² × 12 = 36π',
            'On calcule séparément les deux solides, en valeur exacte. Pour le cône, on prend le tiers du produit de l’aire de la base par la hauteur : 9 × 12 = 108, puis 108 ÷ 3 = 36.',
          ],
          [
            'Boule entière : 4/3 × π × 3³ = 36π',
            'On applique la formule de la boule avec le rayon 3 cm, élevé au cube : 3³ = 27, puis 4 × 27 ÷ 3 = 36.',
          ],
          [
            'Demi-boule : 36π ÷ 2 = 18π',
            'La glace ne forme qu’une moitié de boule : on divise par 2.',
          ],
          [
            'Total : 36π + 18π = 54π',
            'On ajoute les deux valeurs exactes. Arrondir chaque volume avant de les ajouter pourrait fausser le dernier chiffre.',
          ],
          [
            '54π ≈ 170',
            'La calculatrice donne 54 × π ≈ 169,6. Arrondi à l’unité, le volume total est 170 cm³.',
          ],
        ],
        traps: [
          [
            '396 cm³',
            'le facteur 1/3 du cône est oublié : π × 3² × 12 = 108π, puis 108π + 18π = 126π ≈ 396.',
          ],
          [
            '226 cm³',
            'la boule a été comptée en entier : 36π + 36π = 72π ≈ 226. La glace n’est qu’une demi-boule.',
          ],
          [
            '132 cm³',
            'pour la demi-boule, le rayon a été élevé au carré au lieu du cube : 1/2 × 4/3 × π × 3² = 6π, puis 36π + 6π = 42π ≈ 132.',
          ],
        ],
        check:
          'π est proche de 3, donc 54π est un peu plus grand que 54 × 3 = 162 : le résultat 170 est cohérent.',
      },
    }),
  ],
})

const sections = defineExercise({
  id: 'sections-de-solides-et-reperage',
  title: 'Sections de solides et repérage dans l’espace',
  theme: 'espace',
  difficulty: 'medium',
  description:
    'Huit questions sans figure : section d’un pavé droit, d’un cylindre, d’une pyramide, d’un cône et d’une sphère par un plan, puis repérage dans un pavé droit et sur la sphère terrestre.',
  lesson: paragraphs(
    'Quand on coupe un solide par un plan, la figure obtenue s’appelle la **section**.',
    [
      '- **Pavé droit**, plan parallèle à une face : un rectangle de mêmes dimensions que cette face.',
      '- **Cylindre**, plan parallèle à la base : un disque de même rayon que la base. Plan parallèle à l’axe : un rectangle, de même hauteur que le cylindre.',
      '- **Pyramide ou cône**, plan parallèle à la base : une réduction de la base. Son rapport est k = distance du sommet au plan ÷ hauteur ; toutes les longueurs de la base sont multipliées par k.',
      '- **Sphère** de centre O et de rayon R : un cercle, de centre H. La distance du centre O au plan est OH. Si M est un point du cercle, le triangle OHM est rectangle en H, donc HM² = R² − OH².',
    ].join('\n'),
    '**Se repérer.** Dans un pavé droit, un point a trois coordonnées : (abscisse ; ordonnée ; altitude).',
    'Sur la sphère terrestre, un point a deux coordonnées. Sa **latitude** est un angle compté à partir de l’équateur, de 0° à 90° vers le nord ou vers le sud : les points de même latitude forment un parallèle. Sa **longitude** est un angle compté à partir du méridien de Greenwich, de 0° à 180° vers l’est ou vers l’ouest : les points de même longitude forment un méridien.',
  ),
  example: [
    {
      statement:
        'Un cône de sommet S a pour base un disque de rayon 15 cm ; sa hauteur est 20 cm. On le coupe par un plan parallèle à la base, situé à 8 cm du sommet S. Quelle est la section ?',
      steps: [
        [
          'Section : un disque',
          'On fait un schéma à main levée : le cône, pointe en haut, et le plan de coupe, horizontal comme la base. La section d’un cône par un plan parallèle à sa base est une réduction de la base : c’est un disque, plus petit.',
        ],
        [
          'k = 8 ÷ 20 = 0,4',
          'Le rapport de réduction compare le petit cône, au-dessus du plan, au cône entier : on divise la distance du sommet au plan par la hauteur. Les deux longueurs partent du sommet.',
        ],
        [
          '15 × 0,4 = 6',
          'Dans une réduction de rapport k, toutes les longueurs sont multipliées par k : on multiplie le rayon de la base par 0,4.',
        ],
      ],
      conclusion: 'La section est un disque de rayon 6 cm.',
    },
    {
      statement:
        'Une sphère de centre O a pour rayon 5 cm. On la coupe par un plan situé à 3 cm de O. Quel est le rayon du cercle de section ?',
      steps: [
        [
          'OM² = OH² + HM²',
          'On fait un schéma : H est le centre du cercle de section, M un point de ce cercle. Le triangle OHM est rectangle en H. Son hypoténuse est [OM], un rayon de la sphère : OM = 5 cm. La distance du centre au plan est OH = 3 cm.',
        ],
        [
          'HM² = 5² − 3² = 25 − 9 = 16',
          'On cherche HM, un côté de l’angle droit : on retranche le carré de OH au carré de l’hypoténuse.',
        ],
        [
          'HM = √16 = 4',
          'HM est une longueur, donc un nombre positif : on prend la racine carrée.',
        ],
      ],
      conclusion:
        'Le cercle de section a pour rayon 4 cm. Il est plus petit que la sphère, de rayon 5 cm : c’est cohérent.',
    },
  ],
  questions: [
    qcm({
      prompt:
        'Un pavé droit ABCDEFGH a pour base le rectangle ABCD, avec AB = 8 cm et AD = 5 cm. Ses arêtes [AE], [BF], [CG] et [DH] mesurent 3 cm. On le coupe par un plan parallèle à la face ABCD. Quelle est la section ?',
      choices: [
        'Un rectangle de 8 cm sur 3 cm',
        'Un rectangle de 8 cm sur 5 cm',
        'Un carré de côté 5 cm',
        'Un rectangle de 5 cm sur 3 cm',
      ],
      answer: 'Un rectangle de 8 cm sur 5 cm',
      correction: {
        steps: [
          [
            'Face ABCD : 8 cm sur 5 cm',
            'On fait un schéma à main levée. Le plan de coupe est parallèle à la face ABCD, un rectangle de côtés AB = 8 cm et AD = 5 cm.',
          ],
          [
            'Un rectangle de 8 cm sur 5 cm',
            'La section d’un pavé droit par un plan parallèle à une face est un rectangle de mêmes dimensions que cette face. La hauteur de 3 cm n’intervient pas.',
          ],
        ],
        traps: [
          [
            'Un rectangle de 8 cm sur 3 cm',
            'ce sont les dimensions de la face ABFE. On les obtiendrait avec un plan parallèle à cette face.',
          ],
          [
            'Un carré de côté 5 cm',
            'la section n’est un carré que si la face parallèle au plan en est un. Ici, la face ABCD mesure 8 cm sur 5 cm.',
          ],
          [
            'Un rectangle de 5 cm sur 3 cm',
            'ce sont les dimensions de la face ADHE. On les obtiendrait avec un plan parallèle à cette face.',
          ],
        ],
        check:
          'si on fait glisser le plan de coupe jusqu’en bas, la section vient se poser exactement sur la face ABCD.',
      },
    }),
    qcm({
      prompt:
        'Un cylindre a pour rayon 4 cm et pour hauteur 10 cm. On le coupe par un plan parallèle à sa base, situé à 3 cm de celle-ci. Quelle est la section ?',
      choices: [
        'Un disque de rayon 4 cm',
        'Un disque de rayon 3 cm',
        'Un rectangle de 8 cm sur 10 cm',
        'Un disque de rayon 1,2 cm',
      ],
      answer: 'Un disque de rayon 4 cm',
      correction: {
        steps: [
          [
            'Plan parallèle à la base',
            'On fait un schéma à main levée : le plan de coupe est horizontal, comme les deux bases du cylindre.',
          ],
          [
            'Un disque de rayon 4 cm',
            'La section d’un cylindre par un plan parallèle à sa base est un disque de même rayon que la base. Un cylindre a la même largeur à toutes les hauteurs : la position du plan ne change rien.',
          ],
        ],
        traps: [
          [
            'Un disque de rayon 3 cm',
            '3 cm est la distance du plan à la base, pas un rayon. Cette distance ne change pas la section.',
          ],
          [
            'Un rectangle de 8 cm sur 10 cm',
            'c’est la section par un plan qui contient l’axe du cylindre. Ici, le plan est parallèle à la base.',
          ],
          [
            'Un disque de rayon 1,2 cm',
            'une réduction de rapport 3 ÷ 10 = 0,3 a été appliquée : 4 × 0,3 = 1,2. Cette règle vaut pour un cône, qui se resserre vers son sommet, pas pour un cylindre.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Un cylindre a pour rayon 3 cm et pour hauteur 7 cm. On le coupe par un plan qui contient son axe, la droite passant par les centres des deux bases. Quelle est la section ?',
      choices: [
        'Un rectangle de 3 cm sur 7 cm',
        'Un disque de rayon 3 cm',
        'Un rectangle de 6 cm sur 7 cm',
        'Un triangle isocèle de base 6 cm et de hauteur 7 cm',
      ],
      answer: 'Un rectangle de 6 cm sur 7 cm',
      correction: {
        steps: [
          [
            'Section : un rectangle',
            'La section d’un cylindre par un plan parallèle à son axe est un rectangle. C’est le cas ici, puisque le plan contient l’axe.',
          ],
          [
            '2 × 3 = 6',
            'Le plan passe par le centre de chaque base : il la coupe suivant un diamètre, de longueur 6 cm. C’est la largeur du rectangle.',
          ],
          [
            'Un rectangle de 6 cm sur 7 cm',
            'L’autre dimension du rectangle est la hauteur du cylindre, 7 cm.',
          ],
        ],
        traps: [
          [
            'Un rectangle de 3 cm sur 7 cm',
            'le rayon a été pris pour la largeur. Le plan traverse toute la base : il la coupe suivant un diamètre, et non suivant un rayon.',
          ],
          [
            'Un disque de rayon 3 cm',
            'c’est la section par un plan parallèle à la base. Ici, le plan coupe le cylindre dans le sens de la hauteur.',
          ],
          [
            'Un triangle isocèle de base 6 cm et de hauteur 7 cm',
            'c’est la section d’un cône par un plan qui contient son axe. Un cylindre garde la même largeur de bas en haut.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Dans un pavé droit ABCDEFGH, la face ABCD est posée sur le sol et les arêtes [AE], [BF], [CG] et [DH] sont verticales. On donne AB = 6 cm, AD = 4 cm et AE = 3 cm. Le repère a pour origine A : l’abscisse se lit sur [AB], l’ordonnée sur [AD] et l’altitude sur [AE], avec le centimètre pour unité. Quelles sont les coordonnées (abscisse ; ordonnée ; altitude) du sommet F ?',
      choices: ['(6 ; 4 ; 3)', '(6 ; 3 ; 0)', '(0 ; 4 ; 3)', '(6 ; 0 ; 3)'],
      answer: '(6 ; 0 ; 3)',
      correction: {
        steps: [
          [
            'B(6 ; 0 ; 0)',
            'F est au-dessus de B, au bout de l’arête verticale [BF]. On repère d’abord B : il est à 6 cm de A sur [AB], donc son abscisse est 6. Il ne s’écarte pas vers D et il est au sol : son ordonnée et son altitude sont 0.',
          ],
          [
            'F(6 ; 0 ; 3)',
            'De B à F, on monte de 3 cm, car [BF] a la même longueur que [AE]. Seule l’altitude change : elle passe de 0 à 3. Les coordonnées de F sont (6 ; 0 ; 3).',
          ],
        ],
        traps: [
          [
            '(6 ; 4 ; 3)',
            'ce sont les coordonnées de G, le sommet situé au-dessus de C. Pour F, l’ordonnée est 0 : F est dans la face verticale qui contient A et B.',
          ],
          [
            '(6 ; 3 ; 0)',
            'l’ordonnée et l’altitude sont échangées. L’altitude est toujours la troisième coordonnée.',
          ],
          ['(0 ; 4 ; 3)', 'ce sont les coordonnées de H, le sommet situé au-dessus de D.'],
        ],
      },
    }),
    qcm({
      prompt:
        'Un voilier navigue sur l’océan Atlantique. Il se trouve sur le parallèle situé à 45° au nord de l’équateur, et sur le méridien situé à 30° à l’ouest du méridien de Greenwich. Quelles sont ses coordonnées géographiques ?',
      choices: [
        'Latitude 30° nord, longitude 45° ouest',
        'Latitude 45° ouest, longitude 30° nord',
        'Latitude 45° nord, longitude 30° ouest',
        'Latitude 45° sud, longitude 30° est',
      ],
      answer: 'Latitude 45° nord, longitude 30° ouest',
      correction: {
        steps: [
          [
            'Latitude : 45° nord',
            'La latitude repère le parallèle sur lequel se trouve le point. C’est un angle compté à partir de l’équateur, vers le nord ou vers le sud.',
          ],
          [
            'Longitude : 30° ouest',
            'La longitude repère le méridien. C’est un angle compté à partir du méridien de Greenwich, vers l’est ou vers l’ouest.',
          ],
          [
            'Latitude 45° nord, longitude 30° ouest',
            'On donne d’abord la latitude, puis la longitude, chacune avec son point cardinal.',
          ],
        ],
        traps: [
          [
            'Latitude 30° nord, longitude 45° ouest',
            'les deux angles sont échangés. C’est la latitude qui se mesure à partir de l’équateur : elle vaut 45°.',
          ],
          [
            'Latitude 45° ouest, longitude 30° nord',
            'les points cardinaux sont échangés. Nord et sud vont avec la latitude, est et ouest avec la longitude.',
          ],
          [
            'Latitude 45° sud, longitude 30° est',
            'les deux sens sont inversés. Ce point serait dans l’hémisphère Sud et à l’est de Greenwich, loin de l’Atlantique Nord.',
          ],
        ],
      },
    }),
    qcm({
      prompt:
        'Une pyramide de sommet S a pour base un carré de côté 12 cm ; sa hauteur est 24 cm. On la coupe par un plan parallèle à la base, situé à 6 cm du sommet S. Quelle est la section ?',
      choices: [
        'Un carré de côté 3 cm',
        'Un carré de côté 9 cm',
        'Un carré de côté 6 cm',
        'Un carré de côté 12 cm',
      ],
      answer: 'Un carré de côté 3 cm',
      correction: {
        steps: [
          [
            'k = 6 ÷ 24 = 0,25',
            'La section d’une pyramide par un plan parallèle à la base est une réduction de la base. Son rapport est la distance du sommet au plan, divisée par la hauteur de la pyramide.',
          ],
          [
            '12 × 0,25 = 3',
            'Dans une réduction, toutes les longueurs sont multipliées par k : on multiplie le côté de la base par 0,25.',
          ],
          [
            'Un carré de côté 3 cm',
            'Une réduction garde la forme : la base est un carré, la section aussi.',
          ],
        ],
        traps: [
          [
            'Un carré de côté 9 cm',
            'le rapport a été calculé avec la distance du plan à la base : 24 − 6 = 18, puis 18 ÷ 24 = 0,75 et 12 × 0,75 = 9. La distance se mesure à partir du sommet.',
          ],
          [
            'Un carré de côté 6 cm',
            'la distance a été retranchée au côté : 12 − 6 = 6. Une réduction multiplie les longueurs, elle ne leur retranche rien.',
          ],
          [
            'Un carré de côté 12 cm',
            'c’est le côté de la base. La section garderait cette taille dans un prisme droit ; une pyramide, elle, se resserre vers son sommet.',
          ],
        ],
        check:
          'le plan est au quart de la hauteur à partir du sommet, car 24 ÷ 4 = 6. Le côté de la section est donc le quart de 12 cm : 12 ÷ 4 = 3.',
      },
    }),
    qcm({
      prompt:
        'Une sphère de centre O a pour rayon 13 cm. On la coupe par un plan situé à 5 cm du centre O. Quel est le rayon du cercle de section ?',
      choices: ['8 cm', '13 cm', '13,9 cm', '12 cm'],
      answer: '12 cm',
      correction: {
        steps: [
          [
            'OM² = OH² + HM²',
            'On fait un schéma : H est le centre du cercle de section, M un point de ce cercle. Le triangle OHM est rectangle en H. Son hypoténuse est [OM], un rayon de la sphère : OM = 13 cm. La distance du centre au plan est OH = 5 cm.',
          ],
          [
            'HM² = 13² − 5² = 169 − 25 = 144',
            'On cherche HM, un côté de l’angle droit : on retranche le carré de OH au carré de l’hypoténuse.',
          ],
          [
            'HM = √144 = 12',
            'On prend la racine carrée : le rayon du cercle de section est 12 cm.',
          ],
        ],
        traps: [
          [
            '8 cm',
            'les longueurs ont été retranchées, 13 − 5 = 8, au lieu de leurs carrés. Le théorème de Pythagore porte sur les carrés des longueurs.',
          ],
          [
            '13 cm',
            'c’est le rayon de la sphère. La section n’a ce rayon que si le plan passe par le centre O : c’est alors un grand cercle.',
          ],
          [
            '13,9 cm',
            'les carrés ont été ajoutés : √(169 + 25) = √194 ≈ 13,9. Or l’hypoténuse est [OM], pas [HM]. De plus, un cercle tracé sur la sphère ne peut pas avoir un rayon plus grand qu’elle.',
          ],
        ],
        check: '5² + 12² = 25 + 144 = 169, et 13² = 169 : le triangle OHM est bien rectangle.',
      },
    }),
    qcm({
      prompt:
        'Un gobelet a la forme d’un cône posé pointe en bas. Sa hauteur est 12 cm et son ouverture est un disque de rayon 6 cm. On y verse de l’eau jusqu’à 9 cm de hauteur, mesurés à partir de la pointe. Quel est le rayon du disque formé par la surface de l’eau ?',
      choices: ['1,5 cm', '4,5 cm', '6 cm', '8 cm'],
      answer: '4,5 cm',
      correction: {
        steps: [
          [
            'Surface de l’eau : une section parallèle à la base',
            'On fait un schéma. La surface de l’eau est horizontale, comme l’ouverture du gobelet : c’est la section du cône par un plan parallèle à sa base. Le sommet du cône est la pointe du gobelet, sa base est l’ouverture.',
          ],
          [
            'k = 9 ÷ 12 = 0,75',
            'L’eau remplit un petit cône, réduction du gobelet. Le rapport est la distance du sommet au plan, divisée par la hauteur du cône.',
          ],
          [
            '6 × 0,75 = 4,5',
            'On multiplie le rayon de l’ouverture par k : le rayon de la surface de l’eau est 4,5 cm.',
          ],
        ],
        traps: [
          [
            '1,5 cm',
            'le rapport a été calculé avec la distance de l’eau au bord du gobelet : 12 − 9 = 3, puis 3 ÷ 12 = 0,25 et 6 × 0,25 = 1,5. La distance se mesure à partir du sommet, ici la pointe.',
          ],
          [
            '6 cm',
            'c’est le rayon de l’ouverture. La surface de l’eau n’aurait ce rayon que dans un verre cylindrique.',
          ],
          [
            '8 cm',
            'le rapport a été inversé : 12 ÷ 9 au lieu de 9 ÷ 12, puis 6 × 12 ÷ 9 = 8. Ce serait un agrandissement : la surface de l’eau ne peut pas être plus large que l’ouverture.',
          ],
        ],
        check:
          'l’eau monte aux trois quarts de la hauteur : le rayon de sa surface est les trois quarts de 6 cm, soit 4,5 cm.',
      },
    }),
  ],
})

export const espace = [volumes, sections]
