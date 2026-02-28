"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface NoticeContextValue {
  notice: string | null;
  notify: (message: string) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const value = useMemo(() => ({ notice, notify }), [notice, notify]);
  return (
    <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>
  );
}

export function useNotice() {
  const value = useContext(NoticeContext);
  if (!value) {
    throw new Error("useNotice must be used within NoticeProvider");
  }
  return value;
}

export function NoticeViewport() {
  const { notice } = useNotice();

  if (!notice) return null;

  return (
    <output
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm"
      aria-live="polite"
    >
      {notice}
    </output>
  );
}
