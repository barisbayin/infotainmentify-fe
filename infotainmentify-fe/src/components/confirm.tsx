import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ConfirmOptions = {
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "primary" | "neutral";
  dismissOnBackdrop?: boolean;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<ConfirmOptions>({
    title: "Are you sure?",
    message: "This action cannot be undone.",
    confirmText: "Confirm",
    cancelText: "Cancel",
    tone: "primary",
    dismissOnBackdrop: true,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts((prev) => ({ ...prev, ...options }));
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    resolverRef.current?.(result);
    resolverRef.current = null; // <- reset
  }, []);

  // ESC kapatsın
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    // body scroll kilidi
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const value = useMemo<ConfirmContextValue>(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => opts.dismissOnBackdrop && close(false)}
            />
            {/* Panel */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-neutral-200 relative">
                <div className="p-5 pb-3">
                  <div className="text-base font-semibold text-neutral-900">
                    {opts.title}
                  </div>
                  {opts.message && (
                    <div className="mt-2 text-sm text-neutral-600">
                      {opts.message}
                    </div>
                  )}
                </div>
                <div className="p-4 pt-0 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="px-3.5 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-100"
                  >
                    {opts.cancelText ?? "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => close(true)}
                    className={[
                      "px-3.5 py-2 text-sm rounded-lg text-white",
                      opts.tone === "danger"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : opts.tone === "primary"
                        ? "bg-neutral-900 hover:bg-neutral-800"
                        : "bg-neutral-600 hover:bg-neutral-700",
                    ].join(" ")}
                  >
                    {opts.confirmText ?? "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}
