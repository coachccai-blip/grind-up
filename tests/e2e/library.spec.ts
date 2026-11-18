import { expect, test, type Page } from '@playwright/test'
import {
  acknowledgeCelebration,
  expectNoHorizontalScroll,
  openAdminScreen,
  openStudentScreen,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
  watchForProblems,
} from './helpers'

/**
 * Bibliothèque d'exercices et corrections détaillées (version 1.1) : l'admin
 * reprend un exercice prêt à l'emploi dans une quête, la donne à un élève, et
 * l'élève lit la correction de chaque question une fois la quête validée.
 */

/** Les bonnes réponses de l'exercice « Identités remarquables : cas simples », dans l'ordre. */
const RIGHT_ANSWERS = [
  'x² + 6x + 9',
  'x² − 10x + 25',
  'x² − 16',
  '(x + 5)²',
  '(x − 3)²',
  '(x + 7)(x − 7)',
]

/** Coche un choix d'une question de QCM, désignée par son numéro. */
async function choose(student: Page, question: number, choice: string): Promise<void> {
  await student
    .getByRole('group', { name: new RegExp(`^${question}\\. `) })
    .getByRole('radio', { name: choice, exact: true })
    .check()
}

const corrections = (page: Page) => page.locator('summary', { hasText: 'Correction détaillée' })

test('parcours complet d’un exercice de la bibliothèque : repris dans une quête, donné à un élève, corrigé en détail', async ({
  browser,
  page,
}) => {
  test.slow()
  const problems = watchForProblems(page)
  const pseudo = uniquePseudo('Nora')
  const title = `Identités ${uniquePseudo('q')}`
  const identifier = await signUpStudent(page, pseudo)

  const adminContext = await browser.newContext({ viewport: page.viewportSize() })
  const admin = await adminContext.newPage()
  const adminProblems = watchForProblems(admin)
  await signUpAdmin(admin, uniquePseudo('Coach'))

  // 1. L'admin ouvre la bibliothèque depuis ses quêtes et choisit l'exercice.
  await openAdminScreen(admin, 'Quêtes')
  await admin.getByRole('link', { name: 'Bibliothèque', exact: true }).click()
  await expect(admin.getByRole('heading', { level: 1, name: 'Bibliothèque' })).toBeVisible()
  await expect(admin).toHaveTitle('Bibliothèque · Grind up')
  // Les exercices sont rangés par thème du programme.
  await expect(admin.getByRole('heading', { level: 2, name: 'Calcul littéral' })).toBeVisible()
  await expect(admin.getByRole('heading', { level: 2, name: 'Géométrie plane' })).toBeVisible()
  const card = admin.getByRole('listitem').filter({ hasText: 'cas simples' })
  await expect(card.getByRole('heading', { level: 3 })).toHaveText(
    'Identités remarquables : cas simples',
  )
  await expect(card.getByText('QCM · 6 questions')).toBeVisible()
  await expect(card.getByText('3e', { exact: true })).toBeVisible()
  await expect(card.getByText('Facile', { exact: true })).toBeVisible()
  await expectNoHorizontalScroll(admin)

  // Un thème ou quelques lettres suffisent à retrouver un exercice, accents ou non.
  await admin.getByLabel('Thème').selectOption({ label: 'Géométrie plane' })
  await expect(card).toHaveCount(0)
  await expect(admin.getByRole('heading', { level: 3, name: /Pythagore/ })).toBeVisible()
  await admin.getByLabel('Thème').selectOption({ label: 'Tous les thèmes' })
  await admin.getByLabel('Rechercher un exercice').fill('identites remarquables')
  await expect(admin.getByText(/^2 sur \d+ exercices$/)).toBeVisible()
  await expect(admin.getByRole('heading', { level: 3 })).toHaveCount(2)
  await expect(admin.getByRole('heading', { level: 2, name: 'Géométrie plane' })).toHaveCount(0)
  await admin.getByLabel('Rechercher un exercice').fill('zzz')
  await expect(admin.getByText('Aucun exercice ne correspond à cette recherche.')).toBeVisible()
  await admin.getByLabel('Rechercher un exercice').fill('')
  await admin
    .getByRole('link', { name: 'Utiliser cet exercice : Identités remarquables : cas simples' })
    .click()

  // 2. Une nouvelle quête s'ouvre, déjà remplie : rappel du cours, exemple expliqué, questions,
  //    corrections, difficulté, récompense.
  await expect(admin.getByRole('heading', { level: 1, name: 'Nouvelle quête' })).toBeVisible()
  await expect(admin.getByText(/Cette quête reprend l’exercice/)).toBeVisible()
  await expect(admin.getByLabel('Titre')).toHaveValue(/^Identités remarquables\s: cas simples$/)
  await expect(admin.getByLabel('Rappel du cours')).toHaveValue(/double produit/)
  await expect(admin.getByLabel('Exemple expliqué')).toHaveValue(/Énoncé/)
  await expect(admin.getByLabel('Consigne')).toHaveValue(/une seule est juste par question/)
  await expect(admin.getByRole('radio', { name: /^QCM/ })).toBeChecked()
  await expect(admin.getByRole('radio', { name: 'Maths', exact: true })).toBeChecked()
  await expect(admin.getByRole('radio', { name: /Facile/ })).toBeChecked()
  await expect(admin.getByLabel('Récompense (en XP)')).toHaveValue('50')
  await expect(admin.getByRole('heading', { name: 'Question 6' })).toBeVisible()
  await expect(admin.getByRole('heading', { name: 'Question 7' })).toHaveCount(0)
  await expect(admin.getByLabel('Énoncé').first()).toHaveValue(/^Développe et réduis A = /)
  await expect(admin.getByLabel('Question 1, le choix 2 est une bonne réponse')).toBeChecked()
  await expect(admin.getByLabel('Texte de la correction').first()).toHaveValue(/Les pièges/)
  await expectNoHorizontalScroll(admin)

  // Tout reste modifiable : le titre change, la quête est donnée à cet élève seulement.
  await admin.getByLabel('Titre').fill(title)
  await admin.getByRole('radio', { name: 'Choisir les élèves' }).check()
  await admin.getByLabel('Rechercher un élève').fill(identifier)
  await admin.getByRole('checkbox', { name: new RegExp(pseudo) }).check()
  await expect(admin.getByText('1 élève choisi.')).toBeVisible()
  await admin.getByRole('button', { name: 'Publier la quête' }).click()
  await expect(admin.getByText('Quête publiée.')).toBeVisible()
  await expect(admin.getByRole('heading', { level: 1, name: title })).toBeVisible()

  // La fiche de la quête montre le rappel, l'exemple, chaque question, sa bonne réponse et sa correction.
  await expect(admin.getByRole('heading', { level: 2, name: 'Rappel du cours' })).toBeVisible()
  await expect(admin.getByRole('heading', { level: 2, name: 'Exemple expliqué' })).toBeVisible()
  await expect(corrections(admin)).toHaveCount(6)
  await corrections(admin).first().click()
  await expect(admin.getByText('On reconnaît le carré d’une somme')).toBeVisible()
  await expect(admin.getByRole('listitem').filter({ hasText: pseudo })).toContainText('À faire')

  // 3. L'élève reçoit la quête : d'abord le rappel du cours, puis l'exemple expliqué, puis les
  //    questions. Avant d'avoir répondu, aucune correction n'est à sa portée.
  await openStudentScreen(page, 'Mes quêtes')
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.getByText('50\u00A0XP')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Rappel du cours',
    'Exemple expliqué',
    'Consigne',
  ])
  await expect(page.getByText('Le terme 2ab s’appelle le double produit.')).toBeVisible()
  await expect(page.getByText('Factorise Q = x² − 16x + 64.')).toBeVisible()
  await expect(page.getByRole('radio')).toHaveCount(24)
  await expect(corrections(page)).toHaveCount(0)
  await expect(page.getByText('Les pièges')).toHaveCount(0)
  await expectNoHorizontalScroll(page)

  // Il se trompe à la troisième question : cinq réponses justes sur six suffisent pour valider.
  for (const [index, answer] of RIGHT_ANSWERS.entries()) {
    await choose(page, index + 1, index === 2 ? 'x² + 16' : answer)
  }
  await page.getByRole('button', { name: 'Valider mes réponses' }).click()
  await acknowledgeCelebration(page, ['Quête validée', '+50\u00A0XP'])

  // 4. Le résultat est ramené à l'écran, et chaque question a sa correction détaillée.
  const validated = page.locator('#contenu').getByRole('heading', { name: 'Quête validée' })
  await expect(validated).toBeInViewport()
  await expect(corrections(page)).toHaveCount(6)
  // Celle de la réponse à revoir est déjà ouverte : elle dit quelle erreur a été commise.
  const third = page.getByRole('group', { name: /^3\. / })
  await expect(third.getByText('À revoir')).toBeVisible()
  await expect(third.getByText('Bonne réponse')).toContainText('x² − 16')
  await expect(page.locator('details[open]')).toHaveCount(1)
  await expect(third.getByText('le résultat est une différence de deux carrés')).toBeVisible()
  // Les autres se déplient à la demande.
  const first = page.getByRole('group', { name: /^1\. / })
  await expect(first.getByText('Juste')).toBeVisible()
  await expect(first.getByText('On reconnaît le carré d’une somme')).toBeHidden()
  await first.locator('summary').click()
  await expect(first.getByText('On reconnaît le carré d’une somme')).toBeVisible()
  await expect(first.getByText('Vérification')).toBeVisible()
  await expectNoHorizontalScroll(page)

  // L'admin voit la quête validée.
  await admin.reload()
  await expect(admin.getByRole('listitem').filter({ hasText: pseudo })).toContainText('Validée')

  expect(problems).toEqual([])
  expect(adminProblems).toEqual([])
  await adminContext.close()
})

test.describe('correction détaillée d’une question', () => {
  test('l’admin l’écrit dans le formulaire ; l’élève ne la lit qu’une fois la quête validée', async ({
    browser,
    page,
  }) => {
    const studentContext = await browser.newContext({ viewport: page.viewportSize() })
    const student = await studentContext.newPage()
    await signUpStudent(student, uniquePseudo('Sam'))
    await signUpAdmin(page, uniquePseudo('Coach'))
    const title = `Carrés ${uniquePseudo('q')}`

    await openAdminScreen(page, 'Quêtes')
    await page.getByRole('link', { name: 'Nouvelle quête' }).click()
    await page.getByLabel('Titre').fill(title)
    await page.getByLabel('Énoncé').fill('Combien font 12² ?')
    await page.getByLabel('Réponses acceptées').fill('144')
    // La correction est facultative : sa zone est repliée tant qu'elle est vide.
    await expect(page.getByLabel('Texte de la correction')).toBeHidden()
    await page.getByText('Correction détaillée', { exact: true }).click()
    await page
      .getByLabel('Texte de la correction')
      .fill('**12² = 12 × 12**\nOn pose la multiplication : 12 × 12 = 144.')
    await page.getByRole('button', { name: 'Publier la quête' }).click()
    await expect(page.getByText('Quête publiée.')).toBeVisible()

    // Sur la fiche, la correction est mise en forme : le calcul en gras, sans astérisques.
    await corrections(page).click()
    await expect(page.getByText('12² = 12 × 12', { exact: true })).toBeVisible()
    await expect(page.getByText('**')).toHaveCount(0)
    // De retour dans le formulaire, la zone d'une correction déjà écrite est ouverte.
    await page.getByRole('link', { name: 'Modifier' }).click()
    await expect(page.getByLabel('Texte de la correction')).toBeVisible()
    await expect(page.getByLabel('Texte de la correction')).toHaveValue(/^\*\*12² = 12 × 12\*\*/)

    await student.goto('/quetes')
    await student.getByRole('link', { name: new RegExp(title) }).click()
    await student.getByLabel(/Combien font 12²/).fill('124')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    // Réponse fausse : le verdict, mais ni la bonne réponse ni sa correction.
    await expect(student.getByText('À revoir', { exact: true })).toBeVisible()
    await expect(student.getByText(/Tu as 0\s% de bonnes réponses/)).toBeInViewport()
    await expect(corrections(student)).toHaveCount(0)
    await expect(student.getByText('On pose la multiplication')).toHaveCount(0)

    await student.getByLabel(/Combien font 12²/).fill('144')
    await student.getByRole('button', { name: 'Valider mes réponses' }).click()
    await acknowledgeCelebration(student, ['Quête validée'])
    await expect(student.getByText('Réponse attendue')).toContainText('144')
    // Sa dernière réponse était juste : la correction attend d'être dépliée.
    await expect(student.getByText('On pose la multiplication')).toBeHidden()
    await corrections(student).click()
    await expect(student.getByText('On pose la multiplication : 12 × 12 = 144.')).toBeVisible()
    await studentContext.close()
  })

  test('un exercice inconnu de la bibliothèque est signalé, sans ouvrir de formulaire', async ({
    page,
  }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))

    await page.goto('/admin/quetes/nouvelle?modele=exercice-inconnu')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Exercice introuvable' }),
    ).toBeVisible()
    await expect(page.getByLabel('Titre')).toHaveCount(0)
    await page.getByRole('link', { name: 'Retour à la bibliothèque' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Bibliothèque' })).toBeVisible()
  })

  test('un élève ne peut pas ouvrir la bibliothèque', async ({ page }) => {
    await signUpStudent(page, uniquePseudo('Zoe'))

    const list = await page.request.get('/api/admin/library')
    const exercise = await page.request.get('/api/admin/library/identites-remarquables-cas-simples')
    expect(list.status()).toBe(403)
    expect(exercise.status()).toBe(403)
    expect(await exercise.text()).not.toContain('Les pièges')
    // L'écran de l'admin le ramène à son tableau de bord.
    await page.goto('/admin/quetes/bibliotheque')
    await expect(page.getByRole('heading', { name: /^Bonjour/ })).toBeVisible()
  })
})
