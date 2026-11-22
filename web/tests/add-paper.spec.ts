import { test, expect } from '@playwright/test'

test('user can open the application, add a paper, and see it in All Papers', async ({ page }) => {
  // Navigate to root
  await page.goto('/')

  // Verify page title / header is visible
  await expect(page.getByText('mini-ReLiS')).toBeVisible()

  // Open "Add Paper" drawer
  const addPaperBtn = page.getByRole('button', { name: /Add Paper/i })
  await addPaperBtn.click()

  // Verify drawer opened
  await expect(page.getByText('Add Candidate Paper')).toBeVisible()

  // Fill in paper details
  const testTitle = `Test Playwright Paper ${Date.now()}`
  await page.fill('input[placeholder="e.g. Empirical Study on AI Pair Programming"]', testTitle)
  await page.fill('input[placeholder="e.g. Alice Smith, Bob Jones"]', 'Playwright Bot, Jane Doe')
  await page.fill('input[placeholder="e.g. ICSE 2024 / IEEE Software"]', 'Automated Testing Conference')
  await page.fill('input[type="number"]', '2024')
  await page.fill('textarea[placeholder="Paste the abstract text here..."]', 'This paper tests the automated inclusion and viewing of papers in mini-ReLiS.')

  // Submit the form
  await page.getByRole('button', { name: /Add Paper to Review/i }).click()

  // Check for success toast notification
  await expect(page.getByText('Candidate paper successfully added.')).toBeVisible()

  // Switch to "All papers" tab
  const allPapersTab = page.getByRole('button', { name: /All papers/i })
  await allPapersTab.click()

  // Verify the newly created paper is displayed in the list
  await expect(page.getByText(testTitle)).toBeVisible()
})
