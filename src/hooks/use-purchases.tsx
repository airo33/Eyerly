import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  configurePurchases,
  fetchIsPro,
} from '@/lib/purchases';

type PurchasesContextValue = {
  isPro: boolean;
  hydrated: boolean;
  refresh: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const pro = await fetchIsPro();
    setIsPro(pro);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await configurePurchases();
      const pro = await fetchIsPro();
      if (!cancelled) {
        setIsPro(pro);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PurchasesContext.Provider value={{ isPro, hydrated, refresh }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) {
    throw new Error('usePurchases must be used within PurchasesProvider');
  }
  return ctx;
}
