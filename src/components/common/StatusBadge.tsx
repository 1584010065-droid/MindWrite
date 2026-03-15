export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "accent" | "warning";
}) {
  const styles = {
    neutral: "border-line/70 text-dusk",
    accent: "border-clay bg-clay/10 text-clay",
    warning: "border-amber-400/60 bg-amber-100/70 text-amber-800",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-ui ${styles[tone]}`}
    >
      {label}
    </span>
  );
}
