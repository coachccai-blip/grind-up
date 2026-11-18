import { z } from 'zod'
import {
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../rules/password.js'
import { checkPseudo, PSEUDO_PROBLEM_MESSAGES } from '../rules/pseudo.js'

/**
 * Formats des échanges d'authentification, partagés entre le serveur (qui valide
 * toutes les saisies) et l'interface (qui signale les erreurs avant l'envoi).
 */
export const pseudoSchema = z
  .string()
  .trim()
  .superRefine((pseudo, context) => {
    const problem = checkPseudo(pseudo)
    if (problem) context.addIssue({ code: 'custom', message: PSEUDO_PROBLEM_MESSAGES[problem] })
  })

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_LENGTH_MESSAGE)

export const signupRequestSchema = z.object({
  pseudo: pseudoSchema,
  password: passwordSchema,
  /** Code spécial facultatif : il fait du compte un compte admin. */
  specialCode: z.string().max(100, 'Ce code est trop long.').optional().default(''),
})
export type SignupRequest = z.infer<typeof signupRequestSchema>

export const loginRequestSchema = z.object({
  login: z.string().trim().min(1, 'Identifiant ou pseudo requis.').max(64, 'Saisie trop longue.'),
  password: z
    .string()
    .min(1, 'Mot de passe requis.')
    .max(PASSWORD_MAX_LENGTH, 'Saisie trop longue.'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const changePasswordRequestSchema = z.object({
  /** Inutile après une connexion avec un mot de passe temporaire. */
  currentPassword: z.string().max(PASSWORD_MAX_LENGTH, 'Saisie trop longue.').optional(),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

export type UserRole = 'student' | 'admin'

/** L'utilisateur connecté, tel que l'interface le reçoit. */
export interface SessionUser {
  id: string
  role: UserRole
  pseudo: string
  /** Identifiant XXXX-XXXX ; null pour un admin. */
  publicId: string | null
  avatar: string
  /** Vrai après une connexion avec un mot de passe temporaire : il faut en choisir un nouveau. */
  mustChangePassword: boolean
}

export interface SessionResponse {
  user: SessionUser | null
}
