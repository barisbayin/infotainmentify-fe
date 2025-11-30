import React, { type ReactNode, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ChevronDown,
  Braces,
  AlertCircle,
  Check,
  Copy,
  Minus,
  Plus,
} from "lucide-react"; // Importlara ekle
import { useState, useRef, useEffect } from "react"; // Bunları da ekle

/* ----------------------- UTILS ----------------------- */
// Class çakışmalarını önleyen (örn: p-4 ve p-2 varsa sonuncuyu alır) helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------------- PAGE LAYOUT ----------------------- */
export function Page({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // min-h-screen YERİNE h-full kullanıyoruz ki Layout'un sınırlarına uysun.
        // max-w-7xl KALDIRILDI, artık tam genişlik.
        "h-full w-full bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30 flex flex-col",
        className
      )}
      {...rest}
    >
      {/* İç padding ve full height */}
      <div className="h-full w-full p-4 sm:p-6 flex flex-col space-y-4 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-base text-zinc-400">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-3">{action}</div>}
    </div>
  );
}

/* ----------------------- CARDS (Glassy Look) ----------------------- */
export function Card({
  children,
  className,
  noPadding = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-inner backdrop-blur-xl transition-all hover:border-zinc-700/80",
        noPadding ? "" : "p-6",
        className
      )}
      {...rest}
    >
      {/* Hafif bir glow efekti */}
      <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100" />
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-white", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-zinc-400 mt-1", className)}>{children}</p>
  );
}

/* ----------------------- BUTTONS ----------------------- */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading,
      ...rest
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 border-transparent",
      secondary:
        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700 hover:border-zinc-600",
      outline:
        "bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white",
      ghost:
        "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50",
      danger:
        "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border",
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ----------------------- INPUTS ----------------------- */
export function Label({
  children,
  className,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-medium text-zinc-400 ml-1 mb-1.5 block uppercase tracking-wider",
        className
      )}
      {...rest}
    >
      {children}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-y",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

/* ----------------------- BADGES ----------------------- */
export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: "neutral" | "success" | "warning" | "error" | "brand";
} & React.HTMLAttributes<HTMLSpanElement>) {
  const styles = {
    neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    brand: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------- TABLE ----------------------- */
export function Table({
  children,
  className,
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
      <table className={cn("w-full text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({
  children,
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
      {children}
    </thead>
  );
}

export function TR({
  children,
  className,
  ...rest // 🔥 KRİTİK NOKTA: Geri kalan tüm props'ları (onClick dahil) buraya alıyoruz
}: React.HTMLAttributes<HTMLTableRowElement>) {
  // Tipini belirttik
  return (
    <tr
      className={cn(
        "border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors",
        className
      )}
      {...rest} // 🔥 VE BURAYA YAPIŞTIRIYORUZ. Bunu yapmazsan tıklama çalışmaz!
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-zinc-400",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
}: React.TdHTMLAttributes<HTMLTableDataCellElement>) {
  return (
    <td className={cn("p-4 align-middle text-zinc-200", className)}>
      {children}
    </td>
  );
}

/* ----------------------- MODAL ----------------------- */
/* ----------------------- MODAL ----------------------- */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md", // 🔥 YENİ: Varsayılan orta boy, ama değiştirebiliriz
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
}) {
  if (!isOpen) return null;

  // Tailwind genişlik sınıfları
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-lg", // Varsayılan (eski hali)
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
    "5xl": "max-w-7xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Dışarı tıkayınca kapatmak için overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={cn(
          "relative w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
          widthClasses[maxWidth] // 🔥 Dinamik genişlik buradan geliyor
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          {title && (
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------- CUSTOM SELECT ----------------------- */
export interface SelectOption {
  label: string;
  value: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seçiniz...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Seçili olanın label'ını bul
  const selectedLabel = options.find((o) => o.value === value)?.label;

  // Dışarı tıklayınca kapatma mantığı
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={ref}>
      {/* Tetikleyici Buton (Input gibi görünür) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 text-sm text-zinc-200 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
          isOpen && "border-indigo-500/50 ring-2 ring-indigo-500/20"
        )}
      >
        <span className={selectedLabel ? "text-zinc-200" : "text-zinc-600"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Açılır Menü */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors",
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------- JSON INPUT (Code Editor Style) ----------------------- */
export function JsonInput({
  value,
  onChange,
  className,
  placeholder = "JSON verisini buraya yapıştırın...",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Değer her değiştiğinde validasyon yap
  useEffect(() => {
    if (!value) {
      setError(null);
      setIsValid(false);
      return;
    }
    try {
      JSON.parse(value);
      setError(null);
      setIsValid(true);
    } catch (e: any) {
      setError("Geçersiz JSON formatı");
      setIsValid(false);
    }
  }, [value]);

  const handleFormat = () => {
    try {
      const obj = JSON.parse(value);
      const pretty = JSON.stringify(obj, null, 2); // 2 boşluklu girinti
      onChange(pretty);
      setError(null);
    } catch (e) {
      setError("Formatlanamıyor: JSON hatalı");
    }
  };

  return (
    <div className={cn("relative flex flex-col gap-1", className)}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border bg-zinc-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-300 transition-all scrollbar-thin scrollbar-thumb-zinc-800",
            "focus:outline-none focus:ring-2",
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
              : isValid
              ? "border-emerald-500/30 focus:border-indigo-500/50 focus:ring-indigo-500/20"
              : "border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          )}
          spellCheck={false}
          placeholder={placeholder}
          rows={8}
        />

        {/* Durum İkonu (Sağ Alt) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {value && (
            <span
              className={cn(
                "text-[10px] font-medium",
                isValid ? "text-emerald-500" : "text-red-500"
              )}
            >
              {isValid ? "Valid JSON" : "Invalid"}
            </span>
          )}
        </div>
      </div>

      {/* Araç Çubuğu */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs">
          {error ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle size={12} /> {error}
            </span>
          ) : (
            <span className="text-zinc-500">JSON formatında veri</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFormat}
          disabled={!value || !!error}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <Braces size={12} /> Formatla & Düzenle
        </button>
      </div>
    </div>
  );
}

/* ----------------------- NUMBER INPUT ----------------------- */
export function NumberInput({
  value,
  onChange,
  className,
  placeholder,
  min = 0,
  max,
  step = 1,
}: {
  value: number | string;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const updateValue = (newValue: number) => {
    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;

    // Floating point fix
    const stepDecimals = (step.toString().split(".")[1] || "").length;
    const val = Number(newValue.toFixed(stepDecimals));

    onChange(val);
  };

  const handleDecrement = () => {
    const current = Number(value) || 0;
    updateValue(current - step);
  };

  const handleIncrement = () => {
    const current = Number(value) || 0;
    updateValue(current + step);
  };

  return (
    <div className={cn("flex w-full shadow-sm", className)}>
      {/* 🔥 DEĞİŞİKLİK 1: Parent'tan 'rounded' ve 'overflow-hidden' KALDIRILDI */}

      {/* Sol Buton (-) */}
      <button
        type="button"
        onClick={handleDecrement}
        // 🔥 DEĞİŞİKLİK 2: 'rounded-l-xl' buraya eklendi.
        className="flex w-9 items-center justify-center rounded-l-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none border-r-0 z-10"
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        value={value}
        onChange={(e) => updateValue(parseFloat(e.target.value))}
        placeholder={placeholder}
        step={step}
        className={cn(
          "flex-1 h-9 w-full border-y border-zinc-800 bg-zinc-950/50 px-3 text-center text-sm text-zinc-200 placeholder:text-zinc-600",
          // Köşeler kare kalacak (Input ortada olduğu için)
          "focus:outline-none focus:z-20 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all",
          "no-spinners"
        )}
      />

      {/* Sağ Buton (+) */}
      <button
        type="button"
        onClick={handleIncrement}
        // 🔥 DEĞİŞİKLİK 3: 'rounded-r-xl' buraya eklendi.
        className="flex w-9 items-center justify-center rounded-r-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none border-l-0 z-10"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
