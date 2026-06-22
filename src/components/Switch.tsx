type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export default function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? "opacity-50" : ""}`}>
      {/* Label'a tıklayınca da switch değişsin diye label etiketi kullanabiliriz ama div daha güvenli */}
      {label && (
        <span
          onClick={() => !disabled && onChange(!checked)}
          className="text-sm font-medium text-slate-700 select-none cursor-pointer hover:text-slate-900 transition-colors"
        >
          {label}
        </span>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
          focus-visible:ring-indigo-600 focus-visible:ring-offset-2
          ${checked ? "bg-indigo-600" : "bg-slate-200"}
          ${disabled ? "cursor-not-allowed" : ""}
        `}
      >
        <span className="sr-only">Toggle setting</span>
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
