import { defineExercise, exact, paragraphs } from '../authoring.js'

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
      '- **Réciproque :** si, dans un triangle, le carré du plus long côté est égal à la somme des carrés des deux autres, alors ce triangle est rectangle.',
    ].join('\n'),
    'Pour calculer l’hypoténuse, on additionne les carrés. Pour calculer un côté de l’angle droit, on soustrait.',
  ),
  example: [
    {
      statement: 'Le triangle EFG est rectangle en E. EF = 6 cm et EG = 8 cm. Calcule FG.',
      steps: [
        [
          'FG² = EF² + EG²',
          'On fait un schéma à main levée. L’angle droit est en E, donc l’hypoténuse est [FG], le côté en face. On écrit l’égalité de Pythagore.',
        ],
        [
          'FG² = 6² + 8² = 36 + 64 = 100',
          'On remplace par les longueurs connues, puis on calcule les carrés et leur somme.',
        ],
        [
          'FG = √100 = 10',
          'FG est une longueur, donc un nombre positif : c’est la racine carrée de 100.',
        ],
      ],
      conclusion: 'FG = 10 cm.',
    },
    {
      statement: 'Le triangle RST est rectangle en R. ST = 13 cm et RS = 5 cm. Calcule RT.',
      steps: [
        [
          'ST² = RS² + RT²',
          'L’hypoténuse est [ST]. On écrit la même égalité : cette fois, la longueur cherchée est un côté de l’angle droit.',
        ],
        [
          'RT² = 13² − 5² = 169 − 25 = 144',
          'Pour isoler RT², on retranche 5² au carré de l’hypoténuse.',
        ],
        ['RT = √144 = 12', 'On prend la racine carrée.'],
      ],
      conclusion: 'RT = 12 cm. Ce côté est bien plus court que l’hypoténuse, qui mesure 13 cm.',
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
          'arrondir trop tôt, ou donner 7,21 : « au dixième » veut dire un seul chiffre après la virgule.',
      },
    }),
    exact({
      prompt:
        'Une échelle de 5 m est posée contre un mur vertical. Son pied est à 1,4 m du mur. À quelle hauteur, en m, touche-t-elle le mur ?',
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

export const geometrie = [pythagore]
