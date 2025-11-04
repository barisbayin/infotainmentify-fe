type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

export default function Switch({ checked, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm text-neutral-700 select-none">{label}</span>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 
          ${checked ? "bg-green-500" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-all duration-200 shadow-sm
            ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
