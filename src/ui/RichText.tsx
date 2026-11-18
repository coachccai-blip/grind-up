import { Fragment } from 'react'
import { parseRichText, type Inline } from '../../shared/rules/rich-text'
import styles from './RichText.module.css'
import { classes } from './classes'

function renderInline(nodes: readonly Inline[]) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return <Fragment key={index}>{node.text}</Fragment>
      case 'bold':
        return <strong key={index}>{renderInline(node.children)}</strong>
      case 'link':
        return (
          <a key={index} href={node.href} target="_blank" rel="noopener noreferrer" data-inline>
            {renderInline(node.children)}
          </a>
        )
      case 'break':
        return <br key={index} />
    }
  })
}

/**
 * Affiche un texte mis en forme (gras, listes, liens). Le texte est d'abord
 * découpé en une structure, puis rendu élément par élément : rien de ce qu'a
 * saisi l'utilisateur n'est interprété comme du HTML.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text)
  return (
    <div className={classes(styles.richText, className)}>
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') return <p key={index}>{renderInline(block.children)}</p>
        const List = block.ordered ? 'ol' : 'ul'
        return (
          <List key={index} className={block.ordered ? styles.numbered : styles.bullets}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
