import Link from "next/link";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  introduction: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPage({
  title,
  introduction,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <main className="relative flex-1 overflow-hidden bg-[#080b14] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-violet-500/10 via-cyan-500/[0.04] to-transparent"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <header className="max-w-3xl border-b border-white/10 pb-8 sm:pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Evigo · Legal information
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            {introduction}
          </p>
          <p className="mt-4 text-sm text-white/50">
            Last updated:             <time dateTime="2026-10-10">{lastUpdated}</time>
          </p>
          <p className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-3 text-sm leading-6 text-white/70">
            This page is general informational content, not legal advice or a
            legal review. Please have the final policy reviewed for Evigo&apos;s
            legal entity, operations, and applicable requirements before
            publication.
          </p>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav
            aria-label={`${title} contents`}
            className="self-start lg:sticky lg:top-6"
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
              On this page
            </h2>
            <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-l border-white/10 pl-4 lg:block lg:space-y-3">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm leading-5 text-white/65 transition-colors hover:text-cyan-200 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
                  >
                    <span className="mr-1.5 text-xs text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 divide-y divide-white/10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-8 py-7 first:pt-0 sm:py-8"
              >
                <h2
                  id={`${section.id}-heading`}
                  className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-white/70 marker:text-cyan-300 sm:text-base sm:leading-8">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="border-t border-white/10 pt-7 text-sm leading-7 text-white/60">
              Questions? Contact{" "}
              <a
                href="mailto:support.evigo@gmail.com"
                className="font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
              >
                support.evigo@gmail.com
              </a>{" "}
              or call{" "}
              <a
                href="tel:+917808807340"
                className="font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
              >
                7808807340
              </a>
              . You can also visit our{" "}
              <Link
                href="/contact"
                className="font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
              >
                Contact page
              </Link>
              .
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
