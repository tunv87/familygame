import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('[SEC-14] the error log is hidden from players', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('in a release build there is no button until the title was tapped 5 times', async () => {
    vi.stubEnv('DEV', false);
    const { devToolsUnlocked, unlockDevTools } = await import('./devtools');
    expect(devToolsUnlocked()).toBe(false);
    unlockDevTools();
    expect(devToolsUnlocked()).toBe(true);
    // remembered on this device
    vi.resetModules();
    expect((await import('./devtools')).devToolsUnlocked()).toBe(true);
  });

  it('a broken saved value keeps it hidden', async () => {
    vi.stubEnv('DEV', false);
    localStorage.setItem('fg:devtools', '"yes"');
    expect((await import('./devtools')).devToolsUnlocked()).toBe(false);
  });

  it('always shown while developing', async () => {
    vi.stubEnv('DEV', true);
    expect((await import('./devtools')).devToolsUnlocked()).toBe(true);
  });
});
