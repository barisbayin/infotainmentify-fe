import React, { type ReactNode } from "react";
export { default as Tooltip } from "./Tooltip";

/* small class merge helper */
function cn(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

/* ----------------------- Page Layout ----------------------- */
export function Page({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-full w-full p-4 bg-neutral-50", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageBody({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-full w-full", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  right,
  className,
  ...rest
}: {
  title?: ReactNode;
  right?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 sticky top-0 z-20 -mt-4 -mx-4 px-4 pt-4 pb-3",
        "bg-neutral-50/90 backdrop-blur border-b border-neutral-200",
        "flex items-center justify-between",
        className
      )}
      {...rest}
    >
      <h1 className="text-base font-semibold text-neutral-800">{title}</h1>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

/* ----------------------- Toolbar ----------------------- */
export function Toolbar({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap md:flex-nowrap items-center gap-2 p-3 border border-neutral-200 bg-white rounded-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ----------------------- Card ----------------------- */
export function Card({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-neutral-200",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-3 border-b border-neutral-200 bg-neutral-50 rounded-t-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ----------------------- Table ----------------------- */
export function Table({
  children,
  className,
  ...rest
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full text-sm", className)} {...rest}>
      {children}
    </table>
  );
}

export function THead({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "sticky top-0 bg-white z-10 shadow-[0_2px_0_0_rgba(0,0,0,0.03)]",
        className
      )}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TR({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("text-left", className)} {...rest}>
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
        "px-3 py-2 text-xs font-semibold tracking-wide text-neutral-600",
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
    <td
      className={cn("px-3 py-2 align-middle text-neutral-700", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

/* ----------------------- Badge ----------------------- */
export function Badge({
  children,
  tone = "neutral",
  className,
  ...rest
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning" | "info";
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    neutral: "border-neutral-300 bg-neutral-50 text-neutral-700",
    success: "border-emerald-300 bg-emerald-50 text-emerald-700",
    danger: "border-rose-300 bg-rose-50 text-rose-700",
    warning: "border-amber-300 bg-amber-50 text-amber-700",
    info: "border-sky-300 bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ----------------------- Buttons ----------------------- */
export function Button({
  children,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "primary" | "danger";
  size?: "xs" | "sm" | "md";
}) {
  const base =
    "rounded-xl transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<"xs" | "sm" | "md", string> = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-3 py-2",
  };

  const styles: Record<"ghost" | "primary" | "danger", string> = {
    ghost: "border border-neutral-300 bg-white hover:bg-neutral-100",
    primary: "bg-neutral-900 text-white hover:bg-neutral-800",
    danger: "border border-rose-300 text-rose-700 bg-white hover:bg-rose-50",
  };

  return (
    <button
      className={cn(base, sizes[size], styles[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ----------------------- Field & Inputs ----------------------- */
export function Field({
  label,
  children,
  className,
  ...rest
}: {
  label: ReactNode; // <- string yerine ReactNode
  children: ReactNode;
} & React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block", className)} {...rest}>
      <span className="block text-xs font-medium text-neutral-600 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 rounded-xl border border-neutral-300",
        "focus:outline-none focus:ring-2 focus:ring-neutral-400",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 rounded-xl border border-neutral-300",
        "focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-y",
        className
      )}
      {...rest}
    />
  );
}

// Basit modal bileşeni
export function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl relative">
        <button
          className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-800"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
