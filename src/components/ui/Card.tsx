import clsx from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-lg border border-slate-200 bg-white p-6 shadow-sm", className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "gold";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    gold: "bg-gold-light text-navy",
  };
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClasses[tone])}>
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    info: "bg-gold-light text-navy border-gold",
    warning: "bg-amber-50 text-amber-900 border-amber-300",
    danger: "bg-red-50 text-red-900 border-red-300",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={clsx("rounded-md border-l-4 p-4 text-sm", toneClasses[tone])}>
      {children}
    </div>
  );
}
