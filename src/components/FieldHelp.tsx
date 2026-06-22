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
      content={<span className="block max-w-[260px] whitespace-normal leading-relaxed">{text}</span>}
      className="max-w-[280px] whitespace-normal text-left"
    >
      <HelpCircle
        size={13}
        className={cn("cursor-help text-zinc-500 hover:text-indigo-300", className)}
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
