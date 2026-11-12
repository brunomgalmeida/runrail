import { expect, test } from '@playwright/test';
import { unique } from './api';

/* The status chip is the pause switch. The whole point is that it is the fast
   path, so the two things it must never do are navigate the card out from
   under the click, and leave the chip saying the wrong thing. */

test('clicking the status chip pauses a workflow without opening it', async ({ page, request }) => {
  const name = unique('pause-chip');
  const created = await request.post('/api/workflows', {
    data: { name, enabled: true, max_concurrent_runs: 1 } });
  expect(created.ok(), await created.text()).toBeTruthy();
  const workflow = await created.json();

  await page.goto('/workflows');
  const card = page.locator('article.workflow-card', { hasText: name });
  await expect(card.locator('.status-badge')).toHaveText('Enabled');

  await card.locator('.status-badge').click();
  await expect(card.locator('.status-badge')).toHaveText('Disabled');
  // Still on the list: the chip stopped its own click.
  await expect(page).toHaveURL(/\/workflows$/);

  const after = await (await request.get(`/api/workflows/${workflow.id}`)).json();
  expect(after.enabled).toBe(false);
  expect(after.name).toBe(name);

  // And back on from the detail page, where the same chip sits in the summary.
  await card.getByRole('heading', { name }).click();
  await expect(page).toHaveURL(new RegExp(`/workflows/${workflow.id}$`));
  const summary = page.locator('.summary-strip');
  await expect(summary.locator('.status-badge')).toHaveText('Disabled');
  await summary.locator('.status-badge').click();
  await expect(summary.locator('.status-badge')).toHaveText('Enabled');

  const enabledAgain = await (await request.get(`/api/workflows/${workflow.id}`)).json();
  expect(enabledAgain.enabled).toBe(true);
});
