export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "accent" | "warning";
}) {
  const styles = {
    neutral: "border-line/60 text-dusk bg-paper/60",
    accent: "border-clay/40 bg-clay/10 text-clay",
    warning: "border-amber-400/50 bg-amber-50/80 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-ui transition-all duration-250 ${styles[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${
        tone === "accent" ? "bg-clay" : tone === "warning" ? "bg-amber-500" : "bg-dusk/50"
      }`} />
      {label}
    </span>
  );
}
