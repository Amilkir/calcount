export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm";
export const primaryButtonClass =
  "btn-primary w-full";
