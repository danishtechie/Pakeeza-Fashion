"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { useEffect } from "react";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: Toast["variant"]) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = "info") => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, variant: Toast["variant"] = "info") {
  useToastStore.getState().push(message, variant);
}

const icons = { success: CheckCircle2, error: XCircle, info: Info };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              role="status"
              className="flex items-center gap-2 rounded-full bg-charcoal px-4 py-3 text-sm text-ivory shadow-xl"
            >
              <Icon size={16} className={t.variant === "success" ? "text-gold-soft" : t.variant === "error" ? "text-burgundy-soft" : "text-ivory"} />
              <span>{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
