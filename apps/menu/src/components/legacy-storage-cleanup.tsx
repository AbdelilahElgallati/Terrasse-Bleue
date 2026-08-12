'use client';

import { useEffect } from 'react';

const LOCAL_KEYS = ['tb-web-cart', 'tb-web-refresh', 'tb-last-order'];

export function LegacyStorageCleanup() {
  useEffect(() => {
    for (const key of LOCAL_KEYS) localStorage.removeItem(key);
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith('tb-order-')) sessionStorage.removeItem(key);
    }
  }, []);
  return null;
}
