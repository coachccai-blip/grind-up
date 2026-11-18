import { expect, test, type Page } from '@playwright/test'
import {
  expectNoHorizontalScroll,
  openAdminScreen,
  openStudentScreen,
  signUpAdmin,
  signUpStudent,
  uniquePseudo,
} from './helpers'

/**
 * Paramètres de l'admin. Les réglages valent pour tout le site, et les parcours
 * tournent en parallèle sur la même base : pour ne pas se gêner, seul le dernier
 * parcours enregistre un vrai changement, sans effet sur l'XP des autres.
 */
async function openSettings(page: Page): Promise<void> {
  await openAdminScreen(page, 'Paramètres')
  await expect(page.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Barème d’XP' })).toBeVisible()
}

const ORIGINAL = {
  rewards: { easy: 50, medium: 100, hard: 200, epic: 400 },
  earlyBonusPercent: 10,
  flawlessBonusPercent: 10,
  latePercent: 50,
  defaultPassThreshold: 80,
  defaultMaxAttempts: 3,
}

test.describe('paramètres', () => {
  test('le formulaire montre le barème, signale une valeur illisible et remet les valeurs d’origine', async ({
    page,
  }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))
    // L'enregistrement est observé sans atteindre le serveur : rien ne change pour les autres parcours.
    const saved: unknown[] = []
    await page.route('**/api/admin/settings', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue()
      const body: unknown = route.request().postDataJSON()
      saved.push(body)
      await route.fulfill({ json: { settings: body } })
    })
    await openSettings(page)

    // Les valeurs du brief : 50, 100, 200 et 400 XP ; +10 %, +10 %, 50 % ; 80 %, 3 tentatives.
    await expect(page.getByLabel('Facile (en XP)')).toHaveValue('50')
    await expect(page.getByLabel('Épique (en XP)')).toHaveValue('400')
    await expect(page.getByLabel('Bonus d’avance (en %)')).toHaveValue('10')
    await expect(page.getByLabel('Quête rendue en retard (en %)')).toHaveValue('50')
    await expect(page.getByLabel('Seuil de réussite (en %)')).toHaveValue('80')
    await expect(page.getByLabel('Tentatives')).toHaveValue('3')
    await expectNoHorizontalScroll(page)

    // Une valeur illisible et une valeur hors limites : rien n'est envoyé, chaque champ dit pourquoi.
    await page.getByLabel('Facile (en XP)').fill('beaucoup')
    await page.getByLabel('Bonus sans faute (en %)').fill('150')
    await page.getByRole('button', { name: 'Enregistrer les paramètres' }).click()
    await expect(page.getByText('2 valeurs sont à corriger avant d’enregistrer.')).toBeVisible()
    await expect(page.getByText('Indiquez une récompense en XP.')).toBeVisible()
    await expect(page.getByText('De 0 à 100\u00A0%.')).toBeVisible()
    await expect(page.getByLabel('Facile (en XP)')).toBeFocused()
    expect(saved).toEqual([])

    // Les valeurs d'origine reviennent dans le formulaire ; elles ne valent qu'une fois enregistrées.
    await page.getByLabel('Moyen (en XP)').fill('120')
    await page.getByRole('button', { name: 'Remettre les valeurs d’origine' }).click()
    await expect(page.getByLabel('Facile (en XP)')).toHaveValue('50')
    await expect(page.getByLabel('Moyen (en XP)')).toHaveValue('100')
    await expect(page.getByLabel('Bonus sans faute (en %)')).toHaveValue('10')
    await expect(page.getByText('Enregistrez pour les appliquer.')).toBeVisible()

    await page.getByLabel('Difficile (en XP)').fill('250')
    await page.getByRole('button', { name: 'Enregistrer les paramètres' }).click()
    await expect(page.getByText('Paramètres enregistrés.')).toBeVisible()
    expect(saved).toEqual([
      { ...ORIGINAL, rewards: { ...ORIGINAL.rewards, hard: 250 }, showBotLabel: false },
    ])
  })

  test('le formulaire d’une quête et celui d’un bot suivent le barème des paramètres', async ({
    page,
  }) => {
    await signUpAdmin(page, uniquePseudo('Coach'))
    // Un barème propre à ce parcours, servi à la place de celui du serveur.
    await page.route('**/api/admin/settings', (route) =>
      route.fulfill({
        json: {
          settings: {
            ...ORIGINAL,
            rewards: { easy: 60, medium: 150, hard: 250, epic: 500 },
            defaultPassThreshold: 70,
            defaultMaxAttempts: 5,
            showBotLabel: false,
          },
        },
      }),
    )

    await page.goto('/admin/quetes/nouvelle')
    await expect(page.getByRole('heading', { name: 'Nouvelle quête' })).toBeVisible()
    // La récompense, le seuil et les tentatives sont pré-remplis d'après les paramètres.
    await expect(page.getByLabel('Récompense (en XP)')).toHaveValue('150')
    await expect(page.getByLabel('Seuil de réussite (en %)')).toHaveValue('70')
    await expect(page.getByLabel('Tentatives')).toHaveValue('5')
    await expect(page.getByRole('radio', { name: /Moyen.*150\sXP/ })).toBeChecked()
    // Changer de difficulté propose la récompense du barème.
    await page.getByRole('radio', { name: /Difficile.*250\sXP/ }).check()
    await expect(page.getByLabel('Récompense (en XP)')).toHaveValue('250')
    // Une récompense saisie à la main n'est plus remplacée.
    await page.getByLabel('Récompense (en XP)').fill('275')
    await page.getByRole('radio', { name: /Épique.*500\sXP/ }).check()
    await expect(page.getByLabel('Récompense (en XP)')).toHaveValue('275')

    await page.goto('/admin/bots/nouveau')
    await expect(page.getByRole('heading', { name: 'Nouveau bot' })).toBeVisible()
    await expect(page.getByLabel('Moyen (150\u00A0XP)')).toBeVisible()
    await expect(page.getByLabel('Épique (500\u00A0XP)')).toBeVisible()
  })

  test('l’admin télécharge ses données en CSV : élèves, quêtes, réalisations, journal d’XP', async ({
    browser,
    page,
  }) => {
    const studentContext = await browser.newContext()
    const pseudo = uniquePseudo('Lea')
    const identifier = await signUpStudent(await studentContext.newPage(), pseudo)
    await signUpAdmin(page, uniquePseudo('Coach'))
    await openSettings(page)

    const expected: [string, RegExp, string][] = [
      ['Élèves', /^grind-up-eleves-\d{4}-\d{2}-\d{2}\.csv$/, '"Pseudo";"Identifiant";"Compte"'],
      ['Quêtes', /^grind-up-quetes-\d{4}-\d{2}-\d{2}\.csv$/, '"Titre";"Catégorie";"Format"'],
      [
        'Réalisations',
        /^grind-up-realisations-\d{4}-\d{2}-\d{2}\.csv$/,
        '"Quête";"Élève";"Identifiant";"Statut"',
      ],
      [
        'Journal d’XP',
        /^grind-up-journal-xp-\d{4}-\d{2}-\d{2}\.csv$/,
        '"Date";"Participant";"Identifiant"',
      ],
    ]
    for (const [label, fileName, header] of expected) {
      const downloading = page.waitForEvent('download')
      await page.getByRole('link', { name: `Télécharger le fichier ${label}` }).click()
      const download = await downloading
      expect(download.suggestedFilename()).toMatch(fileName)
      const stream = await download.createReadStream()
      const chunks: Buffer[] = []
      for await (const chunk of stream) chunks.push(chunk as Buffer)
      const content = Buffer.concat(chunks)
      // UTF-8 signé : Excel reconnaît les accents.
      expect([...content.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
      const text = content.toString('utf8')
      expect(text).toContain(header)
      if (label === 'Élèves') expect(text).toContain(`"${pseudo}";"${identifier}";"Actif"`)
    }

    // Un élève ne peut rien exporter.
    const refused = await studentContext.request.get('/api/admin/export/students.csv')
    expect(refused.status()).toBe(403)
    await studentContext.close()
  })

  test('l’étiquette « Bot » n’est montrée aux élèves que si l’admin le décide', async ({
    browser,
    page,
  }, testInfo) => {
    // Ce réglage vaut pour tout le site : un seul des deux projets le manipule.
    test.skip(testInfo.project.name !== 'ordinateur', 'réglage global, testé une seule fois')
    const studentContext = await browser.newContext({ viewport: page.viewportSize() })
    const student = await studentContext.newPage()
    await signUpStudent(student, uniquePseudo('Lea'))
    await signUpAdmin(page, uniquePseudo('Coach'))
    const bot = uniquePseudo('Robo')
    const created = await page.request.post('/api/admin/bots', {
      data: { pseudo: bot, avatar: 'fox', mode: 'regular' },
    })
    expect(created.status()).toBe(201)
    const { bot: made } = (await created.json()) as { bot: { id: string } }
    await page.request.post(`/api/admin/bots/${made.id}/adjust`, { data: { missions: 1, xp: 50 } })

    try {
      await openStudentScreen(student, 'Leaderboard')
      const line = student.getByRole('listitem').filter({ hasText: bot })
      await expect(line).toBeVisible()
      await expect(line.getByText('Bot', { exact: true })).toHaveCount(0)

      // L'écran Bots rappelle le réglage et y mène.
      await openAdminScreen(page, 'Bots')
      await expect(page.getByText('Vos élèves ne voient pas l’étiquette « Bot ».')).toBeVisible()
      await page.getByRole('link', { name: 'Changer ce réglage' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeVisible()
      await page.getByLabel('Montrer l’étiquette « Bot » aux élèves').check()
      await page.getByRole('button', { name: 'Enregistrer les paramètres' }).click()
      await expect(page.getByText('Paramètres enregistrés.')).toBeVisible()

      await student.reload()
      await expect(line.getByText('Bot', { exact: true })).toBeVisible()
      await openAdminScreen(page, 'Bots')
      await expect(page.getByText('Vos élèves voient aussi l’étiquette « Bot ».')).toBeVisible()
    } finally {
      // Le site retrouve son réglage d'origine, quoi qu'il arrive.
      await page.request.patch('/api/admin/settings', { data: { showBotLabel: false } })
      await page.request.delete(`/api/admin/bots/${made.id}`)
      await studentContext.close()
    }
  })
})
