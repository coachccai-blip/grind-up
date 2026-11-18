import { defineExercise, exact, paragraphs, qcm } from '../authoring.js'

/**
 * Géométrie plane. Les figures sont décrites par leur énoncé : l'élève commence
 * par un schéma à main levée, comme le montre chaque exemple.
 */

const pythagore = defineExercise({
  id: 'theoreme-de-pythagore',
  title: 'Théorème de Pythagore et sa réciproque',
  theme: 'geometrie',
  difficulty: 'medium',
  description:
    'Calculer l’hypoténuse ou un côté de l’angle droit, résoudre un problème concret, puis reconnaître un triangle rectangle avec la réciproque. Réponses à saisir.',
  lesson: paragraphs(
    'Le théorème de Pythagore ne s’utilise que dans un **triangle rectangle**. L’**hypoténuse** est le côté en face de l’angle droit : c’est le plus long des trois côtés.',
    [
      '- **Théorème :** si le triangle ABC est rectangle en A, alors BC² = AB² + AC². Le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.',
      '- **Réciproque :** si, dans un triangle, le carré du plus long côté est égal à la somme des carrés des deux autres, alors ce triangle est rectangle. Si cette égalité est fausse, le triangle n’est pas rectangle.',
    ].join('\n'),
    'Pour calculer l’hypoténuse, on additionne les carrés. Pour calculer un côté de l’angle droit, on soustrait.',
  ),
  example: [
    {
      statement: 'Le triangle EFG est rectangle en E. EF = 8 cm et EG = 15 cm. Calcule FG.',
      steps: [
        [
          'FG² = EF² + EG²',
          'On fait un schéma à main levée. L’angle droit est en E, donc l’hypoténuse est [FG], le côté en face. On écrit l’égalité de Pythagore.',
        ],
        [
          'FG² = 8² + 15² = 64 + 225 = 289',
          'On remplace par les longueurs connues, puis on calcule les carrés et leur somme.',
        ],
        [
          'FG = √289 = 17',
          'FG est une longueur, donc un nombre positif : c’est la racine carrée de 289.',
        ],
      ],
      conclusion: 'FG = 17 cm.',
    },
    {
      statement: 'Le triangle RST est rectangle en R. ST = 20 cm et RS = 12 cm. Calcule RT.',
      steps: [
        [
          'ST² = RS² + RT²',
          'L’hypoténuse est [ST]. On écrit la même égalité : cette fois, la longueur cherchée est un côté de l’angle droit.',
        ],
        [
          'RT² = 20² − 12² = 400 − 144 = 256',
          'Pour isoler RT², on retranche 12² au carré de l’hypoténuse.',
        ],
        ['RT = √256 = 16', 'On prend la racine carrée.'],
      ],
      conclusion: 'RT = 16 cm. Ce côté est bien plus court que l’hypoténuse, qui mesure 20 cm.',
    },
  ],
  questions: [
    exact({
      prompt: 'Le triangle ABC est rectangle en A. AB = 3 cm et AC = 4 cm. Calcule BC, en cm.',
      answers: ['5'],
      correction: {
        steps: [
          [
            'BC² = AB² + AC²',
            'Le triangle est rectangle en A : l’hypoténuse est [BC], le côté en face de l’angle droit.',
          ],
          ['BC² = 3² + 4² = 9 + 16 = 25', 'On remplace, puis on calcule les carrés et leur somme.'],
          ['BC = √25 = 5', 'On prend la racine carrée : BC mesure 5 cm.'],
        ],
        mistake:
          'ajouter les longueurs au lieu de leurs carrés. 3 + 4 = 7 n’est pas la longueur de l’hypoténuse.',
      },
    }),
    exact({
      prompt: 'Le triangle DEF est rectangle en D. DE = 5 cm et DF = 12 cm. Calcule EF, en cm.',
      answers: ['13'],
      correction: {
        steps: [
          ['EF² = DE² + DF²', 'L’angle droit est en D, donc l’hypoténuse est [EF].'],
          ['EF² = 5² + 12² = 25 + 144 = 169', 'On remplace, puis on calcule.'],
          ['EF = √169 = 13', 'On prend la racine carrée : EF mesure 13 cm.'],
        ],
        mistake:
          'oublier la racine carrée et répondre 169. C’est EF² qui vaut 169, pas la longueur EF.',
      },
    }),
    exact({
      prompt: 'Le triangle IJK est rectangle en I. JK = 10 cm et IJ = 6 cm. Calcule IK, en cm.',
      answers: ['8'],
      correction: {
        steps: [
          [
            'JK² = IJ² + IK²',
            'L’angle droit est en I, donc l’hypoténuse est [JK] : c’est elle qui est seule d’un côté de l’égalité. La longueur cherchée, IK, est un côté de l’angle droit.',
          ],
          ['IK² = 10² − 6² = 100 − 36 = 64', 'On retranche 6² au carré de l’hypoténuse.'],
          ['IK = √64 = 8', 'On prend la racine carrée : IK mesure 8 cm.'],
        ],
        mistake:
          'additionner les carrés comme si IK était l’hypoténuse. On trouverait √136, soit plus de 11 cm : un côté plus long que l’hypoténuse, c’est impossible.',
      },
    }),
    exact({
      prompt:
        'Le triangle LMN est rectangle en M. LM = 4 cm et MN = 6 cm. Calcule LN, en cm, arrondi au dixième.',
      answers: ['7,2'],
      correction: {
        steps: [
          ['LN² = LM² + MN²', 'L’angle droit est en M, donc l’hypoténuse est [LN].'],
          ['LN² = 4² + 6² = 16 + 36 = 52', 'On remplace, puis on calcule.'],
          [
            'LN = √52 ≈ 7,2',
            '52 n’est pas un carré parfait : la calculatrice donne √52 ≈ 7,211. Arrondie au dixième, la longueur LN est 7,2 cm.',
          ],
        ],
        mistake:
          'donner 7,21 : « au dixième » veut dire un seul chiffre après la virgule. Le chiffre des centièmes est 1 : on garde 7,2.',
      },
    }),
    exact({
      prompt:
        'Une échelle de 5 m est posée sur un sol horizontal, contre un mur vertical. Son pied est à 1,4 m du mur. À quelle hauteur, en m, touche-t-elle le mur ?',
      answers: ['4,8'],
      correction: {
        steps: [
          [
            '5² = 1,4² + h²',
            'Le mur est vertical et le sol horizontal : ils forment un angle droit. L’échelle est l’hypoténuse du triangle ; on appelle h la hauteur cherchée.',
          ],
          ['h² = 5² − 1,4² = 25 − 1,96 = 23,04', 'On retranche 1,4² au carré de l’hypoténuse.'],
          ['h = √23,04 = 4,8', 'On prend la racine carrée : l’échelle touche le mur à 4,8 m.'],
        ],
        mistake:
          'prendre l’échelle pour un côté de l’angle droit. Elle est en face de l’angle droit : c’est l’hypoténuse.',
      },
    }),
    exact({
      prompt:
        'Un triangle a pour côtés 9 cm, 12 cm et 15 cm. Est-il rectangle ? Réponds par oui ou par non.',
      answers: ['oui'],
      correction: {
        steps: [
          [
            '15² = 225',
            'On calcule d’abord, à part, le carré du plus long côté : s’il y a une hypoténuse, c’est lui.',
          ],
          [
            '9² + 12² = 81 + 144 = 225',
            'On calcule ensuite la somme des carrés des deux autres côtés.',
          ],
          [
            'Oui : 15² = 9² + 12²',
            'Les deux résultats sont égaux. D’après la réciproque du théorème de Pythagore, le triangle est rectangle ; l’angle droit est en face du côté de 15 cm.',
          ],
        ],
        mistake:
          'écrire l’égalité avant de l’avoir vérifiée. On calcule les deux membres séparément, puis on compare.',
      },
    }),
    exact({
      prompt:
        'Un triangle a pour côtés 7 cm, 9 cm et 11 cm. Est-il rectangle ? Réponds par oui ou par non.',
      answers: ['non'],
      correction: {
        steps: [
          ['11² = 121', 'On calcule le carré du plus long côté.'],
          ['7² + 9² = 49 + 81 = 130', 'On calcule la somme des carrés des deux autres côtés.'],
          [
            'Non : 121 ≠ 130',
            'Les deux résultats sont différents. Si le triangle était rectangle, l’égalité de Pythagore serait vraie : il n’est donc pas rectangle.',
          ],
        ],
        mistake:
          'conclure « presque égal, donc rectangle ». L’égalité doit être exacte : 121 et 130 sont différents.',
      },
    }),
  ],
})

const thales = defineExercise({
  id: 'theoreme-de-thales',
  title: 'Théorème de Thalès : calculer une longueur',
  theme: 'geometrie',
  difficulty: 'medium',
  description:
    'Calculer une longueur dans des triangles emboîtés, puis dans un papillon : égalité des trois rapports, choix des deux rapports utiles, produit en croix. Un problème d’ombre pour finir. Réponses à saisir.',
  lesson: paragraphs(
    'Le théorème de Thalès sert à calculer une longueur quand deux droites sécantes sont coupées par deux droites **parallèles**.',
    'Deux droites se coupent en A. Sur la première sont placés les points M et B, sur la seconde les points N et C. Deux figures sont possibles :',
    [
      '- les **triangles emboîtés** : M est sur le segment [AB] et N sur le segment [AC] ;',
      '- le **papillon** : A est entre M et B, et aussi entre N et C.',
    ].join('\n'),
    '**Théorème :** si les droites (MN) et (BC) sont parallèles, alors AM/AB = AN/AC = MN/BC.',
    'En haut de chaque rapport, un côté du triangle AMN ; en bas, le côté correspondant du triangle ABC. Les longueurs AM, AB, AN et AC partent toutes du point A : le premier rapport est AM/AB, jamais AM/MB.',
    [
      '1. Écris l’égalité des trois rapports.',
      '2. Garde les deux rapports utiles : celui de la longueur cherchée, et celui dont tu connais les deux longueurs.',
      '3. Calcule avec un produit en croix : si a/b = c/d, alors a × d = b × c.',
    ].join('\n'),
  ),
  example: [
    {
      statement:
        'Dans le triangle ABC, M est un point du segment [AB] et N un point du segment [AC]. Les droites (MN) et (BC) sont parallèles. AM = 6 cm, MB = 2 cm et BC = 12 cm. Calcule MN.',
      steps: [
        [
          'AM/AB = AN/AC = MN/BC',
          'On fait un schéma à main levée : le triangle ABC, M sur [AB], N sur [AC]. Les droites (AB) et (AC) se coupent en A, et (MN) est parallèle à (BC) : on peut écrire l’égalité de Thalès.',
        ],
        [
          'AB = AM + MB = 6 + 2 = 8',
          'Le premier rapport utilise AB, que l’énoncé ne donne pas. Comme M est sur le segment [AB], on ajoute AM et MB.',
        ],
        [
          '6/8 = MN/12',
          'On cherche MN : on garde le rapport MN/BC. On connaît AM et AB : on garde le rapport AM/AB. Le rapport AN/AC ne sert pas ici. On remplace par les longueurs connues.',
        ],
        [
          'MN = 6 × 12 ÷ 8 = 9',
          'Produit en croix : 8 × MN = 6 × 12. On divise par 8 pour isoler MN.',
        ],
      ],
      conclusion:
        'MN = 9 cm. Le résultat est cohérent : [MN] est plus court que [BC], comme [AM] est plus court que [AB].',
    },
    {
      statement:
        'Les droites (EG) et (FH) se coupent en K. Les points E, K, G sont alignés dans cet ordre, ainsi que les points F, K, H. Les droites (EF) et (GH) sont parallèles. KE = 3 cm, KG = 7,5 cm et KF = 2 cm. Calcule KH.',
      steps: [
        [
          'KE/KG = KF/KH = EF/GH',
          'On fait un schéma à main levée : deux droites qui se croisent en K, avec E et G de part et d’autre de K, F et H aussi. C’est un papillon, et (EF) est parallèle à (GH). Le point K joue le rôle de A : en haut, les côtés du triangle KEF ; en bas, ceux du triangle KGH.',
        ],
        [
          '3/7,5 = 2/KH',
          'On cherche KH : on garde le rapport KF/KH, avec le rapport KE/KG dont on connaît les deux longueurs.',
        ],
        [
          'KH = 2 × 7,5 ÷ 3 = 5',
          'Produit en croix : 3 × KH = 2 × 7,5. On divise par 3 pour isoler KH.',
        ],
      ],
      conclusion: 'KH = 5 cm.',
    },
  ],
  intro: 'Pour chaque question, fais d’abord un schéma à main levée, avec les longueurs connues.',
  questions: [
    exact({
      prompt:
        'Dans le triangle ABC, M est un point du segment [AB] et N un point du segment [AC]. Les droites (MN) et (BC) sont parallèles. AM = 2 cm, AB = 6 cm et AC = 9 cm. Calcule AN, en cm.',
      answers: ['3'],
      correction: {
        steps: [
          [
            'AM/AB = AN/AC = MN/BC',
            'Les droites (AB) et (AC) se coupent en A, et (MN) est parallèle à (BC) : on écrit l’égalité de Thalès.',
          ],
          [
            '2/6 = AN/9',
            'On cherche AN : on garde le rapport AN/AC. On connaît AM et AB : on garde le rapport AM/AB. On remplace par les longueurs connues.',
          ],
          [
            'AN = 2 × 9 ÷ 6 = 3',
            'Produit en croix : 6 × AN = 2 × 9. On divise par 6 pour isoler AN, qui mesure 3 cm.',
          ],
        ],
        mistake:
          'inverser un seul des deux rapports, par exemple écrire AM/AB = AC/AN. En haut, toujours les côtés du petit triangle AMN ; en bas, ceux du grand triangle ABC.',
        check: 'AM est le tiers de AB, car 6 ÷ 3 = 2. AN est bien le tiers de AC : 9 ÷ 3 = 3.',
      },
    }),
    exact({
      prompt:
        'Dans le triangle RST, U est un point du segment [RS] et V un point du segment [RT]. Les droites (UV) et (ST) sont parallèles. RU = 4 cm, RS = 10 cm et UV = 3 cm. Calcule ST, en cm.',
      answers: ['7,5'],
      correction: {
        steps: [
          [
            'RU/RS = RV/RT = UV/ST',
            'Les droites (RS) et (RT) se coupent en R, et (UV) est parallèle à (ST). Le point R joue le rôle de A : en haut, les côtés du petit triangle RUV ; en bas, ceux du grand triangle RST.',
          ],
          [
            '4/10 = 3/ST',
            'On cherche ST : on garde le rapport UV/ST, avec le rapport RU/RS dont on connaît les deux longueurs.',
          ],
          [
            'ST = 3 × 10 ÷ 4 = 7,5',
            'Produit en croix : 4 × ST = 3 × 10. On divise par 4 pour isoler ST, qui mesure 7,5 cm.',
          ],
        ],
        mistake:
          'se tromper dans le produit en croix et calculer 3 × 4 ÷ 10 = 1,2. Le côté [ST] du grand triangle serait plus court que [UV] : c’est impossible.',
        check:
          'le grand triangle est 2,5 fois plus grand que le petit, car 10 ÷ 4 = 2,5. On retrouve ST avec 2,5 × 3 = 7,5.',
      },
    }),
    exact({
      prompt:
        'Dans le triangle ABC, M est un point du segment [AB] et N un point du segment [AC]. Les droites (MN) et (BC) sont parallèles. AM = 5 cm, MB = 3 cm et MN = 4 cm. Calcule BC, en cm.',
      answers: ['6,4'],
      correction: {
        steps: [
          [
            'AM/AB = AN/AC = MN/BC',
            'Les droites (AB) et (AC) se coupent en A, et (MN) est parallèle à (BC) : on écrit l’égalité de Thalès.',
          ],
          [
            'AB = 5 + 3 = 8',
            'L’énoncé donne MB, mais le rapport utilise AB. Comme M est sur le segment [AB], on ajoute AM et MB.',
          ],
          [
            '5/8 = 4/BC',
            'On garde les rapports AM/AB et MN/BC, puis on remplace par les longueurs connues.',
          ],
          [
            'BC = 4 × 8 ÷ 5 = 6,4',
            'Produit en croix : 5 × BC = 4 × 8. On divise par 5 pour isoler BC, qui mesure 6,4 cm.',
          ],
        ],
        mistake:
          'écrire AM/MB = MN/BC, c’est-à-dire utiliser MB au lieu de AB. On trouverait 2,4 cm : [BC] serait plus court que [MN], ce qui est impossible.',
        check:
          'AB vaut 1,6 fois AM, car 8 ÷ 5 = 1,6. De même, BC vaut 1,6 fois MN : 1,6 × 4 = 6,4.',
      },
    }),
    exact({
      prompt:
        'Les droites (MB) et (NC) se coupent en A. Les points M, A, B sont alignés dans cet ordre, ainsi que les points N, A, C. Les droites (MN) et (BC) sont parallèles. AM = 2,4 cm, AB = 6 cm et AN = 3,2 cm. Calcule AC, en cm.',
      answers: ['8'],
      correction: {
        steps: [
          [
            'AM/AB = AN/AC = MN/BC',
            'Les points M et N sont de l’autre côté de A par rapport à B et C : c’est un papillon. Comme (MN) est parallèle à (BC), l’égalité de Thalès s’écrit comme pour des triangles emboîtés.',
          ],
          [
            '2,4/6 = 3,2/AC',
            'On cherche AC : on garde le rapport AN/AC, avec le rapport AM/AB dont on connaît les deux longueurs.',
          ],
          [
            'AC = 3,2 × 6 ÷ 2,4 = 8',
            'Produit en croix : 2,4 × AC = 3,2 × 6. On divise par 2,4 pour isoler AC, qui mesure 8 cm.',
          ],
        ],
        mistake:
          'utiliser la longueur MB du segment entier, sous prétexte que A est entre M et B. Dans un papillon aussi, les rapports se calculent avec les longueurs qui partent de A : AM, AB, AN et AC.',
        check:
          'AB vaut 2,5 fois AM, car 6 ÷ 2,4 = 2,5. De même, AC vaut 2,5 fois AN : 2,5 × 3,2 = 8.',
      },
    }),
    exact({
      prompt:
        'Les droites (EK) et (FL) se coupent en G. Les points E, G, K sont alignés dans cet ordre, ainsi que les points F, G, L. Les droites (EF) et (KL) sont parallèles. GE = 3 cm, GK = 5 cm et EF = 7 cm. Calcule KL, en cm, arrondi au dixième.',
      answers: ['11,7'],
      correction: {
        steps: [
          [
            'GE/GK = GF/GL = EF/KL',
            'Les deux droites se coupent en G : ce point joue le rôle de A. C’est un papillon : en haut, les côtés du triangle GEF ; en bas, ceux du triangle GKL. Les côtés parallèles, [EF] et [KL], forment le troisième rapport.',
          ],
          [
            '3/5 = 7/KL',
            'On cherche KL : on garde le rapport EF/KL, avec le rapport GE/GK dont on connaît les deux longueurs.',
          ],
          [
            'KL = 7 × 5 ÷ 3 ≈ 11,7',
            'Produit en croix : 3 × KL = 7 × 5. La division 35 ÷ 3 ne tombe pas juste : la calculatrice affiche 11,666… Arrondie au dixième, la longueur KL est 11,7 cm.',
          ],
        ],
        mistake:
          'tronquer au lieu d’arrondir, et répondre 11,6. Le chiffre des centièmes est 6 : on arrondit au dixième supérieur.',
        check:
          'GK est un peu moins du double de GE. KL doit donc être un peu moins du double de EF : 11,7 cm est bien inférieur à 14 cm.',
      },
    }),
    exact({
      prompt:
        'Un arbre [BC] et un bâton [MN] sont plantés verticalement sur un sol horizontal : B et M sont leurs pieds, C et N leurs sommets. Le bâton mesure 1,5 m et il est planté à 10 m de l’arbre. Au soleil, leurs deux ombres se terminent au même point A du sol : les points A, M, B sont alignés dans cet ordre, ainsi que les points A, N, C. L’ombre du bâton mesure 2 m. Calcule la hauteur de l’arbre, en m.',
      answers: ['9'],
      correction: {
        steps: [
          [
            'AM/AB = AN/AC = MN/BC',
            'On fait un schéma. Le bâton [MN] et l’arbre [BC] sont verticaux, donc (MN) et (BC) sont parallèles. Les droites (AB) et (AC) se coupent en A : on écrit l’égalité de Thalès.',
          ],
          [
            'AB = 2 + 10 = 12',
            'L’ombre du bâton est [AM], qui mesure 2 m. L’ombre de l’arbre est [AB]. Les 10 m séparent le bâton de l’arbre : c’est la longueur MB. On ajoute AM et MB.',
          ],
          [
            '2/12 = 1,5/BC',
            'On cherche BC : on garde le rapport MN/BC, avec le rapport AM/AB dont on connaît maintenant les deux longueurs.',
          ],
          [
            'BC = 1,5 × 12 ÷ 2 = 9',
            'Produit en croix : 2 × BC = 1,5 × 12. On divise par 2 pour isoler BC : l’arbre mesure 9 m.',
          ],
        ],
        mistake:
          'prendre les 10 m pour l’ombre de l’arbre, et trouver 7,5 m. Les longueurs AM et AB partent toutes les deux du point A, où se terminent les ombres.',
        check:
          'l’ombre de l’arbre est 6 fois plus longue que celle du bâton, car 12 ÷ 2 = 6. L’arbre est bien 6 fois plus haut que le bâton : 6 × 1,5 = 9.',
      },
    }),
  ],
})

const reciproqueDeThales = defineExercise({
  id: 'reciproque-de-thales',
  title: 'Réciproque de Thalès : des droites parallèles ?',
  theme: 'geometrie',
  difficulty: 'hard',
  description:
    'Calculer séparément deux rapports, les comparer sans arrondir, puis conclure : droites parallèles ou non. Triangles emboîtés, papillon, rapports très proches, ordre des points. Chaque choix donne la conclusion et sa justification.',
  lesson: paragraphs(
    'La réciproque du théorème de Thalès sert à savoir si deux droites sont **parallèles**, à partir de quatre longueurs.',
    'Deux droites se coupent en A. Sur la première sont placés les points M et B, sur la seconde les points N et C. On compare les deux rapports qui partent de A : AM/AB et AN/AC.',
    [
      '- **Rapports égaux**, et points A, M, B alignés dans le même ordre que A, N, C : d’après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles.',
      '- **Rapports différents** : les droites (MN) et (BC) ne sont pas parallèles. Si elles l’étaient, le théorème de Thalès donnerait l’égalité.',
    ].join('\n'),
    '« Dans le même ordre » : M et N sont tous les deux du même côté de A que B et C (triangles emboîtés), ou tous les deux de l’autre côté (papillon). Sinon, la réciproque ne s’applique pas : les droites (MN) et (BC) ne sont alors pas parallèles, même si les rapports sont égaux.',
    [
      '1. Calcule AM/AB, puis AN/AC, séparément.',
      '2. Compare leurs valeurs exactes : nombres décimaux exacts ou fractions irréductibles, jamais des valeurs arrondies.',
      '3. Conclus.',
    ].join('\n'),
    'Attention : tant que les deux rapports ne sont pas calculés, on n’écrit pas AM/AB = AN/AC. C’est justement ce qu’on cherche à savoir.',
  ),
  example: [
    {
      statement:
        'Dans le triangle ABC, M est un point du segment [AB] et N un point du segment [AC]. AM = 3 cm, AB = 12 cm, AN = 2 cm et AC = 8 cm. Les droites (MN) et (BC) sont-elles parallèles ?',
      steps: [
        [
          'AM/AB = 3/12 = 0,25',
          'On fait un schéma à main levée. Les droites (AB) et (AC) se coupent en A : les rapports partent de A. On calcule d’abord, à part, celui de la droite (AB).',
        ],
        [
          'AN/AC = 2/8 = 0,25',
          'On calcule ensuite, à part, celui de la droite (AC). On n’écrit pas encore d’égalité entre les deux rapports.',
        ],
        [
          'AM/AB = AN/AC',
          'On compare : les deux rapports sont égaux. De plus, M est sur [AB] et N sur [AC] : les points A, M, B sont alignés dans le même ordre que les points A, N, C.',
        ],
      ],
      conclusion:
        'D’après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles.',
    },
    {
      statement:
        'Les droites (EG) et (FH) se coupent en K. Les points E, K, G sont alignés dans cet ordre, ainsi que les points F, K, H. KE = 4 cm, KG = 9 cm, KF = 3 cm et KH = 7 cm. Les droites (EF) et (GH) sont-elles parallèles ?',
      steps: [
        [
          'KE/KG = 4/9',
          'On fait un schéma à main levée : c’est un papillon, et K joue le rôle de A. On calcule à part le rapport de la droite (EG).',
        ],
        [
          'KF/KH = 3/7',
          'On calcule à part le rapport de la droite (FH). Aucune des deux divisions ne tombe juste : on garde les fractions.',
        ],
        [
          '4/9 = 28/63 et 3/7 = 27/63',
          'Pour comparer deux fractions, on les met au même dénominateur. Elles sont proches, mais différentes.',
        ],
        [
          'KE/KG ≠ KF/KH',
          'Si les droites (EF) et (GH) étaient parallèles, le théorème de Thalès donnerait KE/KG = KF/KH. Ce n’est pas le cas.',
        ],
      ],
      conclusion: 'Les droites (EF) et (GH) ne sont pas parallèles.',
    },
  ],
  intro:
    'Pour chaque question, fais d’abord un schéma à main levée : il montre dans quel ordre les points sont alignés. Chaque choix donne une conclusion et sa justification : les deux doivent être justes.',
  questions: [
    qcm({
      prompt:
        'Dans le triangle ABC, M est un point du segment [AB] et N un point du segment [AC]. AM = 2 cm, AB = 5 cm, AN = 3 cm et AC = 7,5 cm. Les droites (MN) et (BC) sont-elles parallèles ?',
      choices: [
        'Non : AM/MB ≈ 0,67 et AN/AC = 0,4',
        'Oui : AM/AB = AN/AC = 0,4',
        'Oui : AM/AB = AN/AC = 2,5',
        'Non : MB = 3 cm et NC = 4,5 cm',
      ],
      answer: 'Oui : AM/AB = AN/AC = 0,4',
      correction: {
        steps: [
          ['AM/AB = 2/5 = 0,4', 'On calcule d’abord, à part, le rapport de la droite (AB).'],
          [
            'AN/AC = 3/7,5 = 0,4',
            'On calcule ensuite, à part, le rapport de la droite (AC). On n’écrit pas d’égalité entre les deux avant de les avoir calculés.',
          ],
          [
            'Oui : AM/AB = AN/AC = 0,4',
            'Les deux rapports sont égaux, et les points A, M, B sont alignés dans le même ordre que les points A, N, C. D’après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles.',
          ],
        ],
        traps: [
          [
            'Oui : AM/AB = AN/AC = 2,5',
            'les deux divisions sont faites à l’envers : 2,5 est la valeur de AB/AM et de AC/AN. AM est plus court que AB, donc AM/AB est inférieur à 1 : il vaut 0,4. La conclusion est juste, mais l’égalité écrite est fausse.',
          ],
          [
            'Non : AM/MB ≈ 0,67 et AN/AC = 0,4',
            'le premier rapport utilise MB au lieu de AB. Les deux longueurs d’un rapport partent du point A.',
          ],
          [
            'Non : MB = 3 cm et NC = 4,5 cm',
            'on compare des rapports, pas des écarts. Deux droites parallèles ne découpent pas forcément des longueurs égales sur les deux côtés.',
          ],
        ],
        check: 'les produits en croix sont égaux : 2 × 7,5 = 15 et 5 × 3 = 15.',
      },
    }),
    qcm({
      prompt:
        'Dans le triangle RST, U est un point du segment [RS] et V un point du segment [RT]. RU = 3 cm, RS = 5 cm, RV = 6 cm et RT = 8 cm. Les droites (UV) et (ST) sont-elles parallèles ?',
      choices: [
        'Non : RU/RS = 0,6 et RV/RT ≈ 1,33',
        'On ne peut pas conclure : les rapports sont différents',
        'Oui : RS − RU = RT − RV = 2',
        'Non : RU/RS = 0,6 et RV/RT = 0,75',
      ],
      answer: 'Non : RU/RS = 0,6 et RV/RT = 0,75',
      correction: {
        steps: [
          ['RU/RS = 3/5 = 0,6', 'On calcule à part le rapport de la droite (RS).'],
          ['RV/RT = 6/8 = 0,75', 'On calcule à part le rapport de la droite (RT).'],
          [
            'Non : RU/RS = 0,6 et RV/RT = 0,75',
            'Les deux rapports sont différents. Si les droites (UV) et (ST) étaient parallèles, le théorème de Thalès donnerait RU/RS = RV/RT. Ce n’est pas le cas : elles ne sont pas parallèles.',
          ],
        ],
        traps: [
          [
            'Non : RU/RS = 0,6 et RV/RT ≈ 1,33',
            'le second rapport est inversé : 1,33 est une valeur approchée de RT/RV. La conclusion est juste, mais pas pour cette raison : RV/RT = 6 ÷ 8 = 0,75.',
          ],
          [
            'On ne peut pas conclure : les rapports sont différents',
            'on peut conclure. Des rapports différents prouvent que les droites ne sont pas parallèles.',
          ],
          [
            'Oui : RS − RU = RT − RV = 2',
            'les écarts US et VT sont égaux, mais le parallélisme dépend des rapports, pas des écarts.',
          ],
        ],
        check: 'les produits en croix sont différents : 3 × 8 = 24 et 5 × 6 = 30.',
      },
    }),
    qcm({
      prompt:
        'Les droites (MB) et (NC) se coupent en A. Les points M, A, B sont alignés dans cet ordre, ainsi que les points N, A, C. AM = 4 cm, AB = 6 cm, AN = 6 cm et AC = 9 cm. Les droites (MN) et (BC) sont-elles parallèles ?',
      choices: [
        'Oui : AM/AB = AN/AC = 2/3',
        'Non : AM/AB ≈ 0,67 et AN/AC ≈ 0,66',
        'Non : AM/AB = 2/3 et AN/AC = 3/2',
        'Oui : c’est un papillon, donc (MN) et (BC) sont parallèles',
      ],
      answer: 'Oui : AM/AB = AN/AC = 2/3',
      correction: {
        steps: [
          [
            'AM/AB = 4/6 = 2/3',
            'On calcule à part le premier rapport, et on simplifie la fraction par 2. Sa valeur décimale, 0,666…, ne tombe pas juste : on garde la fraction.',
          ],
          ['AN/AC = 6/9 = 2/3', 'On calcule à part le second rapport, et on simplifie par 3.'],
          [
            'Oui : AM/AB = AN/AC = 2/3',
            'Les deux fractions irréductibles sont égales. Les points M, A, B sont alignés dans le même ordre que les points N, A, C : sur chaque droite, A est entre les deux autres. D’après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles.',
          ],
        ],
        traps: [
          [
            'Non : AM/AB ≈ 0,67 et AN/AC ≈ 0,66',
            'les valeurs sont approchées, et arrondies de deux façons différentes. Avec les fractions, on voit que les deux rapports valent exactement 2/3.',
          ],
          [
            'Non : AM/AB = 2/3 et AN/AC = 3/2',
            'le second rapport est inversé : 3/2 est la valeur de AC/AN. Dans les deux rapports, la longueur qui part de A vers M ou vers N est en haut.',
          ],
          [
            'Oui : c’est un papillon, donc (MN) et (BC) sont parallèles',
            'un papillon ne suffit pas : selon les longueurs, les droites (MN) et (BC) peuvent être parallèles ou se couper. Il faut calculer les deux rapports et les comparer. La conclusion est juste, mais pas la justification.',
          ],
        ],
        check: 'les produits en croix sont égaux : 4 × 9 = 36 et 6 × 6 = 36.',
      },
    }),
    qcm({
      prompt:
        'Dans le triangle EFG, K est un point du segment [EF] et L un point du segment [EG]. EK = 4 cm, KF = 6 cm, EL = 6 cm et EG = 15 cm. Les droites (KL) et (FG) sont-elles parallèles ?',
      choices: [
        'Non : EK/KF ≈ 0,67 et EL/EG = 0,4',
        'Oui : d’après le théorème de Thalès, EK/EF = EL/EG',
        'Oui : EK/EF = EL/EG = 0,4',
        'Non : EK/EG ≈ 0,27 et EL/EF = 0,6',
      ],
      answer: 'Oui : EK/EF = EL/EG = 0,4',
      correction: {
        steps: [
          [
            'EF = 4 + 6 = 10',
            'Le rapport de la droite (EF) utilise la longueur EF, que l’énoncé ne donne pas. Comme K est sur le segment [EF], on ajoute EK et KF.',
          ],
          ['EK/EF = 4/10 = 0,4', 'On calcule à part le rapport de la droite (EF).'],
          ['EL/EG = 6/15 = 0,4', 'On calcule à part le rapport de la droite (EG).'],
          [
            'Oui : EK/EF = EL/EG = 0,4',
            'Les deux rapports sont égaux, et les points E, K, F sont alignés dans le même ordre que les points E, L, G. D’après la réciproque du théorème de Thalès, les droites (KL) et (FG) sont parallèles.',
          ],
        ],
        traps: [
          [
            'Non : EK/KF ≈ 0,67 et EL/EG = 0,4',
            'le premier rapport utilise KF au lieu de EF. Les deux longueurs d’un rapport partent du point E.',
          ],
          [
            'Oui : d’après le théorème de Thalès, EK/EF = EL/EG',
            'le théorème de Thalès suppose que les droites sont parallèles : il ne peut pas servir à le prouver. On calcule les deux rapports, puis on conclut avec la réciproque. La conclusion est juste, mais pas la justification.',
          ],
          [
            'Non : EK/EG ≈ 0,27 et EL/EF = 0,6',
            'les longueurs sont mal associées. Chaque rapport se calcule sur une seule droite : EK avec EF, EL avec EG.',
          ],
        ],
        check: 'les produits en croix sont égaux : 4 × 15 = 60 et 10 × 6 = 60.',
      },
    }),
    qcm({
      prompt:
        'Un escabeau, vu de profil, forme un triangle ABC : A est son sommet, B et C sont ses pieds, posés sur un sol horizontal. Une tablette [MN] relie le point M du côté [AB] au point N du côté [AC]. AM = 60 cm, AB = 90 cm, AN = 67 cm et AC = 100 cm. La tablette est-elle parallèle au sol ?',
      choices: [
        'Oui : AM/AB = AN/AC = 0,67',
        'Non : AM/AB = 2/3 et AN/AC = 67/100',
        'Non : AM/AB = 1,5 et AN/AC = 0,67',
        'On ne peut pas conclure : les rapports sont trop proches',
      ],
      answer: 'Non : AM/AB = 2/3 et AN/AC = 67/100',
      correction: {
        steps: [
          [
            'AM/AB = 60/90 = 2/3',
            'Le sol est la droite (BC) : on se demande si (MN) et (BC) sont parallèles. On calcule à part le premier rapport, et on simplifie par 30. On garde la fraction : 0,666… ne tombe pas juste.',
          ],
          ['AN/AC = 67/100 = 0,67', 'On calcule à part le second rapport.'],
          [
            '2/3 = 200/300 et 67/100 = 201/300',
            'Pour comparer exactement, on met les deux fractions au même dénominateur. Elles sont très proches, mais différentes : 0,67 n’est qu’une valeur approchée de 2/3.',
          ],
          [
            'Non : AM/AB = 2/3 et AN/AC = 67/100',
            'Les deux rapports sont différents. Si la tablette était parallèle au sol, le théorème de Thalès donnerait l’égalité : elle n’est donc pas parallèle au sol.',
          ],
        ],
        traps: [
          [
            'Oui : AM/AB = AN/AC = 0,67',
            '0,67 n’est qu’une valeur arrondie de 2/3, qui vaut 0,666… On ne compare jamais des valeurs arrondies.',
          ],
          [
            'Non : AM/AB = 1,5 et AN/AC = 0,67',
            'le premier rapport est inversé : 1,5 est la valeur de AB/AM. La conclusion est juste, mais pas pour cette raison : les deux rapports, 2/3 et 67/100, sont très proches, mais différents.',
          ],
          [
            'On ne peut pas conclure : les rapports sont trop proches',
            'proches ou non, deux rapports sont soit égaux, soit différents. Ici ils sont différents : on peut conclure.',
          ],
        ],
        check: 'les produits en croix sont différents : 60 × 100 = 6 000 et 90 × 67 = 6 030.',
      },
    }),
    qcm({
      prompt:
        'Deux droites se coupent en A. Sur la première, M est un point du segment [AB]. Sur la seconde, les points N, A, C sont alignés dans cet ordre : A est entre N et C. AM = 3 cm, AB = 4 cm, AN = 4,5 cm et AC = 6 cm. Les droites (MN) et (BC) sont-elles parallèles ?',
      choices: [
        'Oui : AM/AB = AN/AC = 0,75',
        'Non : AM/AB = 0,75 et AN/AC ≈ 1,33',
        'Oui : c’est une configuration papillon',
        'Non : rapports égaux, mais points alignés dans un ordre différent',
      ],
      answer: 'Non : rapports égaux, mais points alignés dans un ordre différent',
      correction: {
        steps: [
          ['AM/AB = 3/4 = 0,75', 'On calcule à part le rapport de la première droite.'],
          [
            'AN/AC = 4,5/6 = 0,75',
            'On calcule à part le rapport de la seconde droite. Les deux rapports sont égaux, mais cela ne suffit pas : il reste à vérifier l’ordre des points.',
          ],
          [
            'Non : rapports égaux, mais points alignés dans un ordre différent',
            'M est entre A et B, mais N n’est pas entre A et C : il est de l’autre côté de A. L’ordre n’est pas le même sur les deux droites, donc la réciproque ne s’applique pas. En fait, la parallèle à (BC) passant par M coupe la droite (AC) en un point N′ du segment [AC], avec AN′ = 4,5 cm d’après le théorème de Thalès. N′ et N sont à la même distance de A, mais de part et d’autre de A : cette parallèle ne passe pas par N. Les droites (MN) et (BC) ne sont donc pas parallèles.',
          ],
        ],
        traps: [
          [
            'Oui : AM/AB = AN/AC = 0,75',
            'les rapports sont bien égaux, mais la réciproque demande aussi que les points soient alignés dans le même ordre. Cette condition manque ici.',
          ],
          [
            'Non : AM/AB = 0,75 et AN/AC ≈ 1,33',
            'le second rapport est inversé : 1,33 est une valeur approchée de AC/AN. Les deux rapports valent 0,75 : la conclusion est juste, mais pas pour cette raison.',
          ],
          [
            'Oui : c’est une configuration papillon',
            'dans un papillon, M et N sont tous les deux de l’autre côté de A. Ici, seul N l’est.',
          ],
        ],
        check: 'sur un schéma soigné, on voit les droites (MN) et (BC) se couper.',
      },
    }),
  ],
})

/**
 * Trigonométrie : le vocabulaire et les trois formules, rappelés dans les deux
 * exercices. Sans chapeau sur les lettres, l'angle de sommet B s'écrit « l'angle ABC ».
 */
const TRIANGLE_SIDES = [
  'Dans un triangle rectangle, on choisit l’un des deux angles aigus. Par rapport à cet angle, chaque côté a un nom :',
  [
    '- l’**hypoténuse** est en face de l’angle droit : c’est le plus long côté ;',
    '- le **côté opposé** est en face de l’angle choisi ;',
    '- le **côté adjacent** est le côté de l’angle choisi qui n’est pas l’hypoténuse.',
  ].join('\n'),
] as const

const TRIGONOMETRY = [
  '- cosinus = côté adjacent ÷ hypoténuse ;',
  '- sinus = côté opposé ÷ hypoténuse ;',
  '- tangente = côté opposé ÷ côté adjacent.',
].join('\n')

const MNEMONIC =
  'Pour les retenir : **CAH SOH TOA**, les initiales de Cosinus Adjacent Hypoténuse, Sinus Opposé Hypoténuse, Tangente Opposé Adjacent.'

const trigonometrieLongueur = defineExercise({
  id: 'trigonometrie-calculer-une-longueur',
  title: 'Trigonométrie : calculer une longueur',
  theme: 'geometrie',
  difficulty: 'medium',
  description:
    'Calculer un côté d’un triangle rectangle avec le cosinus, le sinus ou la tangente : choisir la formule, puis multiplier ou diviser. Résultats arrondis au dixième, et un problème de rampe pour finir. Réponses à saisir.',
  lesson: paragraphs(
    ...TRIANGLE_SIDES,
    'Trois formules relient l’angle à ces côtés :',
    TRIGONOMETRY,
    MNEMONIC,
    [
      '1. Repère l’angle connu, puis nomme les deux côtés en jeu : celui que tu connais et celui que tu cherches.',
      '2. Choisis la formule qui contient ces deux côtés.',
      '3. Isole la longueur cherchée. Si elle est au numérateur, multiplie la longueur connue par le cosinus, le sinus ou la tangente. Si elle est au dénominateur, divise la longueur connue par ce nombre.',
      '4. Calcule, la calculatrice réglée en **mode degré**.',
    ].join('\n'),
    'L’angle ABC est l’angle de sommet B, la lettre du milieu. On note cos(ABC) son cosinus.',
  ),
  example: [
    {
      statement:
        'Le triangle ABC est rectangle en A. BC = 9 cm et l’angle ABC mesure 40°. Calcule AB, en cm, arrondi au dixième.',
      steps: [
        [
          'cos(ABC) = AB/BC',
          'On fait un schéma à main levée, avec l’angle droit en A et l’angle de 40° en B. [BC], en face de l’angle droit, est l’hypoténuse : on la connaît. [AB] est le côté adjacent à l’angle ABC : on le cherche. Adjacent et hypoténuse : on choisit le cosinus.',
        ],
        ['cos(40°) = AB/9', 'On remplace l’angle et l’hypoténuse par leurs valeurs.'],
        [
          'AB = 9 × cos(40°) ≈ 6,9',
          'AB est divisé par 9 : pour l’isoler, on multiplie les deux membres par 9. La calculatrice, en mode degré, affiche 6,894… On arrondit au dixième.',
        ],
      ],
      conclusion: 'AB ≈ 6,9 cm. Ce côté est bien plus court que l’hypoténuse, qui mesure 9 cm.',
    },
    {
      statement:
        'Le triangle DEF est rectangle en D. DE = 6 cm et l’angle DFE mesure 47°. Calcule EF, en cm, arrondi au dixième.',
      steps: [
        [
          'sin(DFE) = DE/EF',
          'On fait un schéma à main levée, avec l’angle droit en D et l’angle de 47° en F. [DE] est en face de l’angle DFE : c’est le côté opposé, qu’on connaît. [EF], en face de l’angle droit, est l’hypoténuse, qu’on cherche. Opposé et hypoténuse : on choisit le sinus.',
        ],
        [
          'sin(47°) = 6/EF',
          'On remplace l’angle et le côté opposé par leurs valeurs. Cette fois, la longueur cherchée est au dénominateur.',
        ],
        [
          'EF = 6 ÷ sin(47°) ≈ 8,2',
          'Produit en croix : EF × sin(47°) = 6. Pour isoler EF, on divise donc 6 par sin(47°). La calculatrice affiche 8,203… On arrondit au dixième.',
        ],
      ],
      conclusion:
        'EF ≈ 8,2 cm. L’hypoténuse est bien plus longue que le côté [DE], qui mesure 6 cm.',
    },
  ],
  intro:
    'Prends ta calculatrice et vérifie qu’elle est en mode degré. Pour chaque question, fais d’abord un schéma à main levée.',
  questions: [
    exact({
      prompt:
        'Le triangle RST est rectangle en R. ST = 10 cm et l’angle RST mesure 38°. Calcule RS, en cm, arrondi au dixième.',
      answers: ['7,9'],
      correction: {
        steps: [
          [
            'cos(RST) = RS/ST',
            'L’angle RST a pour sommet S. [ST], en face de l’angle droit, est l’hypoténuse. [RS] est le côté adjacent à l’angle RST. Adjacent et hypoténuse : on choisit le cosinus.',
          ],
          ['cos(38°) = RS/10', 'On remplace l’angle et l’hypoténuse par leurs valeurs.'],
          [
            'RS = 10 × cos(38°) ≈ 7,9',
            'On multiplie les deux membres par 10 pour isoler RS. La calculatrice, en mode degré, affiche 7,880… Arrondie au dixième, la longueur RS est 7,9 cm.',
          ],
        ],
        mistake:
          'choisir le sinus. Il utilise le côté opposé, [RT], qui est en face de l’angle. On trouverait 6,2 cm : c’est la longueur RT, pas la longueur RS.',
        check:
          'un côté de l’angle droit est toujours plus court que l’hypoténuse : 7,9 cm est bien inférieur à 10 cm.',
      },
    }),
    exact({
      prompt:
        'Le triangle EFG est rectangle en E. FG = 7 cm et l’angle EFG mesure 53°. Calcule EG, en cm, arrondi au dixième.',
      answers: ['5,6'],
      correction: {
        steps: [
          [
            'sin(EFG) = EG/FG',
            'L’angle EFG a pour sommet F. [FG], en face de l’angle droit, est l’hypoténuse. [EG] est en face de l’angle EFG : c’est le côté opposé. Opposé et hypoténuse : on choisit le sinus.',
          ],
          ['sin(53°) = EG/7', 'On remplace l’angle et l’hypoténuse par leurs valeurs.'],
          [
            'EG = 7 × sin(53°) ≈ 5,6',
            'On multiplie les deux membres par 7 pour isoler EG. La calculatrice affiche 5,590… Arrondie au dixième, la longueur EG est 5,6 cm.',
          ],
        ],
        mistake:
          'laisser la calculatrice en mode radian. Elle afficherait 2,77 environ : un résultat faux. On vérifie le mode degré avant chaque calcul.',
        check:
          'un côté de l’angle droit est toujours plus court que l’hypoténuse : 5,6 cm est bien inférieur à 7 cm.',
      },
    }),
    exact({
      prompt:
        'Le triangle IJK est rectangle en I. IJ = 6 cm et l’angle IJK mesure 35°. Calcule IK, en cm, arrondi au dixième.',
      answers: ['4,2'],
      correction: {
        steps: [
          [
            'tan(IJK) = IK/IJ',
            'L’angle IJK a pour sommet J. [IJ] est le côté adjacent à cet angle : on le connaît. [IK] est en face : c’est le côté opposé, qu’on cherche. L’hypoténuse [JK] n’intervient pas. Opposé et adjacent : on choisit la tangente.',
          ],
          ['tan(35°) = IK/6', 'On remplace l’angle et le côté adjacent par leurs valeurs.'],
          [
            'IK = 6 × tan(35°) ≈ 4,2',
            'On multiplie les deux membres par 6 pour isoler IK. La calculatrice affiche 4,201… Arrondie au dixième, la longueur IK est 4,2 cm.',
          ],
        ],
        mistake:
          'utiliser le cosinus ou le sinus. Ces deux formules contiennent l’hypoténuse, qui n’est ni connue ni cherchée ici. Avec les deux côtés de l’angle droit, on utilise la tangente.',
        check:
          'l’angle IJK est inférieur à 45° : le côté opposé doit être plus court que le côté adjacent. 4,2 cm est bien inférieur à 6 cm.',
      },
    }),
    exact({
      prompt:
        'Le triangle LMN est rectangle en L. LM = 5 cm et l’angle LMN mesure 46°. Calcule MN, en cm, arrondi au dixième.',
      answers: ['7,2'],
      correction: {
        steps: [
          [
            'cos(LMN) = LM/MN',
            'L’angle LMN a pour sommet M. [LM] est le côté adjacent à cet angle : on le connaît. [MN], en face de l’angle droit, est l’hypoténuse, qu’on cherche. Adjacent et hypoténuse : on choisit le cosinus.',
          ],
          [
            'cos(46°) = 5/MN',
            'On remplace l’angle et le côté adjacent par leurs valeurs. La longueur cherchée est au dénominateur.',
          ],
          [
            'MN = 5 ÷ cos(46°) ≈ 7,2',
            'Produit en croix : MN × cos(46°) = 5. Pour isoler MN, on divise donc 5 par cos(46°). La calculatrice affiche 7,197… Arrondie au dixième, la longueur MN est 7,2 cm.',
          ],
        ],
        mistake:
          'multiplier au lieu de diviser : 5 × cos(46°) ≈ 3,5. L’hypoténuse serait plus courte que le côté [LM], ce qui est impossible.',
        check: 'l’hypoténuse est le plus long côté : 7,2 cm dépasse bien 5 cm.',
      },
    }),
    exact({
      prompt:
        'Le triangle PQR est rectangle en Q. QR = 8 cm et l’angle QPR mesure 50°. Calcule PQ, en cm, arrondi au dixième.',
      answers: ['6,7'],
      correction: {
        steps: [
          [
            'tan(QPR) = QR/PQ',
            'L’angle QPR a pour sommet P, et l’angle droit est en Q. [QR] est en face de l’angle QPR : c’est le côté opposé, qu’on connaît. [PQ] est le côté adjacent, qu’on cherche. Opposé et adjacent : on choisit la tangente.',
          ],
          [
            'tan(50°) = 8/PQ',
            'On remplace l’angle et le côté opposé par leurs valeurs. La longueur cherchée est au dénominateur.',
          ],
          [
            'PQ = 8 ÷ tan(50°) ≈ 6,7',
            'Produit en croix : PQ × tan(50°) = 8. Pour isoler PQ, on divise donc 8 par tan(50°). La calculatrice affiche 6,712… Arrondie au dixième, la longueur PQ est 6,7 cm.',
          ],
        ],
        mistake:
          'multiplier au lieu de diviser : 8 × tan(50°) ≈ 9,5. On isole toujours la longueur cherchée avant de prendre la calculatrice.',
        check:
          'l’angle QPR dépasse 45° : le côté adjacent doit être plus court que le côté opposé. 6,7 cm est bien inférieur à 8 cm.',
      },
    }),
    exact({
      prompt:
        'Une rampe de chargement [AB] relie le sol, horizontal, au plateau d’un camion : A est au sol, B au bord du plateau. Le point H du sol est à la verticale de B : le triangle ABH est rectangle en H, et BH = 1,2 m. La rampe fait avec le sol un angle BAH de 20°. Calcule la longueur AB de la rampe, en m, arrondie au dixième.',
      answers: ['3,5'],
      correction: {
        steps: [
          [
            'sin(BAH) = BH/AB',
            'On fait un schéma : le triangle ABH, rectangle en H, avec l’angle de 20° en A. La hauteur [BH] est en face de cet angle : c’est le côté opposé, qu’on connaît. La rampe [AB], en face de l’angle droit, est l’hypoténuse, qu’on cherche. Opposé et hypoténuse : on choisit le sinus.',
          ],
          [
            'sin(20°) = 1,2/AB',
            'On remplace l’angle et la hauteur par leurs valeurs. La longueur cherchée est au dénominateur.',
          ],
          [
            'AB = 1,2 ÷ sin(20°) ≈ 3,5',
            'Produit en croix : AB × sin(20°) = 1,2. Pour isoler AB, on divise donc 1,2 par sin(20°). La calculatrice affiche 3,508… Arrondie au dixième, la longueur de la rampe est 3,5 m.',
          ],
        ],
        mistake:
          'multiplier au lieu de diviser : 1,2 × sin(20°) ≈ 0,4. La rampe mesurerait 0,4 m : elle serait plus courte que la hauteur à franchir.',
        check: 'la rampe est l’hypoténuse du triangle : 3,5 m dépasse bien 1,2 m.',
      },
    }),
  ],
})

const trigonometrieAngle = defineExercise({
  id: 'trigonometrie-calculer-un-angle',
  title: 'Trigonométrie : calculer un angle',
  theme: 'geometrie',
  difficulty: 'medium',
  description:
    'Calculer un angle d’un triangle rectangle à partir de deux côtés : choisir le cosinus, le sinus ou la tangente, puis utiliser arccos, arcsin ou arctan. Résultats arrondis au degré, et un problème de toit pour finir. Réponses à saisir.',
  lesson: paragraphs(
    ...TRIANGLE_SIDES,
    'Trois formules relient l’angle à ces côtés :',
    TRIGONOMETRY,
    MNEMONIC,
    'Quand on connaît deux côtés, on peut donc calculer le cosinus, le sinus ou la tangente d’un angle. Pour retrouver l’angle lui-même, on utilise les touches **arccos**, **arcsin** et **arctan** de la calculatrice, souvent notées cos⁻¹, sin⁻¹ et tan⁻¹.',
    [
      '1. Repère l’angle cherché, puis nomme les deux côtés connus.',
      '2. Choisis la formule qui contient ces deux côtés.',
      '3. Écris le quotient des deux longueurs.',
      '4. Applique arccos, arcsin ou arctan à ce quotient, la calculatrice réglée en **mode degré**.',
    ].join('\n'),
    'L’angle ABC est l’angle de sommet B, la lettre du milieu, et cos(ABC) est son cosinus. Par exemple, si cos(ABC) = 0,5, alors l’angle ABC mesure arccos(0,5) = 60°.',
  ),
  example: [
    {
      statement:
        'Le triangle ABC est rectangle en A. AB = 3 cm et BC = 5 cm. Calcule la mesure de l’angle ABC, en degrés, arrondie à l’unité.',
      steps: [
        [
          'cos(ABC) = AB/BC',
          'On fait un schéma à main levée et on y repère l’angle cherché, en B. [BC], en face de l’angle droit, est l’hypoténuse. [AB] est le côté adjacent à l’angle ABC. On connaît l’adjacent et l’hypoténuse : on choisit le cosinus.',
        ],
        ['cos(ABC) = 3/5 = 0,6', 'On remplace par les longueurs, puis on calcule le quotient.'],
        [
          'arccos(0,6) ≈ 53°',
          'On cherche l’angle dont le cosinus vaut 0,6 : c’est le rôle de la touche arccos. La calculatrice, en mode degré, affiche 53,13… On arrondit à l’unité.',
        ],
      ],
      conclusion: 'L’angle ABC mesure environ 53°.',
    },
    {
      statement:
        'Le triangle DEF est rectangle en D. DE = 9 cm et DF = 5 cm. Calcule la mesure de l’angle DEF, en degrés, arrondie à l’unité.',
      steps: [
        [
          'tan(DEF) = DF/DE',
          'On fait un schéma à main levée : l’angle droit est en D, l’angle cherché en E. [DF] est en face de l’angle DEF : c’est le côté opposé. [DE] est le côté adjacent. L’hypoténuse [EF] n’est pas connue. Opposé et adjacent : on choisit la tangente.',
        ],
        [
          'tan(DEF) = 5/9',
          'On remplace par les longueurs. La division 5 ÷ 9 ne tombe pas juste : on garde la fraction, sans l’arrondir.',
        ],
        [
          'arctan(5/9) ≈ 29°',
          'On tape arctan(5 ÷ 9) à la calculatrice, avec les parenthèses. Elle affiche 29,05… On arrondit à l’unité.',
        ],
      ],
      conclusion: 'L’angle DEF mesure environ 29°.',
    },
  ],
  intro:
    'Prends ta calculatrice et vérifie qu’elle est en mode degré. Pour chaque question, fais d’abord un schéma à main levée.',
  questions: [
    exact({
      prompt:
        'Le triangle RST est rectangle en R. RS = 9 cm et ST = 10 cm. Calcule la mesure de l’angle RST, en degrés, arrondie à l’unité.',
      answers: ['26'],
      correction: {
        steps: [
          [
            'cos(RST) = RS/ST',
            'L’angle RST a pour sommet S. [ST], en face de l’angle droit, est l’hypoténuse. [RS] est le côté adjacent à l’angle RST. Adjacent et hypoténuse : on choisit le cosinus.',
          ],
          ['cos(RST) = 9/10 = 0,9', 'On remplace par les longueurs, puis on calcule le quotient.'],
          [
            'arccos(0,9) ≈ 26°',
            'La touche arccos donne l’angle dont le cosinus vaut 0,9. La calculatrice, en mode degré, affiche 25,84… Arrondie à l’unité, la mesure de l’angle RST est 26°.',
          ],
        ],
        mistake:
          'taper cos(0,9) au lieu de arccos(0,9). La touche cos part d’un angle et donne un quotient ; la touche arccos part du quotient et donne l’angle.',
        check: 'cos(26°) ≈ 0,90 : on retrouve bien le quotient 9/10.',
      },
    }),
    exact({
      prompt:
        'Le triangle EFG est rectangle en E. EG = 3 cm et FG = 8 cm. Calcule la mesure de l’angle EFG, en degrés, arrondie à l’unité.',
      answers: ['22'],
      correction: {
        steps: [
          [
            'sin(EFG) = EG/FG',
            'L’angle EFG a pour sommet F. [FG], en face de l’angle droit, est l’hypoténuse. [EG] est en face de l’angle EFG : c’est le côté opposé. Opposé et hypoténuse : on choisit le sinus.',
          ],
          ['sin(EFG) = 3/8 = 0,375', 'On remplace par les longueurs, puis on calcule le quotient.'],
          [
            'arcsin(0,375) ≈ 22°',
            'La touche arcsin donne l’angle dont le sinus vaut 0,375. La calculatrice affiche 22,02… Arrondie à l’unité, la mesure de l’angle EFG est 22°.',
          ],
        ],
        mistake:
          'choisir le cosinus. On trouverait arccos(0,375) ≈ 68° : c’est la mesure de l’autre angle aigu, EGF, pour lequel [EG] est le côté adjacent.',
        check: 'sin(22°) ≈ 0,375 : on retrouve bien le quotient 3/8.',
      },
    }),
    exact({
      prompt:
        'Le triangle IJK est rectangle en I. IJ = 5 cm et IK = 8 cm. Calcule la mesure de l’angle IJK, en degrés, arrondie à l’unité.',
      answers: ['58'],
      correction: {
        steps: [
          [
            'tan(IJK) = IK/IJ',
            'L’angle IJK a pour sommet J. On connaît les deux côtés de l’angle droit : [IK], en face de l’angle IJK, est le côté opposé ; [IJ] est le côté adjacent. Opposé et adjacent : on choisit la tangente.',
          ],
          [
            'tan(IJK) = 8/5 = 1,6',
            'On remplace par les longueurs, puis on calcule le quotient. Une tangente peut dépasser 1, contrairement à un cosinus ou à un sinus.',
          ],
          [
            'arctan(1,6) ≈ 58°',
            'La touche arctan donne l’angle dont la tangente vaut 1,6. La calculatrice affiche 57,99… Arrondie à l’unité, la mesure de l’angle IJK est 58°.',
          ],
        ],
        mistake:
          'inverser le quotient et calculer arctan(5/8) ≈ 32°. C’est la mesure de l’autre angle aigu, IKJ. Le côté opposé à l’angle cherché va en haut.',
        check:
          'le côté opposé est plus long que le côté adjacent : l’angle doit dépasser 45°. C’est bien le cas de 58°.',
      },
    }),
    exact({
      prompt:
        'Le triangle LMN est rectangle en M. LN = 7 cm et MN = 4 cm. Calcule la mesure de l’angle MLN, en degrés, arrondie à l’unité.',
      answers: ['35'],
      correction: {
        steps: [
          [
            'sin(MLN) = MN/LN',
            'L’angle droit est en M : l’hypoténuse est [LN]. L’angle MLN a pour sommet L ; ses côtés sont [LM] et [LN]. Le côté [MN] ne passe pas par L : il est en face de l’angle, c’est le côté opposé. Opposé et hypoténuse : on choisit le sinus.',
          ],
          [
            'sin(MLN) = 4/7',
            'On remplace par les longueurs. La division 4 ÷ 7 ne tombe pas juste : on garde la fraction, sans l’arrondir.',
          ],
          [
            'arcsin(4/7) ≈ 35°',
            'On tape arcsin(4 ÷ 7) à la calculatrice, avec les parenthèses. Elle affiche 34,849… Arrondie à l’unité, la mesure de l’angle MLN est 35°.',
          ],
        ],
        mistake:
          'croire que [MN] est le côté adjacent parce que les lettres M et N figurent dans le nom de l’angle MLN. Le côté adjacent part du sommet L : c’est [LM].',
        check: 'sin(35°) ≈ 0,57 et 4 ÷ 7 ≈ 0,57.',
      },
    }),
    exact({
      prompt:
        'ABCD est un rectangle : AB = 9 cm et BC = 4 cm. Calcule la mesure de l’angle BAC, entre le côté [AB] et la diagonale [AC], en degrés, arrondie à l’unité.',
      answers: ['24'],
      correction: {
        steps: [
          [
            'Triangle ABC rectangle en B',
            'On fait un schéma. Les angles d’un rectangle sont droits : la diagonale [AC] forme, avec les côtés [AB] et [BC], un triangle rectangle en B. On peut donc utiliser la trigonométrie.',
          ],
          [
            'tan(BAC) = BC/AB = 4/9',
            'L’angle BAC a pour sommet A. [BC] est en face de lui : c’est le côté opposé. [AB] est le côté adjacent. Opposé et adjacent : on choisit la tangente. On garde la fraction, car 4 ÷ 9 ne tombe pas juste.',
          ],
          [
            'arctan(4/9) ≈ 24°',
            'On tape arctan(4 ÷ 9) à la calculatrice, avec les parenthèses. Elle affiche 23,96… Arrondie à l’unité, la mesure de l’angle BAC est 24°.',
          ],
        ],
        mistake:
          'passer par la diagonale : AC = √97 ≈ 9,8, puis arccos(9/9,8) ≈ 23°. C’est plus long, et l’arrondi de AC fausse le résultat. La tangente n’utilise que les deux côtés donnés par l’énoncé : rien n’est arrondi avant la fin.',
        check:
          'le côté opposé est plus court que le côté adjacent : l’angle doit être inférieur à 45°. C’est bien le cas de 24°.',
      },
    }),
    exact({
      prompt:
        'Un garage est vu de profil : son toit est le segment [AC]. Le triangle ABC est rectangle en B. Le côté [AB] est horizontal et mesure 4 m ; le côté [BC] est vertical et mesure 2,6 m. Calcule la mesure de l’angle BAC, que fait le toit avec l’horizontale, en degrés, arrondie à l’unité.',
      answers: ['33'],
      correction: {
        steps: [
          [
            'tan(BAC) = BC/AB',
            'L’angle cherché, BAC, a pour sommet A. Le côté vertical [BC] est en face de lui : c’est le côté opposé. Le côté horizontal [AB] est le côté adjacent. Le toit [AC] est l’hypoténuse, qu’on ne connaît pas. Opposé et adjacent : on choisit la tangente.',
          ],
          [
            'tan(BAC) = 2,6/4 = 0,65',
            'On remplace par les longueurs, puis on calcule le quotient.',
          ],
          [
            'arctan(0,65) ≈ 33°',
            'La touche arctan donne l’angle dont la tangente vaut 0,65. La calculatrice affiche 33,02… Arrondie à l’unité, la mesure de l’angle BAC est 33° : c’est l’angle que fait le toit avec l’horizontale.',
          ],
        ],
        mistake:
          'prendre le côté horizontal [AB] pour l’hypoténuse et utiliser le sinus. L’hypoténuse est en face de l’angle droit : c’est le toit [AC].',
        check: 'tan(33°) ≈ 0,65 : on retrouve bien le quotient 2,6 ÷ 4.',
      },
    }),
  ],
})

const agrandissementsEtTransformations = defineExercise({
  id: 'agrandissement-reduction-transformations',
  title: 'Agrandissements, réductions et transformations',
  theme: 'geometrie',
  difficulty: 'medium',
  description:
    'Effet d’un agrandissement ou d’une réduction de rapport k sur les longueurs, les aires, les volumes et les angles, triangles semblables, puis transformations du plan : les reconnaître et savoir ce qu’elles conservent. QCM.',
  lesson: paragraphs(
    '**Agrandir ou réduire** une figure, c’est multiplier toutes ses longueurs par un même nombre k, le **rapport** : k > 1 pour un agrandissement, 0 < k < 1 pour une réduction. Alors :',
    [
      '- les longueurs sont multipliées par k ;',
      '- les aires sont multipliées par k² ;',
      '- les volumes sont multipliés par k³ ;',
      '- les angles sont conservés.',
    ].join('\n'),
    'Deux **triangles semblables** ont leurs angles égaux deux à deux. Leurs côtés sont alors proportionnels : l’un est un agrandissement ou une réduction de l’autre.',
    'Une **transformation** associe à chaque point M une image M′ :',
    [
      '- **symétrie axiale** d’axe (d) : (d) est la médiatrice de [MM′] ;',
      '- **symétrie centrale** de centre O : O est le milieu de [MM′] ;',
      '- **translation** : tous les points glissent dans la même direction, dans le même sens et de la même longueur ;',
      '- **rotation** : tous les points tournent autour d’un centre, du même angle et dans le même sens ;',
      '- **homothétie** de centre O et de rapport k positif : M′ est sur la demi-droite [OM) et OM′ = k × OM.',
    ].join('\n'),
    'Les quatre premières conservent les longueurs, les angles et les aires. L’homothétie est un agrandissement (k > 1) ou une réduction (0 < k < 1) : elle conserve les angles, mais multiplie les longueurs par k et les aires par k².',
  ),
  example: [
    {
      statement:
        'Un rectangle mesure 5 cm sur 2 cm. On l’agrandit avec le rapport 3. Calcule le périmètre et l’aire du rectangle agrandi.',
      steps: [
        [
          '5 × 3 = 15 et 2 × 3 = 6',
          'On fait un schéma à main levée des deux rectangles. Dans un agrandissement de rapport 3, chaque longueur est multipliée par 3 : le rectangle agrandi mesure 15 cm sur 6 cm.',
        ],
        [
          '2 × (15 + 6) = 42',
          'On calcule son périmètre : 42 cm. Celui du rectangle de départ vaut 2 × (5 + 2) = 14 cm. Le périmètre est une longueur : il est bien multiplié par 3.',
        ],
        [
          '15 × 6 = 90',
          'On calcule son aire : 90 cm². Celle du rectangle de départ vaut 5 × 2 = 10 cm². L’aire est multipliée par 9, c’est-à-dire par 3², et non par 3 : la longueur et la largeur ont triplé toutes les deux.',
        ],
      ],
      conclusion:
        'Le périmètre est 42 cm et l’aire 90 cm². On pouvait aller plus vite : 14 × 3 = 42 pour le périmètre et 10 × 3² = 90 pour l’aire.',
    },
    {
      statement:
        'Une figure F a pour image la figure F′ par une transformation. Chaque point M de F a pour image le point M′ tel que O est le milieu du segment [MM′]. Quelle est cette transformation ? Que conserve-t-elle ?',
      steps: [
        [
          'O est le milieu de [MM′]',
          'On fait un schéma à main levée avec le point O, un point M et son image M′. L’image est de l’autre côté de O, à la même distance : M a fait un demi-tour autour de O.',
        ],
        [
          'Symétrie centrale de centre O',
          'On reconnaît la définition de la symétrie centrale. Ce n’est pas une symétrie axiale : il n’y a pas d’axe, mais un centre.',
        ],
      ],
      conclusion:
        'C’est la symétrie centrale de centre O. Elle conserve les longueurs, les angles et les aires : la figure F′ est superposable à la figure F.',
    },
  ],
  intro:
    'Pour les questions sur les transformations, fais un schéma à main levée : il aide à voir la situation.',
  questions: [
    qcm({
      prompt:
        'Les triangles ABC et DEF sont semblables : DEF est un agrandissement de ABC, dans lequel [DE] correspond à [AB] et [EF] à [BC]. AB = 4 cm, DE = 10 cm et BC = 6 cm. Combien mesure [EF] ?',
      choices: ['12 cm', '2,4 cm', '15 cm', '60 cm'],
      answer: '15 cm',
      correction: {
        steps: [
          [
            'k = 10 ÷ 4 = 2,5',
            'Le rapport d’agrandissement est le quotient d’une longueur agrandie par la longueur de départ qui lui correspond : on divise DE par AB.',
          ],
          [
            'EF = 6 × 2,5 = 15',
            'Toutes les longueurs sont multipliées par le même rapport : on multiplie BC par 2,5. Le côté [EF] mesure 15 cm.',
          ],
        ],
        traps: [
          [
            '12 cm',
            'on a ajouté 6 cm, l’écart entre DE et AB. Un agrandissement multiplie les longueurs : il ne leur ajoute pas un même nombre.',
          ],
          [
            '2,4 cm',
            'on a divisé par 2,5 au lieu de multiplier. DEF est le plus grand des deux triangles : [EF] doit être plus long que [BC].',
          ],
          ['60 cm', 'on a multiplié par 10, la longueur DE, au lieu du rapport 2,5.'],
        ],
        check: 'les côtés sont bien proportionnels : 10 ÷ 4 = 2,5 et 15 ÷ 6 = 2,5.',
      },
    }),
    qcm({
      prompt:
        'Un triangle a un angle de 35°. On agrandit ce triangle avec le rapport 2. Combien mesure cet angle dans le triangle agrandi ?',
      choices: ['35°', '70°', '140°', 'On ne peut pas le savoir'],
      answer: '35°',
      correction: {
        steps: [
          [
            'Longueurs : multipliées par 2',
            'Un agrandissement de rapport 2 multiplie toutes les longueurs par 2 : les trois côtés du triangle sont 2 fois plus longs.',
          ],
          [
            'Angles : conservés',
            'La forme du triangle, elle, ne change pas : un agrandissement conserve les angles. Dans le triangle agrandi, l’angle mesure toujours 35°.',
          ],
        ],
        traps: [
          [
            '70°',
            'l’angle a été multiplié par 2, comme une longueur. Un angle n’est pas une longueur : il est conservé.',
          ],
          [
            '140°',
            'l’angle a été multiplié par 2² = 4, comme une aire. Seules les aires sont multipliées par le carré du rapport.',
          ],
          [
            'On ne peut pas le savoir',
            'on le sait : quel que soit le rapport, un agrandissement ou une réduction conserve tous les angles.',
          ],
        ],
        check:
          'la somme des angles d’un triangle vaut toujours 180°. Si chaque angle doublait, la somme doublerait aussi : c’est impossible.',
      },
    }),
    qcm({
      prompt:
        'Un rectangle a une aire de 4 cm². On l’agrandit avec le rapport 5. Quelle est l’aire du rectangle agrandi ?',
      choices: ['20 cm²', '500 cm²', '40 cm²', '100 cm²'],
      answer: '100 cm²',
      correction: {
        steps: [
          [
            '5² = 25',
            'Dans un agrandissement de rapport k, les aires sont multipliées par k². Ici, le rapport est 5 : on calcule 5².',
          ],
          [
            '4 × 25 = 100',
            'On multiplie l’aire de départ par 25 : l’aire du rectangle agrandi est 100 cm².',
          ],
        ],
        traps: [
          [
            '20 cm²',
            'l’aire a été multipliée par 5, comme une longueur. C’est l’erreur la plus fréquente : la longueur et la largeur sont toutes les deux multipliées par 5, donc l’aire l’est par 5 × 5.',
          ],
          ['500 cm²', 'l’aire a été multipliée par 5³ = 125, le coefficient des volumes.'],
          ['40 cm²', '5² vaut 5 × 5 = 25, pas 5 × 2 = 10.'],
        ],
        check:
          'on essaie avec un rectangle de 4 cm sur 1 cm, d’aire 4 cm². Agrandi, il mesure 20 cm sur 5 cm : son aire est bien 100 cm².',
      },
    }),
    qcm({
      prompt:
        'Une bouteille a un volume de 800 mL. Un échantillon a exactement la même forme : c’est une réduction de la bouteille, de rapport 0,5. Quel est le volume de l’échantillon ?',
      choices: ['400 mL', '100 mL', '200 mL', '1 600 mL'],
      answer: '100 mL',
      correction: {
        steps: [
          [
            '0,5³ = 0,5 × 0,5 × 0,5 = 0,125',
            'Dans une réduction de rapport k, les volumes sont multipliés par k³. Ici, le rapport est 0,5 : on calcule 0,5³.',
          ],
          [
            '800 × 0,125 = 100',
            'On multiplie le volume de départ par 0,125 : le volume de l’échantillon est 100 mL.',
          ],
        ],
        traps: [
          ['400 mL', 'le volume a été multiplié par 0,5, comme une longueur.'],
          ['200 mL', 'le volume a été multiplié par 0,5² = 0,25, le coefficient des aires.'],
          [
            '1 600 mL',
            'le volume a été divisé par 0,5, ce qui le double. Une réduction donne un volume plus petit.',
          ],
        ],
        check:
          'un rapport de 0,5 divise les longueurs par 2. Le volume est donc divisé par 2 × 2 × 2 = 8, et 800 ÷ 8 = 100.',
      },
    }),
    qcm({
      prompt:
        'Le triangle A′B′C′ est l’image du triangle ABC par une transformation. Pour aller de A à A′, de B à B′ et de C à C′, on se déplace à chaque fois dans la même direction, dans le même sens et de la même longueur, 5 cm. Quelle est cette transformation ?',
      choices: [
        'Une translation',
        'Une symétrie axiale',
        'Une symétrie centrale',
        'Une homothétie de rapport 2',
      ],
      answer: 'Une translation',
      correction: {
        steps: [
          [
            'Même direction, même sens, même longueur',
            'On fait un schéma : les trois sommets glissent de 5 cm, parallèlement les uns aux autres. Le triangle se déplace sans tourner, sans se retourner et sans changer de taille.',
          ],
          [
            'Une translation',
            'C’est la définition d’une translation : tous les points se déplacent dans la même direction, dans le même sens et de la même longueur.',
          ],
        ],
        traps: [
          [
            'Une symétrie axiale',
            'les trois déplacements auraient bien la même direction, perpendiculaire à l’axe. Mais trois points non alignés ne sont pas tous à la même distance de l’axe et du même côté : les déplacements n’auraient pas tous la même longueur et le même sens.',
          ],
          [
            'Une symétrie centrale',
            'les segments [AA′], [BB′] et [CC′] passeraient tous par le centre, qui serait leur milieu. Ils ne seraient pas parallèles.',
          ],
          [
            'Une homothétie de rapport 2',
            'les droites (AA′), (BB′) et (CC′) passeraient toutes par le centre, et le triangle A′B′C′ serait deux fois plus grand que ABC.',
          ],
        ],
        check:
          'on peut superposer ABC et A′B′C′ en faisant seulement glisser un calque : c’est bien ce que fait une translation.',
      },
    }),
    qcm({
      prompt:
        'ABCD est un carré de centre O. Ses sommets A, B, C, D se suivent dans le sens des aiguilles d’une montre. Quelle est l’image du point A par la rotation de centre O et d’angle 90°, dans le sens des aiguilles d’une montre ?',
      choices: ['Le point D', 'Le point C', 'Le point B', 'Le point A'],
      answer: 'Le point B',
      correction: {
        steps: [
          [
            'OA = OB et angle AOB = 90°',
            'On fait un schéma : un carré, ses sommets nommés dans le sens des aiguilles d’une montre, et son centre O. Les diagonales d’un carré ont la même longueur, se coupent en leur milieu et sont perpendiculaires. Le centre O est donc à la même distance de A et de B, et l’angle AOB est droit.',
          ],
          [
            'Le point B',
            'La rotation fait tourner A d’un quart de tour autour de O, dans le sens des aiguilles d’une montre. On arrive sur le sommet suivant dans ce sens : l’image de A est B.',
          ],
        ],
        traps: [
          [
            'Le point D',
            'c’est l’image de A quand on tourne dans l’autre sens. Le sens fait partie de la rotation, comme le centre et l’angle.',
          ],
          [
            'Le point C',
            'c’est l’image de A par un demi-tour : une rotation d’angle 180°, c’est-à-dire la symétrie centrale de centre O.',
          ],
          [
            'Le point A',
            'dans une rotation, seul le centre reste à sa place. Tous les autres points tournent.',
          ],
        ],
        check:
          'dans cette rotation, chaque sommet prend la place du suivant : A va en B, B en C, C en D et D en A. Le carré se superpose à lui-même.',
      },
    }),
    qcm({
      prompt:
        'Un triangle a pour côtés 3 cm, 4 cm et 5 cm. Son image par une transformation a pour côtés 6 cm, 8 cm et 10 cm. Laquelle de ces transformations a-t-on pu utiliser ?',
      choices: [
        'Une symétrie centrale',
        'Une rotation',
        'Une homothétie de rapport 0,5',
        'Une homothétie de rapport 2',
      ],
      answer: 'Une homothétie de rapport 2',
      correction: {
        steps: [
          [
            '6 ÷ 3 = 2 ; 8 ÷ 4 = 2 ; 10 ÷ 5 = 2',
            'On compare chaque côté de l’image au côté de départ qui lui correspond : toutes les longueurs ont été multipliées par 2. La transformation ne conserve donc pas les longueurs.',
          ],
          [
            'Une homothétie de rapport 2',
            'Les symétries, les translations et les rotations conservent les longueurs. Seule une homothétie les multiplie par son rapport. Ici, le rapport est 2 : c’est un agrandissement.',
          ],
        ],
        traps: [
          [
            'Une symétrie centrale',
            'elle conserve les longueurs : l’image aurait encore des côtés de 3 cm, 4 cm et 5 cm.',
          ],
          [
            'Une rotation',
            'elle fait tourner la figure sans changer sa taille : les longueurs sont conservées.',
          ],
          [
            'Une homothétie de rapport 0,5',
            'ce rapport est inférieur à 1 : c’est une réduction. Les côtés de l’image mesureraient 1,5 cm, 2 cm et 2,5 cm.',
          ],
        ],
        check:
          'les côtés des deux triangles sont proportionnels : les triangles sont semblables et ont les mêmes angles.',
      },
    }),
    qcm({
      prompt:
        'Le triangle A′B′C′ est l’image du triangle ABC par l’homothétie de centre O et de rapport 4. Le triangle ABC a un périmètre de 12 cm et une aire de 6 cm². Que valent le périmètre et l’aire du triangle A′B′C′ ?',
      choices: ['48 cm et 24 cm²', '48 cm et 96 cm²', '16 cm et 10 cm²', '192 cm et 96 cm²'],
      answer: '48 cm et 96 cm²',
      correction: {
        steps: [
          [
            '12 × 4 = 48',
            'Une homothétie de rapport 4 est un agrandissement de rapport 4. Le périmètre est une longueur : il est multiplié par 4.',
          ],
          [
            '6 × 4² = 6 × 16 = 96',
            'L’aire, elle, est multipliée par le carré du rapport : 4² = 16.',
          ],
          ['48 cm et 96 cm²', 'Le périmètre de A′B′C′ est 48 cm et son aire est 96 cm².'],
        ],
        traps: [
          [
            '48 cm et 24 cm²',
            'l’aire a été multipliée par 4, comme le périmètre. Une aire est multipliée par le carré du rapport.',
          ],
          [
            '16 cm et 10 cm²',
            'on a ajouté 4 au lieu de multiplier. Un agrandissement multiplie les longueurs par son rapport.',
          ],
          [
            '192 cm et 96 cm²',
            'le périmètre a été multiplié par 16, comme l’aire. C’est une longueur : il est multiplié par 4 seulement.',
          ],
        ],
        check:
          'un triangle rectangle de côtés 3 cm, 4 cm et 5 cm a pour périmètre 12 cm et pour aire 6 cm². Son image a pour côtés 12 cm, 16 cm et 20 cm : son périmètre est 48 cm et son aire 12 × 16 ÷ 2 = 96 cm².',
      },
    }),
  ],
})

export const geometrie = [
  pythagore,
  thales,
  reciproqueDeThales,
  trigonometrieLongueur,
  trigonometrieAngle,
  agrandissementsEtTransformations,
]
