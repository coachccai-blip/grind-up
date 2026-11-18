import { expect, test } from '@playwright/test'
import {
  expectNoHorizontalScroll,
  openAdminScreen,
  publishQuest,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

/**
 * Vue d'ensemble de l'admin : ce qui demande son attention. Les chiffres valent
 * pour tout le site ; chaque parcours ne vérifie que ce qu'il a lui-même créé.
 */
test.describe('vue d’ensemble de l’admin', () => {
  test('montre les réalisations à valider et les quêtes qui expirent dans les 48 h', async ({
    browser,
    page,
  }) => {
    const studentContext = await browser.newContext()
    const student = await studentContext.newPage()
    const pseudo = uniquePseudo('Lea')
    await signUpStudent(student, pseudo)
    await signUpAdmin(page, uniquePseudo('Coach'))
    const students = (await (await page.request.get('/api/admin/students')).json()) as {
      students: { id: string; pseudo: string }[]
    }
    const studentId = students.students.find((candidate) => candidate.pseudo === pseudo)!.id

    // Une quête qui expire dans deux heures, et une réponse libre soumise par l'élève.
    const urgent = `Sprint ${uniquePseudo('q')}`
    await publishQuest(page, {
      title: urgent,
      items: [{ prompt: '2 + 2 ?', answers: ['4'] }],
      deadlineAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      assignees: [studentId],
    })
    const essay = await publishQuest(page, {
      title: `Résumé ${uniquePseudo('q')}`,
      category: 'other',
      format: 'free_text',
      instructions: 'Résume le chapitre.',
      assignees: [studentId],
    })
    const sent = await student.request.post(`/api/quests/${essay.id}/attempts`, {
      data: { text: 'Mon résumé.' },
    })
    expect(sent.status()).toBe(200)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Vue d’ensemble' })).toBeVisible()

    // Les trois chiffres mènent chacun à leur écran.
    await expect(page.getByRole('link', { name: /Élèves? actifs?/ })).toHaveAttribute(
      'href',
      '/admin/eleves',
    )
    await expect(page.getByRole('link', { name: /Quêtes? en cours/ })).toHaveAttribute(
      'href',
      '/admin/quetes',
    )
    const toValidate = page.getByRole('link', { name: /Réalisations? à valider/ })
    await expect(toValidate).toHaveAttribute('href', '/admin/validations')
    expect(Number((await toValidate.textContent())?.match(/\d+/)?.[0])).toBeGreaterThanOrEqual(1)

    // La quête urgente figure parmi celles qui expirent, avec ce qu'il reste à faire.
    await expect(page.getByRole('heading', { name: /expire(nt)? dans les 48\sh/ })).toBeVisible()
    const row = page.getByRole('link', { name: new RegExp(urgent) })
    await expect(row).toContainText('Urgent\u00A0: plus que')
    await expect(row).toContainText('1 élève ne l’a pas terminée')
    await expect(page.getByRole('heading', { name: /inactifs? depuis 7 jours/ })).toBeVisible()
    await expectNoHorizontalScroll(page)

    // Le chiffre « à valider » mène à la file, où attend la réponse de l'élève.
    await toValidate.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Validations' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: pseudo })).toContainText(
      'Mon résumé.',
    )

    // De la vue d'ensemble, la quête qui expire s'ouvre d'un geste.
    await openAdminScreen(page, 'Vue d’ensemble')
    await page.getByRole('link', { name: new RegExp(urgent) }).click()
    await expect(page.getByRole('heading', { level: 1, name: urgent })).toBeVisible()
    await studentContext.close()
  })

  test('garde sous la main l’adresse d’inscription à transmettre aux élèves', async ({ page }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))

    await expect(page.getByRole('heading', { name: 'Inviter vos élèves' })).toBeVisible()
    await expect(page.getByText(/\/inscription$/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copier l’adresse' })).toBeVisible()
  })
})
