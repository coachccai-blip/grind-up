import { describe, expect, it } from 'vitest'
import { isSafeLink, parseRichText, richTextToPlainText } from '../../shared/rules/rich-text.js'

const text = (value: string) => ({ type: 'text' as const, text: value })

describe('texte mis en forme des consignes', () => {
  it('découpe le texte en paragraphes et garde les retours à la ligne', () => {
    expect(parseRichText('Première ligne\nSeconde ligne\n\nAutre paragraphe')).toEqual([
      {
        type: 'paragraph',
        children: [text('Première ligne'), { type: 'break' }, text('Seconde ligne')],
      },
      { type: 'paragraph', children: [text('Autre paragraphe')] },
    ])
  })

  it('reconnaît le gras', () => {
    expect(parseRichText('Calcule **sans calculatrice** !')).toEqual([
      {
        type: 'paragraph',
        children: [
          text('Calcule '),
          { type: 'bold', children: [text('sans calculatrice')] },
          text(' !'),
        ],
      },
    ])
  })

  it('reconnaît les listes à puces et numérotées', () => {
    expect(
      parseRichText('À faire :\n- 20 pompes\n- 30 abdos\n\n1. Lis le cours\n2. Ferme le cahier'),
    ).toEqual([
      { type: 'paragraph', children: [text('À faire :')] },
      { type: 'list', ordered: false, items: [[text('20 pompes')], [text('30 abdos')]] },
      { type: 'list', ordered: true, items: [[text('Lis le cours')], [text('Ferme le cahier')]] },
    ])
  })

  it('reconnaît les liens écrits ou collés tels quels', () => {
    expect(
      parseRichText('Voir [la vidéo](https://exemple.fr/video) ou https://exemple.fr/cours.'),
    ).toEqual([
      {
        type: 'paragraph',
        children: [
          text('Voir '),
          { type: 'link', href: 'https://exemple.fr/video', children: [text('la vidéo')] },
          text(' ou '),
          {
            type: 'link',
            href: 'https://exemple.fr/cours',
            children: [text('https://exemple.fr/cours')],
          },
          text('.'),
        ],
      },
    ])
  })

  it('n’accepte que les liens http et https', () => {
    expect(isSafeLink('https://exemple.fr')).toBe(true)
    expect(isSafeLink('http://exemple.fr/a?b=c')).toBe(true)
    expect(isSafeLink('javascript:alert(1)')).toBe(false)
    expect(isSafeLink('data:text/html,<script>')).toBe(false)
    expect(isSafeLink(' https://exemple.fr')).toBe(false)

    // Un lien dangereux reste du texte, il ne devient jamais cliquable.
    const [block] = parseRichText('[clique](javascript:alert(1))')
    expect(JSON.stringify(block)).not.toContain('"link"')
  })

  it('laisse les balises HTML à l’état de texte', () => {
    expect(parseRichText('<script>alert(1)</script> <b>gras</b>')).toEqual([
      { type: 'paragraph', children: [text('<script>alert(1)</script> <b>gras</b>')] },
    ])
  })

  it('accepte les emojis et le gras dans une liste', () => {
    expect(parseRichText('- 🏃 Cours **20 minutes**')).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [[text('🏃 Cours '), { type: 'bold', children: [text('20 minutes')] }]],
      },
    ])
  })

  it('donne le texte brut d’une consigne', () => {
    expect(
      richTextToPlainText('Fais **20 pompes**\n\n- puis [étire-toi](https://exemple.fr)'),
    ).toBe('Fais 20 pompes puis étire-toi')
    expect(parseRichText('')).toEqual([])
    expect(parseRichText('  \n\n ')).toEqual([])
  })
})
