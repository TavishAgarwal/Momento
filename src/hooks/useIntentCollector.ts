import { useEffect, useCallback } from 'react';
import { onDeviceModel } from '../services/onDeviceModel';
import type { IntentState } from '../types';

export function useIntentCollector(intervalMs: number = 10000) {
  const collect = useCallback((): IntentState => {
    return onDeviceModel.getIntent();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      collect();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [collect, intervalMs]);

  return { getIntent: collect };
}
