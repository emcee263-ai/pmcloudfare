/** Heading on one side, form on the other. Stacks on phones, fills the screen on wider ones. */
export function SplitPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="shell grid gap-10 py-10 sm:py-16 md:min-h-[calc(100dvh-10rem)] md:grid-cols-2 md:items-center md:gap-12 lg:gap-20">
      <div>
        <h1 className="page-title font-display font-extrabold tracking-tight">{title}</h1>
        {intro && <p className="mt-6 max-w-md text-mute">{intro}</p>}
      </div>
      <div className="w-full">{children}</div>
    </section>
  );
}
