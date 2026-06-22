// Simple prose layout for static informational pages (about, delivery, returns,
// privacy, terms). Keeps typography consistent and on-brand.
export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {intro && <p className="text-muted-foreground mt-3 text-balance">{intro}</p>}
      <div className="[&_h2]:font-heading [&_p]:text-foreground/90 mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
