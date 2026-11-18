import { expect, test } from '@playwright/test'
import {
  ADMIN_PASSWORD,
  expectNoHorizontalScroll,
  isPhone,
  logIn,
  openAdminScreen,
  PASSWORD,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

test.describe('inscription et connexion d’un élève', () => {
  test('un élève s’inscrit, reçoit son identifiant et arrive sur son tableau de bord', async ({
    page,
  }) => {
    const pseudo = uniquePseudo('Lea')

    // Un visiteur non connecté arrive sur l'écran de connexion.
    await page.goto('/')
    await expect(page).toHaveURL(/\/connexion$/)
    await page.getByRole('link', { name: 'Inscription' }).click()

    // L'écran d'inscription recommande de ne pas utiliser son vrai nom.
    await expect(page.getByText('Ne mets pas ton vrai nom.')).toBeVisible()
    await page.getByLabel('Pseudo').fill(pseudo)
    await page.getByLabel('Mot de passe').fill(PASSWORD)
    await page.getByRole('button', { name: 'Créer mon compte' }).click()

    // L'identifiant est affiché, avec un bouton pour le copier et la consigne de le noter.
    await expect(page.getByRole('heading', { name: `Bienvenue, ${pseudo}` })).toBeVisible()
    const identifier = await page.getByText(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/).textContent()
    expect(identifier).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
    await expect(page.getByText('Note-le bien')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copier mon identifiant' })).toBeVisible()

    // Tant qu'il n'a pas confirmé, toute autre page le ramène à son identifiant.
    await page.goto('/profil')
    await expect(page).toHaveURL(/\/bienvenue$/)
    await expect(page.getByText(identifier!)).toBeVisible()

    await page.getByRole('button', { name: 'C’est noté, continuer' }).click()
    await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Aucune quête pour l’instant' })).toBeVisible()

    // L'identifiant reste visible dans le profil.
    await page.getByRole('link', { name: 'Profil' }).click()
    await expect(page.getByText(identifier!)).toBeVisible()
  })

  test('il se reconnecte avec son identifiant ou son pseudo', async ({ page }) => {
    const pseudo = uniquePseudo('Tom')
    const identifier = await signUpStudent(page, pseudo)

    await page.getByRole('link', { name: 'Profil' }).click()
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)

    // Identifiant saisi en minuscules et sans tiret : il est reconnu quand même.
    await logIn(page, identifier.toLowerCase().replace('-', ''), PASSWORD)
    await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()

    await page.getByRole('link', { name: 'Profil' }).click()
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)
    await logIn(page, pseudo.toUpperCase(), PASSWORD)
    await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
  })

  test('un mauvais mot de passe affiche un message clair, sans emoji', async ({ page }) => {
    const pseudo = uniquePseudo('Zoe')
    await signUpStudent(page, pseudo)
    await page.context().clearCookies()

    await logIn(page, pseudo, 'pas-le-bon-mot-de-passe')

    const alert = page.getByRole('alert')
    await expect(alert).toHaveText('Identifiant ou mot de passe incorrect.')
    expect(await alert.textContent()).not.toMatch(/\p{Extended_Pictographic}/u)
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('l’inscription signale les saisies invalides et les pseudos déjà pris', async ({ page }) => {
    const pseudo = uniquePseudo('Max')
    await signUpStudent(page, pseudo)
    await page.context().clearCookies()

    await page.goto('/inscription')
    await page.getByLabel('Pseudo').fill('a b')
    await page.getByLabel('Mot de passe').fill('court')
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await expect(
      page.getByText('Le pseudo ne peut contenir que des lettres, des chiffres, des tirets'),
    ).toBeVisible()
    await expect(
      page.getByText('Le mot de passe doit faire entre 8 et 128 caractères.'),
    ).toBeVisible()

    // Même pseudo avec d'autres majuscules : déjà pris.
    await page.getByLabel('Pseudo').fill(pseudo.toUpperCase())
    await page.getByLabel('Mot de passe').fill(PASSWORD)
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await expect(page.getByText('Ce pseudo est déjà pris.')).toBeVisible()
  })

  test('il change son mot de passe depuis son profil', async ({ page }) => {
    const pseudo = uniquePseudo('Eva')
    await signUpStudent(page, pseudo)
    await page.goto('/profil')

    await page.getByLabel('Mot de passe actuel').fill(PASSWORD)
    await page.getByLabel('Nouveau mot de passe').fill('mon-nouveau-secret')
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
    await expect(page.getByText('Mot de passe changé.')).toBeVisible()

    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)
    await logIn(page, pseudo, 'mon-nouveau-secret')
    await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
  })
})

test.describe('code spécial et espace admin', () => {
  test('le code spécial crée un compte admin, qui arrive dans son espace', async ({ page }) => {
    const pseudo = uniquePseudo('Coach')

    await signUpAdmin(page, pseudo)

    await expect(page).toHaveURL(/\/admin$/)
    if (isPhone(page)) await page.getByRole('button', { name: 'Menu' }).click()
    const menu = page.getByRole('navigation', { name: 'Navigation de l’espace admin' })
    for (const label of [
      'Vue d’ensemble',
      'Élèves',
      'Quêtes',
      'Validations',
      'Bots',
      'Paramètres',
    ]) {
      await expect(menu.getByRole('link', { name: label })).toBeVisible()
    }
    await expect(menu.getByText(pseudo)).toBeVisible()
  })

  test('un mauvais code ne crée aucun compte', async ({ page }) => {
    const pseudo = uniquePseudo('Intrus')

    await page.goto('/inscription')
    await page.getByLabel('Pseudo').fill(pseudo)
    await page.getByLabel('Mot de passe').fill(PASSWORD)
    await page.getByText('J’ai un code spécial').click()
    await page.getByLabel('Code spécial').fill('superadmin')
    await page.getByRole('button', { name: 'Créer mon compte' }).click()

    await expect(page.getByRole('alert')).toHaveText(
      'Inscription impossible avec ces informations.',
    )
    await expect(page).toHaveURL(/\/inscription$/)

    // Le compte n'existe pas : impossible de s'y connecter.
    await logIn(page, pseudo, PASSWORD)
    await expect(page.getByRole('alert')).toHaveText('Identifiant ou mot de passe incorrect.')
  })

  test('le code admin n’est pas dans le code envoyé au navigateur', async ({ page }) => {
    const scripts: string[] = []
    page.on('response', async (response) => {
      const type = response.headers()['content-type'] ?? ''
      if (/javascript|html|css|json/.test(type)) scripts.push(await response.text().catch(() => ''))
    })

    await page.goto('/inscription')
    await page.getByText('J’ai un code spécial').click()
    await expect(page.getByLabel('Code spécial')).toBeVisible()

    expect(scripts.length).toBeGreaterThan(0)
    expect(scripts.join('\n')).not.toContain('SuperAdmin')
  })
})

test.describe('protection des pages par rôle', () => {
  const adminPages = [
    '/admin',
    '/admin/eleves',
    '/admin/quetes',
    '/admin/validations',
    '/admin/bots',
    '/admin/parametres',
  ]

  test('un visiteur non connecté est renvoyé à la connexion', async ({ page }) => {
    for (const path of ['/', '/quetes', '/leaderboard', '/profil', ...adminPages]) {
      await page.goto(path)
      await expect(page, path).toHaveURL(/\/connexion$/)
    }
  })

  test('un élève ne peut ouvrir aucune page ni aucune route de l’espace admin', async ({
    page,
  }) => {
    const pseudo = uniquePseudo('Noa')
    await signUpStudent(page, pseudo)

    for (const path of adminPages) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` }), path).toBeVisible()
      await expect(page, path).toHaveURL(/\/$/)
    }

    // Côté serveur, les données de l'espace admin lui sont refusées.
    const response = await page.request.get('/api/admin/students')
    expect(response.status()).toBe(403)
  })

  test('un admin est renvoyé dans son espace s’il ouvre une page d’élève', async ({ page }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))

    for (const path of ['/', '/quetes', '/profil']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'Vue d’ensemble' }), path).toBeVisible()
    }
  })

  test('un utilisateur connecté ne revoit pas l’écran de connexion', async ({ page }) => {
    const pseudo = uniquePseudo('Ines')
    await signUpStudent(page, pseudo)

    await page.goto('/connexion')

    await expect(page.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
  })
})

test.describe('gestion des élèves par l’admin', () => {
  test('l’admin retrouve un élève par son identifiant et le renomme', async ({ browser, page }) => {
    const pseudo = uniquePseudo('Lou')
    const studentContext = await browser.newContext()
    const identifier = await signUpStudent(await studentContext.newPage(), pseudo)
    await studentContext.close()

    await signUpAdmin(page, uniquePseudo('Coach'))
    await openAdminScreen(page, 'Élèves')

    await page.getByLabel('Rechercher un élève').fill(identifier.toLowerCase())
    const row = page.getByRole('link', { name: new RegExp(pseudo) })
    await expect(row).toBeVisible()
    await expect(row).toContainText(identifier)
    await expect(row).toContainText('Dernière activité')
    // Un compte actif n'a pas d'étiquette : seule l'exception est signalée dans la liste.
    await expect(row).not.toContainText('Compte désactivé')
    await expect(page.getByText(/^1 sur \d+ élèves$/)).toBeVisible()

    await row.click()
    await expect(page.getByRole('heading', { level: 1, name: pseudo })).toBeVisible()
    await expect(page.getByText('Compte actif', { exact: true })).toBeVisible()

    const renamed = uniquePseudo('Lilou')
    await page.getByRole('button', { name: 'Renommer' }).click()
    await page.getByLabel('Nouveau pseudo').fill(renamed)
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible()
    await expect(page.getByText(`L’élève s’appelle maintenant ${renamed}.`)).toBeVisible()
    // L'identifiant ne change jamais.
    await expect(page.getByText(identifier)).toBeVisible()
  })

  test('mot de passe oublié : l’admin en génère un temporaire, l’élève choisit le sien', async ({
    browser,
    page,
  }) => {
    const pseudo = uniquePseudo('Sam')
    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    await signUpStudent(studentPage, pseudo)

    await signUpAdmin(page, uniquePseudo('Coach'))
    await openAdminScreen(page, 'Élèves')
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await page.getByRole('link', { name: new RegExp(pseudo) }).click()

    await page.getByRole('button', { name: 'Mot de passe temporaire' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Générer le mot de passe' }).click()
    const temporary = await dialog.getByText(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/).textContent()
    expect(temporary).toBeTruthy()
    await dialog.getByRole('button', { name: 'Terminé' }).click()
    await expect(dialog).toBeHidden()

    // L'élève, déconnecté d'office, se connecte avec le mot de passe temporaire…
    await studentPage.goto('/')
    await expect(studentPage).toHaveURL(/\/connexion$/)
    await logIn(studentPage, pseudo, temporary!)

    // … et doit choisir le sien avant de continuer.
    await expect(
      studentPage.getByRole('heading', { name: 'Choisis ton nouveau mot de passe' }),
    ).toBeVisible()
    await studentPage.goto('/profil')
    await expect(studentPage).toHaveURL(/\/nouveau-mot-de-passe$/)
    await studentPage.getByLabel('Nouveau mot de passe').fill('mon-secret-a-moi')
    await studentPage.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(studentPage.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
    await studentContext.close()
  })

  test('un compte désactivé ne peut plus se connecter, puis revient à la réactivation', async ({
    browser,
    page,
  }) => {
    const pseudo = uniquePseudo('Hugo')
    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    await signUpStudent(studentPage, pseudo)

    await signUpAdmin(page, uniquePseudo('Coach'))
    await openAdminScreen(page, 'Élèves')
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await page.getByRole('link', { name: new RegExp(pseudo) }).click()

    await page.getByRole('button', { name: 'Désactiver le compte' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Désactiver le compte' }).click()
    await expect(page.getByText(`Le compte de ${pseudo} est désactivé.`)).toBeVisible()
    await expect(page.getByText('Compte désactivé', { exact: true })).toBeVisible()

    // Dans la liste, le compte désactivé porte son étiquette.
    await page.getByRole('link', { name: 'Retour aux élèves' }).click()
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await expect(page.getByRole('link', { name: new RegExp(pseudo) })).toContainText(
      'Compte désactivé',
    )
    await page.getByRole('link', { name: new RegExp(pseudo) }).click()

    await studentPage.goto('/')
    await expect(studentPage).toHaveURL(/\/connexion$/)
    await logIn(studentPage, pseudo, PASSWORD)
    await expect(studentPage.getByRole('alert')).toHaveText(
      'Ce compte est désactivé. Contacte ton accompagnant.',
    )

    await page.getByRole('button', { name: 'Réactiver le compte' }).click()
    await expect(page.getByText(`Le compte de ${pseudo} est réactivé.`)).toBeVisible()
    await logIn(studentPage, pseudo, PASSWORD)
    await expect(studentPage.getByRole('heading', { name: `Bonjour, ${pseudo}` })).toBeVisible()
    await studentContext.close()
  })

  test('la suppression d’un élève exige une confirmation explicite', async ({ browser, page }) => {
    const pseudo = uniquePseudo('Paul')
    const studentContext = await browser.newContext()
    await signUpStudent(await studentContext.newPage(), pseudo)
    await studentContext.close()

    await signUpAdmin(page, uniquePseudo('Coach'))
    await openAdminScreen(page, 'Élèves')
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await page.getByRole('link', { name: new RegExp(pseudo) }).click()

    await page.getByRole('button', { name: 'Supprimer le compte' }).click()
    const dialog = page.getByRole('dialog')
    const confirm = dialog.getByRole('button', { name: 'Supprimer définitivement' })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Je comprends que cette suppression est définitive.').check()
    await confirm.click()

    await expect(page.getByText(`Le compte de ${pseudo} a été supprimé.`)).toBeVisible()
    await page.getByLabel('Rechercher un élève').fill(pseudo)
    await expect(page.getByText('Aucun élève ne correspond à cette recherche.')).toBeVisible()
  })

  test('l’admin se déconnecte et se reconnecte avec son pseudo', async ({ page }) => {
    const pseudo = uniquePseudo('Coach')
    await signUpAdmin(page, pseudo)

    if (isPhone(page)) await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)

    await logIn(page, pseudo, ADMIN_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible()
  })
})

test.describe('navigation et thème', () => {
  test('élève : barre en bas sur téléphone, en haut sur ordinateur', async ({ page }) => {
    await signUpStudent(page, uniquePseudo('Nina'))

    const bar = page.getByRole('navigation', { name: 'Navigation principale' })
    for (const label of ['Tableau de bord', 'Mes quêtes', 'Leaderboard', 'Profil']) {
      await expect(bar.getByRole('link', { name: label })).toBeVisible()
    }
    const box = (await bar.boundingBox())!
    const viewport = page.viewportSize()!
    if (isPhone(page)) {
      expect(Math.round(box.y + box.height)).toBe(viewport.height)
    } else {
      expect(box.y).toBe(0)
    }

    // Chaque destination ouvre son écran et se signale comme la page en cours.
    await bar.getByRole('link', { name: 'Mes quêtes' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Mes quêtes' })).toBeVisible()
    await expect(bar.getByRole('link', { name: 'Mes quêtes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await bar.getByRole('link', { name: 'Leaderboard' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('admin : menu latéral sur ordinateur, menu repliable sur téléphone', async ({ page }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))
    const menu = page.getByRole('navigation', { name: 'Navigation de l’espace admin' })
    const menuButton = page.getByRole('button', { name: 'Menu' })

    if (isPhone(page)) {
      await expect(menu).toBeHidden()
      await menuButton.click()
      await expect(menu).toBeVisible()
      await menu.getByRole('link', { name: 'Paramètres' }).click()
      // Le menu se replie après le choix d'un écran.
      await expect(menu).toBeHidden()
    } else {
      await expect(menuButton).toBeHidden()
      const box = (await menu.boundingBox())!
      expect(box.x).toBeLessThan(260)
      await menu.getByRole('link', { name: 'Paramètres' }).click()
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('le thème suit la section 8 : fond clair, police ronde, dégradé sur le bouton principal', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/connexion')
    const submit = page.getByRole('button', { name: 'Se connecter' })
    await expect(submit).toBeVisible()

    const theme = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      const button = getComputedStyle(document.querySelector('button[type="submit"]')!)
      const input = getComputedStyle(document.querySelector('input')!)
      return {
        background: body.backgroundColor,
        text: body.color,
        font: body.fontFamily,
        buttonImage: button.backgroundImage,
        buttonText: button.color,
        inputFontSize: Number.parseFloat(input.fontSize),
      }
    })
    // L'interface reste claire même si l'appareil est réglé en mode sombre.
    expect(theme.background).toBe('rgb(245, 249, 255)')
    expect(theme.text).toBe('rgb(31, 42, 68)')
    expect(theme.font).toContain('Nunito')
    expect(theme.buttonImage).toContain('linear-gradient')
    expect(theme.buttonText).toBe('rgb(31, 42, 68)')
    // Champs en 16 px au minimum, pour éviter le zoom automatique sur iPhone.
    expect(theme.inputFontSize).toBeGreaterThanOrEqual(16)

    // La police est fournie avec le site, pas chargée depuis un service externe.
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Nunito Variable"')))
      .toBe(true)
    const external = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => new URL(entry.name).origin)
        .filter((origin) => origin !== window.location.origin),
    )
    expect(external).toEqual([])
  })

  test('les zones tactiles font au moins 44 px', async ({ page }) => {
    await signUpStudent(page, uniquePseudo('Lina'))
    await page.getByRole('link', { name: 'Profil' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Profil' })).toBeVisible()

    const tooSmall = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input, summary')]
        .map((element) => ({ element, box: element.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < 44)
        .map(({ element, box }) => `${element.tagName} « ${element.textContent} » ${box.height}px`),
    )
    expect(tooSmall).toEqual([])
  })
})
