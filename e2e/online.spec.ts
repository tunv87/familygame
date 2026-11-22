import { expect, test } from '@playwright/test';
import { createRoom, joinByLink, newPlayer } from './helpers';

test('online caro 3×3: host wins, then rematch swaps who starts', async ({ browser }) => {
  const a = await newPlayer(browser);
  const b = await newPlayer(browser);
  await a.goto('/');
  await a.getByTestId('game-caro').click();
  await a.getByTestId('mode-online').click();
  await a.getByTestId('size-3').click();
  const code = await createRoom(a, 'Ông Nội');
  await a.screenshot({ path: 'test-results/screens/room-waiting.png' });

  await joinByLink(b, code, 'Bé Na');
  await expect(a.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
  await expect(b.getByTestId('status')).toContainText('Chờ Ông Nội');

  const moves: [typeof a, number][] = [
    [a, 0],
    [b, 3],
    [a, 1],
    [b, 4],
    [a, 2],
  ];
  for (const [p, idx] of moves) {
    await expect(p.getByTestId('status')).toContainText('Đến lượt bạn');
    await p.getByTestId(`cell-${idx}`).click();
  }
  await expect(a.getByTestId('result-title')).toHaveText('Bạn thắng! 🎉');
  await expect(b.getByTestId('result-title')).toHaveText('Ông Nội thắng! 🎉');
  await b.screenshot({ path: 'test-results/screens/caro-online-result.png' });

  await a.getByTestId('play-again').click();
  await b.getByTestId('play-again').click();
  await expect(b.getByTestId('status')).toContainText('Đến lượt bạn', { timeout: 15_000 });
  await expect(a.getByTestId('me-score')).toHaveText('1');
  await expect(b.getByTestId('opp-score')).toHaveText('1');
});

test('online numbers easy: race to find 1→30', async ({ browser }) => {
  const a = await newPlayer(browser);
  const b = await newPlayer(browser);
  await a.goto('/');
  await a.getByTestId('game-numbers').click();
  await a.getByTestId('mode-online').click();
  await a.getByTestId('level-easy').click();
  const code = await createRoom(a, 'Mẹ');

  // B joins with the keypad instead of a link.
  await b.goto('/');
  await b.getByTestId('hub-join').click();
  await b.getByTestId('name-input').fill('Con');
  await b.getByTestId('save-profile').click();
  for (const d of code) await b.getByTestId(`key-${d}`).click();

  await expect(a.getByTestId('numbers-board')).toBeVisible({ timeout: 15_000 });
  await expect(b.getByTestId('numbers-board')).toBeVisible();
  await expect(a.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  await expect(b.getByTestId('countdown')).toBeHidden({ timeout: 10_000 });
  await a.screenshot({ path: 'test-results/screens/numbers-start.png' });

  // A wrong tap does nothing.
  await a.getByTestId('num-5').click();
  await expect(a.getByTestId('target')).toContainText('1');

  for (let n = 1; n <= 30; n++) {
    const p = n % 3 === 0 ? b : a;
    await expect(p.getByTestId('target')).toContainText(String(n));
    await p.getByTestId(`num-${n}`).click();
    if (n === 15) await b.screenshot({ path: 'test-results/screens/numbers-mid.png' });
  }
  await expect(a.getByTestId('result-title')).toHaveText('Bạn thắng! 🎉');
  await expect(b.getByTestId('result-title')).toHaveText('Mẹ thắng! 🎉');
  await expect(a.getByTestId('me-score')).toHaveText('20');
  await expect(b.getByTestId('me-score')).toHaveText('10');
});

test('joining a missing room shows an error; a third player is refused', async ({ browser }) => {
  const a = await newPlayer(browser);
  await a.goto('/#/join/0000');
  await a.getByTestId('name-input').fill('Ai đó');
  await a.getByTestId('save-profile').click();
  await expect(a.getByText('Không tìm thấy phòng 0000')).toBeVisible({ timeout: 15_000 });

  const host = await newPlayer(browser);
  await host.goto('/#/caro');
  await host.getByTestId('mode-online').click();
  await host.getByTestId('size-15').click();
  const code = await createRoom(host, 'Bố');
  const guest = await newPlayer(browser);
  await joinByLink(guest, code, 'Mẹ');
  await expect(guest.getByTestId('caro-board')).toBeVisible({ timeout: 15_000 });
  const third = await newPlayer(browser);
  await joinByLink(third, code, 'Cô');
  await expect(third.getByText(`Phòng ${code} đã đủ 2 người`)).toBeVisible({ timeout: 15_000 });
});

test('exit asks for confirmation mid-game and the friend sees you left', async ({ browser }) => {
  const a = await newPlayer(browser);
  const b = await newPlayer(browser);
  await a.goto('/#/numbers');
  await a.getByTestId('mode-online').click();
  await a.getByTestId('level-easy').click();
  const code = await createRoom(a, 'Bà');
  await joinByLink(b, code, 'Cháu');
  await expect(a.getByTestId('numbers-board')).toBeVisible({ timeout: 15_000 });
  await a.getByTestId('exit').click();
  await a.getByTestId('keep-playing').click();
  await expect(a.getByTestId('numbers-board')).toBeVisible();
  await a.getByTestId('exit').click();
  await a.getByTestId('confirm-exit').click();
  await expect(a.getByTestId('game-numbers')).toBeVisible();
  await expect(b.getByText('Bà đã rời phòng')).toBeVisible({ timeout: 15_000 });
});
