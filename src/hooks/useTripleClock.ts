import { useState, useEffect, useCallback } from 'react';
import type { ContextState } from '../types';
import { api } from '../services/api';
import { onDeviceModel } from '../services/onDeviceModel';
import { locationService } from '../services/locationService';

export function useTripleClock(merchantId: string = 'cafe-mueller', pollMs: number = 5000) {
  const [context, setContext] = useState<ContextState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    try {
      const intent = onDeviceModel.getIntent();
      const loc = locationService.getCurrentLocation();

      const result = await api.evaluateContext({
        merchantId,
        intent,
        lat: loc.coordinates?.lat,
        lon: loc.coordinates?.lon,
        city: loc.city,
        district: loc.district,
      }) as ContextState;
      setContext(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    evaluate();
    const interval = setInterval(evaluate, pollMs);
    return () => clearInterval(interval);
  }, [evaluate, pollMs]);

  return { context, isLoading, error, refetch: evaluate };
}
