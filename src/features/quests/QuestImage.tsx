import styles from './QuestImage.module.css'

/** Image de la consigne d'une quête. */
export function QuestImage({ src }: { src: string }) {
  return <img className={styles.image} src={src} alt="Image de la consigne" loading="lazy" />
}
