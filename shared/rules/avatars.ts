/**
 * Galerie d'avatars : des emojis d'animaux et de personnages, chacun sur une
 * pastille pastel. Pas de photo importée (section 11 du brief).
 */
export type AvatarTint = 'lavender' | 'mint' | 'peach' | 'yellow' | 'sky' | 'green' | 'pink'

export interface Avatar {
  /** Clé stable, enregistrée en base. */
  id: string
  emoji: string
  /** Nom lu par les lecteurs d'écran. */
  label: string
  tint: AvatarTint
}

export const AVATARS: readonly Avatar[] = [
  { id: 'fox', emoji: '🦊', label: 'Renard', tint: 'peach' },
  { id: 'panda', emoji: '🐼', label: 'Panda', tint: 'mint' },
  { id: 'tiger', emoji: '🐯', label: 'Tigre', tint: 'yellow' },
  { id: 'lion', emoji: '🦁', label: 'Lion', tint: 'peach' },
  { id: 'frog', emoji: '🐸', label: 'Grenouille', tint: 'green' },
  { id: 'monkey', emoji: '🐵', label: 'Singe', tint: 'yellow' },
  { id: 'koala', emoji: '🐨', label: 'Koala', tint: 'lavender' },
  { id: 'rabbit', emoji: '🐰', label: 'Lapin', tint: 'pink' },
  { id: 'bear', emoji: '🐻', label: 'Ours', tint: 'peach' },
  { id: 'octopus', emoji: '🐙', label: 'Pieuvre', tint: 'pink' },
  { id: 'owl', emoji: '🦉', label: 'Chouette', tint: 'lavender' },
  { id: 'unicorn', emoji: '🦄', label: 'Licorne', tint: 'pink' },
  { id: 'dolphin', emoji: '🐬', label: 'Dauphin', tint: 'sky' },
  { id: 'turtle', emoji: '🐢', label: 'Tortue', tint: 'green' },
  { id: 'butterfly', emoji: '🦋', label: 'Papillon', tint: 'sky' },
  { id: 'bee', emoji: '🐝', label: 'Abeille', tint: 'yellow' },
  { id: 'dinosaur', emoji: '🦖', label: 'Dinosaure', tint: 'green' },
  { id: 'penguin', emoji: '🐧', label: 'Manchot', tint: 'sky' },
  { id: 'wolf', emoji: '🐺', label: 'Loup', tint: 'lavender' },
  { id: 'raccoon', emoji: '🦝', label: 'Raton laveur', tint: 'mint' },
  { id: 'hamster', emoji: '🐹', label: 'Hamster', tint: 'peach' },
  { id: 'hedgehog', emoji: '🦔', label: 'Hérisson', tint: 'yellow' },
  { id: 'otter', emoji: '🦦', label: 'Loutre', tint: 'mint' },
  { id: 'cat', emoji: '🐱', label: 'Chat', tint: 'yellow' },
  { id: 'dog', emoji: '🐶', label: 'Chien', tint: 'peach' },
  { id: 'whale', emoji: '🐳', label: 'Baleine', tint: 'sky' },
  { id: 'wizard', emoji: '🧙', label: 'Mage', tint: 'lavender' },
  { id: 'elf', emoji: '🧝', label: 'Elfe', tint: 'green' },
  { id: 'fairy', emoji: '🧚', label: 'Fée', tint: 'pink' },
  { id: 'hero', emoji: '🦸', label: 'Super-héros', tint: 'sky' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja', tint: 'lavender' },
  { id: 'astronaut', emoji: '🧑‍🚀', label: 'Astronaute', tint: 'mint' },
]

/** Avatar attribué quand la clé enregistrée est inconnue (galerie modifiée depuis). */
export const FALLBACK_AVATAR: Avatar = AVATARS[0]!

export function findAvatar(id: string): Avatar {
  return AVATARS.find((avatar) => avatar.id === id) ?? FALLBACK_AVATAR
}

export function isAvatarId(id: string): boolean {
  return AVATARS.some((avatar) => avatar.id === id)
}
