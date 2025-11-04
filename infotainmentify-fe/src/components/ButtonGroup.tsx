type ButtonGroupProps<T extends string | number = string> = {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
  className?: string;
};

export default function ButtonGroup<T extends string | number = string>({
  value,
  onChange,
  options,
  className = "",
}: ButtonGroupProps<T>) {
  return (
    <div
      className={`inline-flex rounded-xl border border-neutral-300 overflow-hidden bg-neutral-50 ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-all
              ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
