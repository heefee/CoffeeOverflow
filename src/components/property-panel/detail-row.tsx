import type { ReactNode } from "react";

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,42%)_1fr] gap-x-2 gap-y-0.5 text-sm @min-[460px]/sidebar:grid-cols-[minmax(0,34%)_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
