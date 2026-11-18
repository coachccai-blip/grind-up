import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'
import {
  acknowledgeCelebration,
  openAdminScreen,
  publishQuest,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

/**
 * Passe d'accessibilité et de mise en page (étape 6 du brief) : chaque écran,
 * sur téléphone et sur ordinateur, est soumis aux mêmes contrôles.
 *
 * - axe : règles WCAG 2.2 de niveau A et AA, et bonnes pratiques (contrastes
 *   calculés sur l'écran réel, libellés, rôles, structure des titres) ;
 * - la page tient dans la largeur de l'écran ;
 * - les zones tactiles font au moins 44 px ;
 * - les champs de saisie sont en 16 px au moins (pas de zoom automatique sur iPhone).
 */
const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function audit(page: Page, screen: string): Promise<void> {
  // Le titre principal est là : l'écran a fini de se charger.
  await expect(page.getByRole('heading', { level: 1 }).first(), screen).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).withTags(RULES).analyze()
  const found = violations.map(
    (violation) =>
      `${violation.id} (${violation.help}) : ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  )
  expect.soft(found, `${screen} : règles d’accessibilité`).toEqual([])

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect.soft(overflow, `${screen} : défilement horizontal`).toBeLessThanOrEqual(0)

  const layout = await page.evaluate(() => {
    const describe = (element: Element) =>
      `${element.tagName.toLowerCase()} « ${(element.textContent ?? '').trim().slice(0, 40)} »`
    const visible = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(selector)].filter((element) =>
        element.checkVisibility(),
      )

    const tooSmall = visible('a, button, input, select, textarea, summary')
      // Une case, un bouton radio ou un champ de fichier se touche par tout son libellé.
      .map((element) =>
        element.matches('input[type="radio"], input[type="checkbox"], input[type="file"]')
          ? (element.closest('label') ??
            document.querySelector<HTMLElement>(`label[for="${element.id}"]`) ??
            element)
          : element,
      )
      // Un lien dans le fil d'une phrase suit la hauteur de sa ligne.
      .filter((element) => !(element.tagName === 'A' && element.dataset.inline !== undefined))
      .map((element) => ({ element, box: element.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && box.height > 0 && (box.height < 44 || box.width < 44))
      .map(
        ({ element, box }) =>
          `${describe(element)} ${Math.round(box.width)} × ${Math.round(box.height)} px`,
      )

    const smallText = visible(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea',
    )
      .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 16)
      .map((element) => `${describe(element)} ${getComputedStyle(element).fontSize}`)

    return { tooSmall, smallText }
  })
  expect.soft(layout.tooSmall, `${screen} : zones tactiles de moins de 44 px`).toEqual([])
  expect.soft(layout.smallText, `${screen} : champs de moins de 16 px`).toEqual([])
}

/** Un second navigateur, réglé comme celui du test (taille d'écran, tactile). */
async function sameDevice(browser: Browser, page: Page) {
  const context = await browser.newContext({
    viewport: page.viewportSize(),
    hasTouch: (page.viewportSize()?.width ?? 0) < 1024,
    reducedMotion: 'reduce',
  })
  return { context, page: await context.newPage() }
}

const inHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

// Sans animation : un texte en cours d'apparition fausserait la mesure des contrastes.
test.use({ reducedMotion: 'reduce' })

test.describe('accessibilité et mise en page', () => {
  test('écrans publics : connexion, inscription, page introuvable, test de déploiement', async ({
    page,
  }) => {
    await page.goto('/connexion')
    await audit(page, 'Connexion')
    // Un formulaire refusé affiche ses erreurs : elles aussi doivent être lisibles.
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await audit(page, 'Connexion refusée')

    await page.goto('/inscription')
    await page.getByText('J’ai un code spécial').click()
    await audit(page, 'Inscription')
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await audit(page, 'Inscription refusée')

    await page.goto('/une-adresse-qui-n-existe-pas')
    await audit(page, 'Page introuvable')

    await page.goto('/sante')
    await expect(page.getByText(/Test réussi|Test échoué/).first()).toBeVisible()
    await audit(page, 'Test de déploiement')
  })

  test('espace élève : tous les écrans, de l’inscription à la quête validée', async ({
    browser,
    page,
  }) => {
    test.slow()
    const admin = await sameDevice(browser, page)
    await signUpAdmin(admin.page, uniquePseudo('Coach'))

    // Inscription : l'écran de bienvenue montre l'identifiant.
    const pseudo = uniquePseudo('Lou')
    await page.goto('/inscription')
    await page.getByLabel('Pseudo').fill(pseudo)
    await page.getByLabel('Mot de passe').fill('motdepasse-solide')
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await audit(page, 'Bienvenue')
    await page.getByRole('button', { name: 'C’est noté, continuer' }).click()
    await audit(page, 'Tableau de bord vide')

    // Une quête de chaque format, avec des deadlines proches pour les comptes à rebours.
    const tag = uniquePseudo('a11y')
    const exact = await publishQuest(admin.page, {
      title: `Calcul ${tag}`,
      instructions: 'Réponds **sans calculatrice**.\n- une réponse par question',
      deadlineAt: inHours(2),
      items: [
        { prompt: '6 × 7 ?', answers: ['42'] },
        { prompt: '9 × 9 ?', answers: ['81'] },
      ],
    })
    const qcm = await publishQuest(admin.page, {
      title: `QCM ${tag}`,
      category: 'memorization',
      format: 'qcm',
      deadlineAt: inHours(20),
      items: [
        { prompt: 'Capitale de l’Italie ?', choices: ['Milan', 'Rome', 'Naples'], correct: [1] },
        { prompt: 'Villes de France ?', choices: ['Lyon', 'Turin', 'Lille'], correct: [0, 2] },
      ],
    })
    const cards = await publishQuest(admin.page, {
      title: `Cartes ${tag}`,
      category: 'memorization',
      format: 'flashcards',
      deadlineAt: inHours(72),
      items: [
        { prompt: 'Italie', answers: ['Rome'] },
        { prompt: 'Espagne', answers: ['Madrid'] },
        { prompt: 'Portugal', answers: ['Lisbonne'] },
      ],
    })
    const sport = await publishQuest(admin.page, {
      title: `Course ${tag}`,
      category: 'sport',
      format: 'declarative',
      manualValidation: false,
      instructions: 'Cours 20 minutes.',
    })
    const essay = await publishQuest(admin.page, {
      title: `Résumé ${tag}`,
      category: 'other',
      format: 'free_text',
      instructions: 'Résume le chapitre.',
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Quêtes à faire' })).toBeVisible()
    await audit(page, 'Tableau de bord')
    await page.goto('/quetes')
    await expect(page.getByText(`Calcul ${tag}`)).toBeVisible()
    await audit(page, 'Mes quêtes')

    // Réponse exacte : le formulaire, puis une tentative manquée et ses corrections.
    await page.goto(`/quetes/${exact.id}`)
    await audit(page, 'Quête à réponse exacte')
    await page.getByLabel(/6 × 7/).fill('41')
    await page.getByLabel(/9 × 9/).fill('81')
    await page.getByRole('button', { name: 'Valider mes réponses' }).click()
    await expect(page.getByText('À revoir').first()).toBeVisible()
    await audit(page, 'Quête à réponse exacte, tentative manquée')

    await page.goto(`/quetes/${qcm.id}`)
    await audit(page, 'QCM')

    // Cartes de mémorisation : le parcours des cartes, puis le test.
    await page.goto(`/quetes/${cards.id}`)
    await audit(page, 'Cartes de mémorisation')
    await page.getByRole('button', { name: 'Passer le test' }).click()
    await audit(page, 'Test des cartes')

    // Réponse libre : soumise, elle attend l'admin.
    await page.goto(`/quetes/${essay.id}`)
    await audit(page, 'Réponse libre')
    await page.getByLabel('Ta réponse').fill('Voici mon résumé du chapitre.')
    await page.getByRole('button', { name: 'Envoyer ma réponse' }).click()
    await expect(page.getByText('Réponse envoyée')).toBeVisible()
    await audit(page, 'Réponse libre soumise')

    // Déclaratif : « C'est fait » valide la quête, et l'annonce s'affiche.
    await page.goto(`/quetes/${sport.id}`)
    await audit(page, 'Quête déclarative')
    await page.getByRole('button', { name: 'C’est fait' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await audit(page, 'Annonce d’une quête validée')
    await acknowledgeCelebration(page)
    await audit(page, 'Quête validée')

    await page.goto('/quetes?onglet=terminees')
    await audit(page, 'Mes quêtes terminées')
    await page.goto('/leaderboard')
    await expect(page.getByRole('list', { name: 'Podium' })).toBeVisible()
    await audit(page, 'Leaderboard')
    await page.goto('/profil')
    await page.getByText('Changer d’avatar').click()
    await expect(page.getByRole('radio', { name: 'Renard' })).toBeAttached()
    await audit(page, 'Profil')

    await admin.context.close()
  })

  test('espace admin : tous les écrans, leurs formulaires et leurs fenêtres', async ({
    browser,
    page,
  }) => {
    test.slow()
    const student = await sameDevice(browser, page)
    const pseudo = uniquePseudo('Max')
    await signUpStudent(student.page, pseudo)
    await signUpAdmin(page, uniquePseudo('Coach'))
    await audit(page, 'Vue d’ensemble')

    const tag = uniquePseudo('a11y')
    const quest = await publishQuest(page, {
      title: `Calcul ${tag}`,
      deadlineAt: inHours(30),
      items: [{ prompt: '6 × 7 ?', answers: ['42'] }],
    })
    const essay = await publishQuest(page, {
      title: `Résumé ${tag}`,
      category: 'other',
      format: 'free_text',
      instructions: 'Résume le chapitre.',
    })
    // L'élève valide une course : le classement a son podium.
    const sport = await publishQuest(page, {
      title: `Course ${tag}`,
      category: 'sport',
      format: 'declarative',
      manualValidation: false,
      instructions: 'Cours 20 minutes.',
    })
    const done = await student.page.request.post(`/api/quests/${sport.id}/attempts`, { data: {} })
    expect(done.status()).toBe(200)
    await student.page.request.post('/api/progress/celebration/seen', { data: {} })
    // Il soumet aussi un résumé : la file de validation n'est pas vide.
    await student.page.goto(`/quetes/${essay.id}`)
    await student.page.getByLabel('Ta réponse').fill('Mon résumé.')
    await student.page.getByRole('button', { name: 'Envoyer ma réponse' }).click()
    await expect(student.page.getByText('Réponse envoyée')).toBeVisible()

    await page.reload()
    await expect(page.getByText(`Calcul ${tag}`)).toBeVisible()
    await audit(page, 'Vue d’ensemble avec une deadline proche')

    // Élèves : la liste, la fiche, et ses fenêtres.
    await openAdminScreen(page, 'Élèves')
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await audit(page, 'Élèves')
    await page.getByRole('link', { name: new RegExp(pseudo) }).click()
    await expect(page.getByRole('heading', { level: 1, name: pseudo })).toBeVisible()
    await expect(page.getByText(`Calcul ${tag}`)).toBeVisible()
    await audit(page, 'Fiche d’un élève')
    await page.getByRole('button', { name: 'Ajuster l’XP' }).click()
    await audit(page, 'Fenêtre d’ajustement d’XP')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await page.getByRole('button', { name: 'Supprimer le compte' }).click()
    await audit(page, 'Fenêtre de suppression d’un compte')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()

    // Quêtes : la liste, la fiche, le formulaire dans chaque format.
    await openAdminScreen(page, 'Quêtes')
    await expect(page.getByText(`Calcul ${tag}`)).toBeVisible()
    await audit(page, 'Quêtes')
    await page.goto(`/admin/quetes/${quest.id}`)
    await audit(page, 'Fiche d’une quête')
    await page.getByRole('button', { name: 'Ajouter des élèves' }).click()
    await audit(page, 'Fenêtre d’ajout d’élèves')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await page.goto('/admin/quetes/nouvelle')
    await audit(page, 'Nouvelle quête, réponse exacte')
    await page.getByRole('radio', { name: /^QCM/ }).check()
    await audit(page, 'Nouvelle quête, QCM')
    await page.getByRole('radio', { name: /^Cartes de mémorisation/ }).check()
    await audit(page, 'Nouvelle quête, cartes')
    await page.getByRole('radio', { name: /^Déclaratif/ }).check()
    await page.getByLabel('Fixer une deadline').check()
    await audit(page, 'Nouvelle quête, déclaratif avec deadline')
    // Un formulaire refusé : ses erreurs sont affichées.
    await page.getByRole('button', { name: 'Publier la quête' }).click()
    await expect(page.getByText(/à corriger/)).toBeVisible()
    await audit(page, 'Nouvelle quête refusée')

    // Validations : la file et la fenêtre de refus.
    await openAdminScreen(page, 'Validations')
    await expect(page.getByText(pseudo).first()).toBeVisible()
    await audit(page, 'Validations')
    await page.getByRole('button', { name: `Refuser la réalisation de ${pseudo}` }).click()
    await audit(page, 'Fenêtre de refus')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()

    // Bots : la liste avec le classement, le formulaire, la fenêtre d'ajustement.
    await page.goto('/admin/bots/nouveau')
    await audit(page, 'Nouveau bot')
    const bot = uniquePseudo('Bot')
    await page.getByLabel('Pseudo').fill(bot)
    await page.getByRole('button', { name: 'Créer le bot' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Bots' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Podium' })).toBeVisible()
    await audit(page, 'Bots')
    await page.getByRole('button', { name: `Ajuster ${bot}` }).click()
    await audit(page, 'Fenêtre d’ajustement d’un bot')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await page.getByRole('button', { name: `Supprimer ${bot}` }).click()
    await page.getByRole('button', { name: 'Supprimer le bot' }).click()

    await openAdminScreen(page, 'Paramètres')
    await expect(page.getByRole('heading', { name: 'Barème d’XP' })).toBeVisible()
    await audit(page, 'Paramètres')
    // Une valeur refusée : son erreur est affichée.
    await page.getByLabel('Facile (en XP)').fill('beaucoup')
    await page.getByRole('button', { name: 'Enregistrer les paramètres' }).click()
    await expect(page.getByText('Une valeur est à corriger avant d’enregistrer.')).toBeVisible()
    await audit(page, 'Paramètres refusés')

    await student.context.close()
  })
})
