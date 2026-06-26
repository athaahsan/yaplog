import {
  ArrowRight,
  BookOpenText,
  Calendar,
  LockKeyhole,
  Mic,
  NotebookPen,
  Sparkles,
  Tag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const previewEntries = [
  {
    body: 'Noticed the morning felt slower after walking before opening my laptop.',
    date: 'Today',
    mood: '🙂',
    title: 'A calmer start',
  },
  {
    body: 'Keep the original thought, make it easier to read, leave the voice intact.',
    date: 'Yesterday',
    mood: '✨',
    title: 'Polish notes',
  },
  {
    body: 'Tiny adjustments add up when the app becomes a daily ritual.',
    date: 'Mon',
    mood: '🫶',
    title: 'Small product decisions',
  },
]

const featureNotes = [
  {
    icon: NotebookPen,
    label: 'Journal',
    text: 'Entries, moods, favorites, and dates stay easy to scan.',
  },
  {
    icon: Mic,
    label: 'Voice',
    text: 'Record thoughts and turn them into journal text when signed in.',
  },
  {
    icon: Sparkles,
    label: 'AI polish',
    text: 'Clean up rough writing without changing the meaning or tone.',
  },
]

function HomePage({
  entriesCount,
  onOpenJournal,
  onSignIn,
  onStartWriting,
  signedIn,
}) {
  const primaryLabel = signedIn ? 'Open journal' : 'Start writing'
  const entryLabel =
    entriesCount === 1 ? '1 saved entry' : `${entriesCount} saved entries`

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/82 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link
            className="text-[17px] font-semibold underline decoration-double underline-offset-2"
            style={{ fontFamily: "'Space Mono', monospace" }}
            to="/"
          >
            YapLog
          </Link>

          <nav
            className="flex items-center gap-1.5 text-sm"
            aria-label="Homepage navigation"
          >
            <Link
              className="hidden px-2.5 py-2 font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
              to="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="hidden px-2.5 py-2 font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
              to="/terms"
            >
              Terms
            </Link>
            {signedIn ? (
              <Button type="button" variant="secondary" onClick={onOpenJournal}>
                Open app
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={onSignIn}>
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative min-h-[92dvh] overflow-hidden border-b border-border pt-16 max-md:min-h-[84dvh]">
        <ProductPreviewBackdrop />

        <div className="relative z-10 mx-auto flex min-h-[calc(92dvh-4rem)] w-full max-w-6xl items-center px-5 py-14 max-md:min-h-[calc(84dvh-4rem)] max-md:items-start max-md:py-12">
          <div className="w-full min-w-0 max-w-[620px] pb-24 pt-10 max-md:pt-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-[8px] border border-border bg-background/76 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-md">
              <BookOpenText className="size-3.5" strokeWidth={2.3} />
              <span>{signedIn ? entryLabel : 'Private journaling workspace'}</span>
            </div>

            <h1
              className="whitespace-nowrap text-[56px] font-bold leading-[1.02] tracking-normal text-foreground max-sm:text-[40px]"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              YapLog
            </h1>
            <p className="mt-5 max-w-[540px] text-[18px] leading-8 text-muted-foreground max-sm:max-w-[340px] max-sm:text-base max-sm:leading-7">
              A calm place to journal, capture voice notes, and turn messy
              thoughts into readable entries.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button
                className="h-10 gap-2 px-3.5"
                type="button"
                onClick={signedIn ? onOpenJournal : onStartWriting}
              >
                <span>{primaryLabel}</span>
                <ArrowRight className="size-4" />
              </Button>
              {!signedIn && (
                <Button
                  className="h-10 px-3.5"
                  type="button"
                  variant="outline"
                  onClick={onSignIn}
                >
                  Sign in
                </Button>
              )}
            </div>

            <p className="mt-6 flex max-w-[520px] items-start gap-2 text-sm leading-6 text-muted-foreground max-sm:max-w-[340px]">
              <LockKeyhole className="mt-1 size-4 shrink-0" strokeWidth={2.2} />
              <span className="min-w-0">
                Guests write locally on this device. Signed-in journals sync
                through your account.
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">
            Built for the daily note
          </p>
          <h2 className="mt-3 max-w-md text-[30px] font-semibold leading-tight tracking-normal max-sm:max-w-[340px] max-sm:text-[26px]">
            Enough structure to return later. Not enough to get in the way.
          </h2>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          {featureNotes.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                className="rounded-[8px] border border-border bg-card p-4 text-card-foreground"
                key={feature.label}
              >
                <Icon className="size-5 text-muted-foreground" strokeWidth={2.2} />
                <h3 className="mt-4 text-sm font-semibold">{feature.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.text}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-border px-5 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span
            className="text-[17px] font-semibold text-foreground underline decoration-double underline-offset-2"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            YapLog
          </span>
          <div className="flex items-center gap-4">
            <Link className="hover:text-foreground" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-foreground" to="/terms">
              Terms
            </Link>
            <button
              className="font-medium text-foreground"
              type="button"
              onClick={signedIn ? onOpenJournal : onStartWriting}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ProductPreviewBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklch,var(--background)_88%,transparent)_38%,color-mix(in_oklch,var(--background)_56%,transparent)_100%)]" />
      <div className="absolute right-[-92px] top-[104px] w-[min(760px,70vw)] rotate-[-4deg] opacity-95 max-md:right-[-370px] max-md:top-[500px] max-md:w-[720px] max-md:opacity-30">
        <div className="overflow-hidden rounded-[8px] border border-border bg-background shadow-[0_32px_90px_oklch(0_0_0/16%)]">
          <div className="grid grid-cols-[188px_1fr] border-b border-border bg-muted/35">
            <div className="border-r border-border p-4">
              <span
                className="text-[15px] font-semibold underline decoration-double underline-offset-2"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                YapLog
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <NotebookPen className="size-4" />
              <span>Journal</span>
            </div>
          </div>

          <div className="grid grid-cols-[188px_1fr]">
            <aside className="border-r border-border bg-sidebar/70 p-3">
              {['Journal', 'Calendar', 'Tasks', 'Notes'].map((item, index) => (
                <div
                  className={`mb-1.5 flex h-9 items-center gap-2 rounded-[8px] px-2.5 text-sm ${
                    index === 0
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                  key={item}
                >
                  <span className="size-2 rounded-full bg-current opacity-35" />
                  <span>{item}</span>
                </div>
              ))}
            </aside>

            <div className="min-w-0 bg-background">
              <div className="flex items-end justify-between border-b border-border px-6 py-5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Workspace
                  </p>
                  <h2 className="mt-1 flex items-center gap-2 text-[28px] font-semibold leading-none">
                    <NotebookPen className="size-5 text-muted-foreground" />
                    Journal
                  </h2>
                </div>
                <span className="rounded-[8px] border border-border bg-secondary px-3 py-2 text-xs font-semibold">
                  New entry
                </span>
              </div>

              <div className="grid grid-cols-[1fr_300px]">
                <div className="min-w-0">
                  <div className="grid grid-cols-[1.45fr_0.55fr_0.7fr] border-b border-border bg-background/80 px-4 py-3 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpenText className="size-3.5" />
                      Entry
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="size-3.5" />
                      Mood
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Created
                    </span>
                  </div>
                  {previewEntries.map((entry) => (
                    <div
                      className="grid min-h-16 grid-cols-[1.45fr_0.55fr_0.7fr] items-center border-b border-border px-4 text-sm"
                      key={entry.title}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{entry.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {entry.body}
                        </p>
                      </div>
                      <span className="text-xl">{entry.mood}</span>
                      <span className="text-muted-foreground">{entry.date}</span>
                    </div>
                  ))}
                </div>

                <div className="border-l border-border p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mood</span>
                    <span className="text-xl">🙂</span>
                  </div>
                  <h3 className="mt-6 text-[26px] font-semibold leading-tight">
                    A calmer start
                  </h3>
                  <div className="mt-5 inline-flex rounded-[8px] border border-border bg-muted/45 p-1 text-xs font-semibold">
                    <span className="rounded-[6px] bg-background px-2.5 py-1.5 shadow-sm">
                      Original
                    </span>
                    <span className="px-2.5 py-1.5 text-muted-foreground">
                      AI polish
                    </span>
                  </div>
                  <p className="mt-6 text-sm leading-6 text-muted-foreground">
                    I walked first and opened the day more slowly. The entry can
                    stay rough until it needs a cleaner version.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
