import { expect, test, type Browser, type Page } from '@playwright/test'
import {
  acknowledgeCelebration,
  expectNoHorizontalScroll,
  openAdminScreen,
  openStudentScreen,
  publishQuest,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
  watchForProblems,
} from './helpers'

/** Un élève dans son propre navigateur, et un admin dans la page du test. */
async function studentAndAdmin(browser: Browser, page: Page) {
  const pseudo = uniquePseudo('Lea')
  const studentContext = await browser.newContext()
  const student = await studentContext.newPage()
  await signUpStudent(student, pseudo)
  await signUpAdmin(page, uniquePseudo('Coach'))
  return { pseudo, student, close: () => studentContext.close() }
}

/** Ouvre le formulaire d'une nouvelle quête et saisit son titre. */
async function startNewQuest(page: Page, title: string): Promise<void> {
  await openAdminScreen(page, 'Quêtes')
  await page.getByRole('link', { name: 'Nouvelle quête' }).click()
  await expect(page.getByRole('heading', { name: 'Nouvelle quête' })).toBeVisible()
  await page.getByLabel('Titre').fill(title)
}

/** Publie la quête en cours de saisie et attend sa fiche. */
async function publish(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Publier la quête' }).click()
  await expect(page.getByText('Quête publiée.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

/** L'élève ouvre une quête depuis « Mes quêtes ». */
async function openQuest(student: Page, title: string): Promise<void> {
  await student.goto('/quetes')
  await student.getByRole('link', { name: new RegExp(title) }).click()
  await expect(student.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

test.describe('parcours complet d’une quête', () => {
  test('l’admin crée et assigne une quête de maths, l’élève la réalise, l’XP est créditée', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, close } = await studentAndAdmin(browser, page)
    const title = `Tables ${uniquePseudo('q')}`

    // L'admin crée la quête : maths, réponses exactes, récompense pré-remplie.
    await startNewQuest(page, title)
    await page.getByLabel('Consigne').fill('Réponds **sans calculatrice**.')
    await page.getByLabel('Énoncé').fill('6 × 7 ?')
    await page.getByLabel('Réponses acceptées').fill('42')
    await page.getByRole('button', { name: 'Ajouter une question' }).click()
    await page.getByLabel('Énoncé').nth(1).fill('La moitié de 7 ?')
    await page.getByLabel('Réponses acceptées').nth(1).fill('3,5 ; 7/2')
    await expect(page.getByLabel('Récompense (en XP)')).toHaveValue('100')
    await publish(page, title)
    const row = page.getByRole('listitem').filter({ hasText: pseudo })
    await expect(row).toContainText('À faire')

    // L'élève la voit aussitôt, avec sa catégorie et sa récompense.
    await student.goto('/quetes')
    const card = student.getByRole('link', { name: new RegExp(title) })
    await expect(card).toContainText('Maths')
    await expect(card).toContainText('100\u00A0XP')
    await card.click()
    await expect(student.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(student.getByText('sans calculatrice')).toBeVisible()

    // Première tentative : une erreur. Le verdict s'affiche, pas la bonne réponse.
    await student.getByLabel('1. 6 × 7 ?').fill('42')
    await student.getByLabel('2. La moitié de 7 ?').fill('4')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    await expect(student.getByText('Tu as 50\u00A0% de bonnes réponses')).toBeVisible()
    await expect(student.getByText('Juste', { exact: true })).toBeVisible()
    await expect(student.getByText('À revoir', { exact: true })).toBeVisible()
    await expect(student.getByText('3,5')).toHaveCount(0)

    // Deuxième tentative : la quête est validée et l'XP créditée, sans recharger la page.
    await student.getByLabel('2. La moitié de 7 ?').fill('3.5')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    // L'annonce fête la validation, le passage au niveau 2 et le premier badge.
    await acknowledgeCelebration(student, [
      '+100\u00A0XP',
      /Niveau 2/,
      'Nouveau badge\u00A0: Premier pas',
    ])
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    await expect(student.getByText('+100\u00A0XP')).toBeVisible()
    await expect(student.getByText('Réponses acceptées')).toBeVisible()

    // Elle passe dans les quêtes terminées.
    await student.getByRole('link', { name: 'Retour à mes quêtes' }).click()
    await student.getByRole('link', { name: /Terminées/ }).click()
    await expect(student.getByRole('link', { name: new RegExp(title) })).toContainText(
      '+100\u00A0XP',
    )

    // L'admin voit l'avancement.
    await page.reload()
    await expect(page.getByRole('listitem').filter({ hasText: pseudo })).toContainText('Validée')
    await expect(page.getByRole('listitem').filter({ hasText: pseudo })).toContainText(
      '+100\u00A0XP',
    )
    await close()
  })

  test('QCM : une ou plusieurs réponses par question, bonus sans faute dès le premier essai', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Capitales ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByRole('radio', { name: 'Mémorisation', exact: true }).check()
    await page.getByRole('radio', { name: /^QCM/ }).check()
    await page.getByLabel('Énoncé').fill('Capitale de l’Italie ?')
    await page.getByLabel('Question 1, texte du choix 1').fill('Milan')
    await page.getByLabel('Question 1, texte du choix 2').fill('Rome')
    await page.getByLabel('Question 1, le choix 2 est une bonne réponse').check()
    await page.getByRole('button', { name: 'Ajouter une question' }).click()
    await page.getByLabel('Énoncé').nth(1).fill('Quelles villes sont en France ?')
    await page.getByLabel('Question 2, texte du choix 1').fill('Lyon')
    await page.getByLabel('Question 2, texte du choix 2').fill('Turin')
    await page.getByLabel('Question 2, texte du choix 3').fill('Lille')
    await page.getByLabel('Question 2, le choix 1 est une bonne réponse').check()
    await page.getByLabel('Question 2, le choix 3 est une bonne réponse').check()
    await page.getByRole('radio', { name: /Facile/ }).check()
    await expect(page.getByLabel('Récompense (en XP)')).toHaveValue('50')
    await publish(page, title)

    await openQuest(student, title)
    await student.getByRole('radio', { name: 'Rome' }).check()
    await expect(student.getByText('Plusieurs réponses possibles.')).toBeVisible()
    await student.getByRole('checkbox', { name: 'Lyon' }).check()
    await student.getByRole('checkbox', { name: 'Lille' }).check()
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()

    await acknowledgeCelebration(student, ['+55\u00A0XP'])
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    await expect(student.getByText('+55\u00A0XP')).toBeVisible()
    await expect(student.getByText('Bonus sans faute')).toBeVisible()
    await close()
  })

  test('cartes de mémorisation : l’élève parcourt les cartes puis passe le test', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Dates ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByRole('radio', { name: 'Mémorisation', exact: true }).check()
    // Sur une quête neuve, le format suit la catégorie : cartes de mémorisation.
    await expect(page.getByRole('radio', { name: /^Cartes de mémorisation/ })).toBeChecked()
    const cards = [
      ['Prise de la Bastille', '1789'],
      ['Chute du mur de Berlin', '1989'],
      ['Premier pas sur la Lune', '1969'],
    ] as const
    await page.getByRole('button', { name: 'Ajouter une carte' }).click()
    for (const [index, [front, back]] of cards.entries()) {
      await page.getByLabel('Question (recto)').nth(index).fill(front)
      await page.getByLabel('Réponse (verso)').nth(index).fill(back)
    }
    await publish(page, title)

    await openQuest(student, title)
    await expect(student.getByText('Carte 1 sur 3')).toBeVisible()
    const face = student.getByRole('button', { name: /Touche la carte/ })
    await expect(face).toContainText('Prise de la Bastille')
    await face.click()
    await expect(face).toContainText('1789')
    await student.getByRole('button', { name: 'Suivante' }).click()
    await expect(face).toContainText('Chute du mur de Berlin')

    await student.getByRole('button', { name: 'Passer le test' }).click()
    for (const [front, back] of cards) {
      await student
        .getByRole('group', { name: new RegExp(front) })
        .getByRole('radio', { name: back })
        .check()
    }
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()

    await acknowledgeCelebration(student)
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    await close()
  })

  test('déclaratif : « C’est fait » valide aussitôt la quête de sport', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Courir ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByRole('radio', { name: 'Sport', exact: true }).check()
    await expect(page.getByRole('radio', { name: /^Déclaratif/ })).toBeChecked()
    await expect(page.getByRole('radio', { name: /^Immédiate/ })).toBeChecked()
    await page.getByLabel('Consigne').fill('Cours 20 minutes sans t’arrêter.')
    await publish(page, title)

    await openQuest(student, title)
    await student.getByLabel('Un commentaire').fill('22 minutes, 3 km')
    await student.getByRole('button', { name: 'C’est fait' }).click()

    await acknowledgeCelebration(student)
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    await expect(student.getByText('22 minutes, 3 km')).toBeVisible()
    await close()
  })

  test('réponse libre : soumise, refusée avec un commentaire, reprise puis validée par l’admin', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, close } = await studentAndAdmin(browser, page)
    const title = `Résumé ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByRole('radio', { name: 'Autre', exact: true }).check()
    await expect(page.getByRole('radio', { name: /^Réponse libre/ })).toBeChecked()
    await page.getByLabel('Consigne').fill('Résume le chapitre en cinq lignes.')
    await publish(page, title)

    // L'élève envoie sa réponse : elle attend la validation, sans XP pour l'instant.
    await openQuest(student, title)
    await student.getByLabel('Ta réponse').fill('Trop court.')
    await student.getByRole('button', { name: 'Envoyer ma réponse' }).click()
    await expect(student.getByText('Réponse envoyée')).toBeVisible()
    await expect(student.getByText('Soumise', { exact: true })).toBeVisible()

    // L'admin la trouve dans la file de validation et la refuse avec un commentaire.
    await openAdminScreen(page, 'Validations')
    const entry = page.getByRole('listitem').filter({ hasText: pseudo })
    await expect(entry).toContainText('Trop court.')
    await entry.getByRole('button', { name: /Refuser/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Refuser et demander de recommencer' }).click()
    await expect(dialog.getByText('Expliquez à l’élève ce qu’il doit reprendre.')).toBeVisible()
    await dialog.getByLabel('Commentaire pour l’élève').fill('Développe davantage.')
    await dialog.getByRole('button', { name: 'Refuser et demander de recommencer' }).click()
    await expect(page.getByText(`Réalisation de ${pseudo} refusée`)).toBeVisible()
    // Sa réalisation quitte la file (d'autres parcours peuvent y avoir les leurs).
    await expect(page.getByRole('listitem').filter({ hasText: pseudo })).toHaveCount(0)

    // L'élève lit le commentaire et recommence.
    await student.reload()
    await expect(student.getByRole('heading', { name: 'À reprendre' })).toBeVisible()
    await expect(student.getByText('Développe davantage.')).toBeVisible()
    await student.getByLabel('Ta réponse').fill('Une réponse bien plus développée, en cinq lignes.')
    await student.getByRole('button', { name: 'Envoyer ma réponse' }).click()
    await expect(student.getByText('Réponse envoyée')).toBeVisible()

    // L'admin valide : l'XP est créditée à ce moment-là.
    await page.reload()
    await page
      .getByRole('listitem')
      .filter({ hasText: pseudo })
      .getByRole('button', { name: /Valider/ })
      .click()
    await expect(
      page.getByText(`Réalisation de ${pseudo} validée\u00A0: +100\u00A0XP.`),
    ).toBeVisible()

    // À son retour, l'élève découvre la validation faite en son absence.
    await student.reload()
    await acknowledgeCelebration(student, ['+100\u00A0XP'])
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    await expect(student.getByText('+100\u00A0XP')).toBeVisible()
    await close()
  })
})

test.describe('brouillons et formulaire de quête', () => {
  test('un brouillon incomplet s’enregistre, reste invisible pour l’élève, puis se complète', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Brouillon ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
    await expect(page.getByText('Brouillon enregistré.')).toBeVisible()
    await expect(page.getByText('Brouillon', { exact: true })).toBeVisible()

    await student.goto('/quetes')
    await expect(student.getByRole('heading', { level: 1, name: 'Mes quêtes' })).toBeVisible()
    await expect(student.getByRole('link', { name: new RegExp(title) })).toHaveCount(0)

    // Publier depuis la fiche : la quête est incomplète, l'admin est renvoyé au formulaire.
    await page.getByRole('button', { name: 'Publier la quête' }).click()
    await expect(page.getByText('La quête ne peut pas encore être publiée')).toBeVisible()
    await page.getByRole('link', { name: 'Ouvrir la quête pour la compléter' }).click()
    await page.getByRole('button', { name: 'Publier la quête' }).click()
    await expect(page.getByText('Énoncé requis.')).toBeVisible()
    await expect(page.getByText('Indiquez au moins une réponse attendue.')).toBeVisible()
    await expect(page.getByText('2 points sont à corriger avant d’enregistrer.')).toBeVisible()

    await page.getByLabel('Énoncé').fill('2 + 2 ?')
    await page.getByLabel('Réponses acceptées').fill('4')
    await publish(page, title)

    await student.reload()
    await expect(student.getByRole('link', { name: new RegExp(title) })).toBeVisible()
    await close()
  })

  test('une quête se donne à un seul élève, puis à un autre depuis sa fiche', async ({
    browser,
    page,
  }) => {
    const first = uniquePseudo('Lea')
    const second = uniquePseudo('Tom')
    const firstContext = await browser.newContext()
    const secondContext = await browser.newContext()
    const firstStudent = await firstContext.newPage()
    const secondStudent = await secondContext.newPage()
    await signUpStudent(firstStudent, first)
    await signUpStudent(secondStudent, second)
    await signUpAdmin(page, uniquePseudo('Coach'))
    const title = `Solo ${uniquePseudo('q')}`

    await startNewQuest(page, title)
    await page.getByLabel('Énoncé').fill('1 + 1 ?')
    await page.getByLabel('Réponses acceptées').fill('2')
    await page.getByRole('radio', { name: 'Choisir les élèves' }).check()
    await page.getByLabel('Rechercher un élève').fill(first)
    await page.getByRole('checkbox', { name: new RegExp(first) }).check()
    await expect(page.getByText('1 élève choisi.')).toBeVisible()
    await publish(page, title)

    await firstStudent.goto('/quetes')
    await expect(firstStudent.getByRole('link', { name: new RegExp(title) })).toBeVisible()
    await secondStudent.goto('/quetes')
    await expect(secondStudent.getByRole('link', { name: new RegExp(title) })).toHaveCount(0)

    await page.getByRole('button', { name: 'Ajouter des élèves' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: 'Choisir les élèves' }).check()
    await dialog.getByLabel('Rechercher un élève').fill(second)
    await dialog.getByRole('checkbox', { name: new RegExp(second) }).check()
    await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click()
    await expect(page.getByText('Un élève ajouté.')).toBeVisible()

    await secondStudent.reload()
    await expect(secondStudent.getByRole('link', { name: new RegExp(title) })).toBeVisible()
    await firstContext.close()
    await secondContext.close()
  })

  test('une image accompagne la consigne et n’est montrée qu’aux élèves de la quête', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    // L'image passe par le navigateur (lecture, réduction, aperçu) sans enfreindre la politique
    // de sécurité du contenu.
    const problems = [...[watchForProblems(page), watchForProblems(student)]]
    const title = `Carte ${uniquePseudo('q')}`
    // Un PNG d'un pixel : le navigateur le réduit et le convertit avant l'envoi.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    )

    await startNewQuest(page, title)
    await page.getByRole('radio', { name: 'Sport', exact: true }).check()
    await page.getByLabel('Consigne').fill('Observe l’image, puis fais le parcours.')
    await page
      .getByLabel('Choisir une image')
      .setInputFiles({ name: 'parcours.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByRole('img', { name: 'Image de la consigne' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retirer l’image' })).toBeVisible()
    await publish(page, title)

    const loaded = (image: ReturnType<Page['getByRole']>) =>
      image.evaluate((element) => {
        const img = element as HTMLImageElement
        return img.complete && img.naturalWidth > 0
      })
    const adminImage = page.getByRole('img', { name: 'Image de la consigne' })
    await expect(adminImage).toBeVisible()
    await expect.poll(() => loaded(adminImage)).toBe(true)

    await openQuest(student, title)
    const studentImage = student.getByRole('img', { name: 'Image de la consigne' })
    await expect(studentImage).toBeVisible()
    await expect.poll(() => loaded(studentImage)).toBe(true)
    const address = await studentImage.getAttribute('src')
    expect(address).toMatch(/^\/api\/quests\/[0-9a-f-]+\/image\?v=/)

    // Un visiteur sans compte ne peut pas lire l'image, même en connaissant son adresse.
    const visitor = await browser.newContext()
    const response = await visitor.request.get(address!)
    expect(response.status()).toBe(401)
    expect(problems.flat()).toEqual([])
    await visitor.close()
    await close()
  })

  test('une quête se duplique en brouillon et s’archive', async ({ browser, page }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Modèle ${uniquePseudo('q')}`
    const quest = await publishQuest(page, {
      title,
      items: [{ prompt: '3 × 3 ?', answers: ['9'] }],
    })

    await page.goto(`/admin/quetes/${quest.id}`)
    await page.getByRole('button', { name: 'Dupliquer' }).click()
    await expect(page.getByRole('heading', { name: 'Modifier la quête' })).toBeVisible()
    await expect(page.getByLabel('Titre')).toHaveValue(`${title} (copie)`)
    await expect(page.getByLabel('Énoncé')).toHaveValue('3 × 3 ?')

    await page.goto(`/admin/quetes/${quest.id}`)
    await page.getByRole('button', { name: 'Archiver' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archiver' }).click()
    await expect(page.getByText('Quête archivée.')).toBeVisible()
    await student.goto('/quetes')
    await expect(student.getByRole('link', { name: new RegExp(`${title}$`) })).toHaveCount(0)

    // Les quêtes archivées quittent la liste active de l'admin, et se retrouvent par le filtre.
    await openAdminScreen(page, 'Quêtes')
    await expect(page.getByRole('link', { name: new RegExp(`${title} \\(copie\\)`) })).toBeVisible()
    await page.getByLabel('État').selectOption('archived')
    await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(1)
    await close()
  })
})

test.describe('deadline et expiration', () => {
  test('le compte à rebours passe à l’orange sous 24 h et au rose sous 3 h, avec une autre formule', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const inHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    const item = [{ prompt: '1 + 1 ?', answers: ['2'] }]
    const calm = `Lointaine ${uniquePseudo('q')}`
    const soon = `Proche ${uniquePseudo('q')}`
    const urgent = `Pressante ${uniquePseudo('q')}`
    await publishQuest(page, { title: calm, items: item, deadlineAt: inHours(50) })
    await publishQuest(page, { title: soon, items: item, deadlineAt: inHours(20) })
    await publishQuest(page, { title: urgent, items: item, deadlineAt: inHours(2) })

    await student.goto('/quetes')
    const chip = (title: string, text: RegExp) =>
      student.getByRole('link', { name: new RegExp(title) }).getByText(text)
    const background = (title: string, text: RegExp) =>
      chip(title, text).evaluate(
        (element) => getComputedStyle(element.parentElement!).backgroundColor,
      )

    await expect(chip(calm, /^Encore 2\u00A0j/)).toBeVisible()
    await expect(chip(soon, /^Plus que 19\u00A0h/)).toBeVisible()
    await expect(chip(urgent, /^Urgent\u00A0: plus que 1\u00A0h/)).toBeVisible()
    // Orange pastel #FFE8CC, rose pastel #FFDDE1.
    expect(await background(soon, /^Plus que/)).toBe('rgb(255, 232, 204)')
    expect(await background(urgent, /^Urgent/)).toBe('rgb(255, 221, 225)')

    // Les quêtes à faire sont triées par deadline la plus proche.
    const titles = await student.getByRole('main').getByRole('link').allTextContents()
    const position = (title: string) => titles.findIndex((text) => text.includes(title))
    expect(position(urgent)).toBeLessThan(position(soon))
    expect(position(soon)).toBeLessThan(position(calm))
    await close()
  })

  test('une quête non terminée à la deadline passe en Expirée et ne rapporte rien', async ({
    browser,
    page,
  }) => {
    const { pseudo, student, close } = await studentAndAdmin(browser, page)
    const title = `Éclair ${uniquePseudo('q')}`
    const quest = await publishQuest(page, {
      title,
      items: [{ prompt: '1 + 1 ?', answers: ['2'] }],
      deadlineAt: new Date(Date.now() + 4000).toISOString(),
    })

    await openQuest(student, title)
    await student.getByLabel('1. 1 + 1 ?').fill('2')
    // La deadline passe pendant que l'élève a la quête sous les yeux.
    await student.waitForTimeout(4500)
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    // Le serveur refuse la réponse tardive ; l'écran passe aussitôt à l'état expiré.
    await expect(student.getByText('Deadline dépassée', { exact: true }).last()).toBeVisible()
    await expect(
      student.getByText('Cette quête est expirée et ne rapporte plus d’XP.'),
    ).toBeVisible()
    await expect(student.getByRole('button', { name: 'Valider mes réponses' })).toHaveCount(0)

    await student.goto('/quetes?onglet=expired')
    await expect(student.getByRole('link', { name: new RegExp(title) })).toContainText('Expirée')
    await student.getByRole('link', { name: new RegExp(title) }).click()
    await expect(
      student.getByText('Cette quête est expirée et ne rapporte plus d’XP.'),
    ).toBeVisible()

    // L'admin peut la rouvrir pour cet élève.
    await page.goto(`/admin/quetes/${quest.id}`)
    const row = page.getByRole('listitem').filter({ hasText: pseudo })
    await expect(row).toContainText('Expirée')
    await row.getByRole('button', { name: /Rouvrir/ }).click()
    await expect(page.getByText(`Quête rouverte pour ${pseudo}.`)).toBeVisible()

    await student.reload()
    await student.getByLabel('1. 1 + 1 ?').fill('2')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    await acknowledgeCelebration(student)
    await expect(student.getByRole('heading', { name: 'Quête validée' })).toBeVisible()
    // Moitié de la récompense, plus le bonus sans faute sur cette moitié.
    await expect(student.getByText('+55\u00A0XP')).toBeVisible()
    await expect(student.getByText('Récompense, quête rendue en retard')).toBeVisible()
    await close()
  })
})

test.describe('droits et mise en page des quêtes', () => {
  test('un élève ne peut pas ouvrir la quête d’un autre', async ({ browser, page }) => {
    const { pseudo, student, close } = await studentAndAdmin(browser, page)
    const otherContext = await browser.newContext()
    const other = await otherContext.newPage()
    await signUpStudent(other, uniquePseudo('Tom'))
    const students = (await (await page.request.get('/api/admin/students')).json()) as {
      students: { id: string; pseudo: string }[]
    }
    const owner = students.students.find((candidate) => candidate.pseudo === pseudo)!
    const quest = await publishQuest(page, {
      title: `Privée ${uniquePseudo('q')}`,
      items: [{ prompt: 'Secret ?', answers: ['oui'] }],
      assignees: [owner.id],
    })

    await other.goto(`/quetes/${quest.id}`)
    await expect(other.getByRole('heading', { name: 'Quête introuvable' })).toBeVisible()
    const response = await other.request.get(`/api/quests/${quest.id}`)
    expect(response.status()).toBe(404)

    await student.goto(`/quetes/${quest.id}`)
    await expect(student.getByLabel('1. Secret ?')).toBeVisible()
    await otherContext.close()
    await close()
  })

  test('les écrans de quêtes tiennent dans la largeur, sur téléphone comme sur ordinateur', async ({
    browser,
    page,
  }) => {
    const { student, close } = await studentAndAdmin(browser, page)
    const title = `Une quête au titre plutôt long pour tester la mise en page ${uniquePseudo('q')}`
    const quest = await publishQuest(page, {
      title,
      instructions:
        'Une consigne avec un lien https://exemple.fr/une/adresse/tres/longue/qui/ne/doit/pas/deborder',
      items: [
        {
          prompt: 'Une question assez longue pour passer à la ligne sur un téléphone ?',
          answers: ['oui'],
        },
      ],
      deadlineAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })

    for (const path of ['/admin/quetes', '/admin/quetes/nouvelle', `/admin/quetes/${quest.id}`]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoHorizontalScroll(page)
    }
    await openAdminScreen(page, 'Validations')
    await expectNoHorizontalScroll(page)

    await student.setViewportSize(page.viewportSize()!)
    for (const path of ['/', '/quetes', `/quetes/${quest.id}`]) {
      await student.goto(path)
      await expect(student.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(student.getByText(title).first()).toBeVisible()
      await expectNoHorizontalScroll(student)
    }
    await openStudentScreen(student, 'Tableau de bord')
    await expect(student.getByRole('heading', { name: 'Quêtes à faire' })).toBeVisible()
    await close()
  })
})
