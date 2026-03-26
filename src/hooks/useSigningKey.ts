'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThetanutsClient } from './useThetanutsClient';
import type { RFQKeyPair } from '@thetanuts-finance/thetanuts-client';

export function useSigningKey() {
  const { client } = useThetanutsClient();
  const [keyPair, setKeyPair] = useState<RFQKeyPair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.rfqKeys.getOrCreateKeyPair()
      .then(setKeyPair)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client]);

  const regenerate = useCallback(async () => {
    setLoading(true);
    try {
      const kp = await client.rfqKeys.generateKeyPair();
      await client.rfqKeys.storeKeyPair(kp);
      setKeyPair(kp);
    } catch (err) {
      console.error('Failed to regenerate key pair:', err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    keyPair,
    publicKey: keyPair?.compressedPublicKey ?? null,
    loading,
    regenerate,
  };
}
