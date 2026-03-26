'use client';

import { useContext } from 'react';
import { ThetanutsContext, type ThetanutsContextValue } from '../providers';

export function useThetanutsClient(): ThetanutsContextValue {
  const ctx = useContext(ThetanutsContext);
  if (!ctx) {
    throw new Error('useThetanutsClient must be used within ThetanutsProvider');
  }
  return ctx;
}
