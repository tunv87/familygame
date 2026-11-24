/** Loads the word list only when Nối từ is opened (it is the biggest asset of the app). */
import { useEffect, useState } from 'react';
import { createLogger, isLeaving } from '../../lib/logger';
import { makeDict, type Dict, type Row } from './logic';

const log = createLogger('noitu-dict');

export interface Loaded {
  dict: Dict;
  words: string[];
}

let cache: Promise<Loaded> | null = null;

export function loadDict(): Promise<Loaded> {
  if (!cache) {
    cache = import('./words.json')
      .then((m) => {
        const rows = (m.default as { w: Row[] }).w;
        const dict = makeDict(rows);
        log.info('dictionary loaded', { words: dict.size });
        return { dict, words: rows.map((r) => r[0]) };
      })
      .catch((e) => {
        cache = null; // let a later visit retry
        throw e;
      });
  }
  return cache;
}

/** null while loading; 'error' if it failed (offline before the app was cached). */
export function useDict(): Loaded | null | 'error' {
  const [d, setD] = useState<Loaded | null | 'error'>(null);
  useEffect(() => {
    let live = true;
    loadDict().then(
      (x) => live && setD(x),
      (e) => {
        if (!isLeaving()) log.error('dictionary failed', String(e));
        if (live) setD('error');
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return d;
}
