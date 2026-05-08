"use client";
import { useEffect, useState } from "react";

export type Toast = { id: number; message: string };

let listeners: ((t: Toast) => void)[] = [];

export function showToast(message: string) {
  listeners.forEach((l) => l({ id: Date.now() + Math.random(), message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const onAdd = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 6000);
    };
    listeners.push(onAdd);
    return () => {
      listeners = listeners.filter((l) => l !== onAdd);
    };
  }, []);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="bg-surface border border-line rounded px-3 py-2 text-sm text-ink shadow">
          {t.message}
        </div>
      ))}
    </div>
  );
}
