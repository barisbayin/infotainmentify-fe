import React, { type ReactNode, forwardRef } from "react";
import { createPortal } from "react-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ChevronDown,
  Braces,
  AlertCircle,
  Check,
  Copy,
  Minus,
  X,
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
        // Modernizasyon: Düz renk yerine tepeden vuran hafif bir indigo gradient spot ışığı
        "h-full w-full bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] text-zinc-300 font-sans selection:bg-indigo-500/30 flex flex-col",
        className
      )}
      {...rest}
    >
      {/* İç padding ve full height */}
      <div className="h-full w-full p-3 sm:p-4 flex flex-col space-y-3 overflow-hidden relative z-10">
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
        "flex flex-col gap-2 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
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
        // Modernizasyon: Daha güçlü glass effect, ince beyaz border ve hoverda yumuşak aydınlanma
        "ui-card relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/10",
        noPadding ? "" : "p-4",
        className
      )}
      {...rest}
    >
      {/* Noise texture opsiyonel olarak eklenebilir ama şimdilik temiz tutalım */}
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-white", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-0.5 text-xs text-zinc-400", className)}>{children}</p>
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
        "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 border border-white/10 hover:scale-[1.02]",
      secondary:
        "bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700 hover:text-white border border-white/5 hover:border-white/10 backdrop-blur-sm",
      outline:
        "bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500",
      ghost:
        "bg-zinc-950/50 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-800/50 hover:border-zinc-700",
      danger:
        "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-xs",
      md: "h-9 px-3 text-xs",
      lg: "h-10 px-4 text-sm",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
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
        "mb-1 ml-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400",
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
        "ui-field flex h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950/30 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-600 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50 hover:border-zinc-700",
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
        "ui-field flex min-h-[84px] w-full rounded-lg border border-zinc-800 bg-zinc-950/30 px-2.5 py-1.5 text-sm text-white placeholder:text-zinc-600 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all duration-200 resize-y",
        "disabled:cursor-not-allowed disabled:opacity-50 hover:border-zinc-700",
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
    neutral: "bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700/50",
    success: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20",
    brand: "bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
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
    <div className="ui-table-shell w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className={cn("w-full text-left text-xs", className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({
  children,
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="ui-table-head border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
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
        "ui-table-row border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/50 transition-colors duration-200",
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
  ...rest
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      className={cn(
        "h-8 px-3 text-left align-middle font-medium text-zinc-400",
        className
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  ...rest
}: React.TdHTMLAttributes<HTMLTableDataCellElement>) {
  return (
    <td className={cn("p-3 align-middle text-zinc-200", className)} {...rest}>
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
  maxWidth = "md",
  className, // Eklenen Prop
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string; // Eklenen Prop Type
}) {
  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
    "5xl": "max-w-7xl",
    full: "max-w-[95vw]",
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/60 backdrop-blur-sm p-3 animate-in fade-in duration-200 overflow-y-auto">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={cn(
          "ui-modal-surface relative w-full rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
          widthClasses[maxWidth],
          className // ClassName burada birleştiriliyor
        )}
      >
        {/* Header */}
        <div className="ui-modal-header flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          {title && (
            <h3 className="text-base font-semibold text-white tracking-tight">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
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
          "ui-select-trigger flex h-8 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/30 px-2.5 text-xs text-zinc-200 transition-all duration-200",
          "hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50",
          isOpen && "border-indigo-500/50 ring-2 ring-indigo-500/20 bg-zinc-900"
        )}
      >
        <span className={selectedLabel ? "text-zinc-200" : "text-zinc-500"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-500 transition-transform duration-200",
            isOpen && "rotate-180 text-indigo-400"
          )}
        />
      </button>

      {/* Açılır Menü */}
      {isOpen && (
        <div className="ui-select-menu absolute top-full left-0 mt-1 w-full z-50 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-56 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-700">
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
                    "ui-select-option flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
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

/* ----------------------- JSON INPUT (Syntax Highlighted) ----------------------- */
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
  const [isFocused, setIsFocused] = useState(false);

  // Scroll Senkronizasyonu için Ref'ler
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

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
    } catch {
      setError("Geçersiz JSON");
      setIsValid(false);
    }
  }, [value]);

  const handleFormat = () => {
    try {
      const obj = JSON.parse(value);
      onChange(JSON.stringify(obj, null, 2));
      setError(null);
    } catch {
      setError("Formatlanamıyor");
    }
  };

  // Basit JSON Renklendirici (Regex)
  const highlightJSON = (json: string) => {
    if (!json) return "";

    // HTML karakterlerini kaçır (XSS önlemi)
    const safe = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return safe.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-400"; // Number (Varsayılan)

        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-sky-400"; // Key
          } else {
            cls = "text-emerald-400"; // String Value
          }
        } else if (/true|false/.test(match)) {
          cls = "text-rose-400"; // Boolean
        } else if (/null/.test(match)) {
          cls = "text-zinc-500"; // Null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <div className={cn("relative flex flex-col gap-1 group", className)}>
      {/* EDİTÖR ALANI */}
      <div className="ui-code-field relative flex-1 min-h-0 border border-zinc-800 bg-zinc-950 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
        {/* 1. KATMAN: Renkli Kod (Arkada) */}
        <pre
          ref={highlightRef}
          className={cn(
            "absolute inset-0 m-0 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none select-none transition-opacity duration-200",
            isFocused ? "opacity-0" : "opacity-100" // Focuslanınca gizle
          )}
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html:
              highlightJSON(value) ||
              '<span class="text-zinc-600 opacity-50">' +
                placeholder +
                "</span>",
          }}
        />

        {/* 2. KATMAN: Editör (Önde) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
             "absolute inset-0 w-full h-full p-3 bg-transparent font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words resize-none outline-none scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700 transition-colors duration-200",
             isFocused ? "text-zinc-300" : "text-transparent caret-white" // Focuslanınca göster
          )}
          spellCheck={false}
          // Placeholder'ı pre içinde gösteriyoruz
        />

        {/* Validasyon Rozeti */}
        <div className="ui-floating-badge absolute bottom-2 right-2 pointer-events-none bg-zinc-950/80 backdrop-blur px-2 py-1 rounded border border-zinc-800/50">
          {value && (
            <span
              className={cn(
                "text-[10px] font-medium flex items-center gap-1.5",
                isValid ? "text-emerald-500" : "text-red-500"
              )}
            >
              {isValid ? <Check size={10} /> : <AlertCircle size={10} />}
              {isValid ? "Valid JSON" : "Syntax Error"}
            </span>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-1 mt-0.5 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          {error && (
            <span className="text-red-400 flex items-center gap-1 animate-pulse">
              <AlertCircle size={12} /> {error}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <Copy size={12} /> Kopyala
          </button>
          <button
            type="button"
            onClick={handleFormat}
            disabled={!value}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Braces size={12} /> Formatla
          </button>
        </div>
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
        className="ui-number-button flex w-8 items-center justify-center rounded-l-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none border-r-0 z-10"
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
          "ui-number-input flex-1 h-8 w-full border-y border-zinc-800 bg-zinc-950/50 px-2 text-center text-xs text-zinc-200 placeholder:text-zinc-600",
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
        className="ui-number-button flex w-8 items-center justify-center rounded-r-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none border-l-0 z-10"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

/* ----------------------- CODE VIEWER (Read Only & Colored) ----------------------- */
export function CodeViewer({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  // JSON Renklendirici (Aynısı)
  const highlightJSON = (json: string) => {
    if (!json) return "";
    const safe = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return safe.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-400";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = "text-sky-400";
          else cls = "text-emerald-400";
        } else if (/true|false/.test(match)) cls = "text-rose-400";
        else if (/null/.test(match)) cls = "text-zinc-500";
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <div className={cn("relative group h-full w-full", className)}>
      <div className="ui-code-field absolute inset-0 w-full h-full rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <pre
          className="w-full h-full p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 text-zinc-300 selection:bg-indigo-500/30"
          dangerouslySetInnerHTML={{ __html: highlightJSON(value) }}
        />
      </div>
    </div>
  );
}
/* ----------------------- CONFIRM MODAL ----------------------- */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Emin misiniz?",
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-3">
        <div className="text-sm text-zinc-400 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2 mt-1">
          <Button variant="ghost" onClick={onClose} size="sm">
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


/* ----------------------- TOOLTIP ----------------------- */
export function Tooltip({
  children,
  content,
  className,
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "top" as "top" | "bottom" });
  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const preferTop = rect.top > 160;
    const maxWidth = 320;
    const rawLeft = rect.left + rect.width / 2;
    const left = Math.min(Math.max(rawLeft, 16 + maxWidth / 2), window.innerWidth - 16 - maxWidth / 2);
    const top = preferTop ? rect.top - 10 : rect.bottom + 10;
    setCoords({ top, left, placement: preferTop ? "top" : "bottom" });
  };

  const show = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    updatePosition();
    setIsVisible(true);
  };

  const hide = () => {
    hideTimer.current = window.setTimeout(() => setIsVisible(false), 80);
  };

  useEffect(() => {
    if (!isVisible) return;

    const onUpdate = () => updatePosition();
    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);

    return () => {
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [isVisible]);

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible &&
        createPortal(
        <div
          className={cn(
            "ui-tooltip fixed z-[9999] max-w-[300px] rounded-lg border border-indigo-500/20 bg-zinc-950/95 px-2.5 py-2 text-left text-[11px] leading-relaxed text-zinc-100 shadow-2xl shadow-black/40 backdrop-blur-md ring-1 ring-white/5 pointer-events-none",
            coords.placement === "top" ? "-translate-x-1/2 -translate-y-full" : "-translate-x-1/2",
            className
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
          <span
            className={cn(
              "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-indigo-500/20 bg-zinc-950/95",
              coords.placement === "top"
                ? "-bottom-1 border-b border-r"
                : "-top-1 border-l border-t"
            )}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
