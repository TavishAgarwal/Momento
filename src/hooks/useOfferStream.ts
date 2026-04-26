import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { onDeviceModel } from '../services/onDeviceModel';
import type { Offer } from '../types';

export function useOfferStream(merchantId: string = 'cafe-mueller') {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const intent = onDeviceModel.getIntent();
      const result = await api.generateOffer({ merchantId, intent }) as Offer;
      setOffer(result);
      onDeviceModel.recordInteraction('view');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  const dismiss = useCallback(() => {
    onDeviceModel.recordInteraction('dismiss');
    setOffer(null);
  }, []);

  return { offer, isLoading, error, generate, dismiss, setOffer };
}
