import { type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Label, Tooltip, cn } from "./ui-kit";

export function FieldHelp({
  text,
  className,
}: {
  text: ReactNode;
  className?: string;
}) {
  if (!text) return null;

  return (
    <Tooltip
      content={<span className="block max-w-[300px] whitespace-normal leading-relaxed">{text}</span>}
      className="max-w-[320px] whitespace-normal text-left"
    >
      <HelpCircle
        size={14}
        className={cn(
          "cursor-help rounded-full text-zinc-500 transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
          className
        )}
      />
    </Tooltip>
  );
}

export function HelpLabel({
  children,
  help,
  className,
}: {
  children: ReactNode;
  help: ReactNode;
  className?: string;
}) {
  return (
    <Label className={cn("mb-1.5 flex items-center gap-1.5", className)}>
      <span>{children}</span>
      <FieldHelp text={help} />
    </Label>
  );
}
