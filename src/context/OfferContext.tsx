import { createContext, useContext, useState, ReactNode } from 'react';
import type { Offer } from '../types';

interface OfferContextType {
  currentOffer: Offer | null;
  setCurrentOffer: (offer: Offer | null) => void;
  offerHistory: Offer[];
  addToHistory: (offer: Offer) => void;
  clearHistory: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const OfferContext = createContext<OfferContextType | null>(null);

export function OfferProvider({ children }: { children: ReactNode }) {
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [offerHistory, setOfferHistory] = useState<Offer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addToHistory = (offer: Offer) => {
    setOfferHistory(prev => [offer, ...prev].slice(0, 20));
  };

  const clearHistory = () => setOfferHistory([]);

  return (
    <OfferContext.Provider
      value={{
        currentOffer,
        setCurrentOffer,
        offerHistory,
        addToHistory,
        clearHistory,
        isGenerating,
        setIsGenerating,
      }}
    >
      {children}
    </OfferContext.Provider>
  );
}

export function useOffer() {
  const ctx = useContext(OfferContext);
  if (!ctx) throw new Error('useOffer must be used within OfferProvider');
  return ctx;
}
