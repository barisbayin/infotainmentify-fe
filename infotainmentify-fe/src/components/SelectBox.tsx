import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option<T extends string | number = string> = {
  value: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  color?: string;
};

type Props<T extends string | number = string> = {
  label?: string;
  value: T | "";
  onChange: (v: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
};

export default function SelectBox<T extends string | number = string>({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçin",
  className = "",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((x) => x.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative w-full select-none ${className}`}>
      {label && (
        <div className="text-sm text-neutral-600 mb-1 font-medium">{label}</div>
      )}

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        className="w-full flex justify-between items-center rounded-xl border border-neutral-300 
                   bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100 focus:outline-none 
                   focus:ring-2 focus:ring-neutral-300 transition-all"
      >
        <div className="flex items-center gap-2">
          {selected?.icon && (
            <selected.icon
              size={16}
              className={selected.color ?? "text-neutral-600"}
            />
          )}
          <span className={selected ? "" : "text-neutral-400"}>
            {selected?.label ?? placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`ml-2 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg 
                     overflow-hidden animate-in fade-in slide-in-from-top-1"
        >
          {options.map((opt) => (
            <div
              key={String(opt.value)}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-neutral-100 
                         ${
                           value === opt.value
                             ? "bg-neutral-50 font-medium"
                             : ""
                         }`}
            >
              {opt.icon && (
                <opt.icon
                  size={16}
                  className={opt.color ?? "text-neutral-600"}
                />
              )}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
