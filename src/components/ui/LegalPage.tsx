import { SITE } from '@/lib/site';

/** Shared layout for the policy pages: a title, an updated date and readable text. */
export function LegalPage({
  title,
  intro,
  showDate = true,
  children,
}: {
  title: string;
  intro?: string;
  showDate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="shell grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
      <header className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="page-title font-display font-extrabold tracking-tight">{title}</h1>
        {showDate && <p className="mt-4 text-sm text-mute">Last updated {SITE.policyUpdated}</p>}
        {intro && <p className="mt-6 text-lg text-mute">{intro}</p>}
      </header>
      <div className="grid content-start gap-x-14 gap-y-10 leading-relaxed xl:grid-cols-2 [&>*]:min-w-0 [&_a]:underline [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_li]:text-mute [&_p]:text-mute [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
