import { Link, Navigate } from 'react-router-dom'

const lastUpdated = 'June 4, 2026'
const contactEmail = 'yaplog@agentmail.to'

const legalPages = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'YapLog is designed for private journaling and personal organization. This policy explains what data the app handles and how current features process it.',
    sections: [
      {
        heading: 'Information YapLog Handles',
        paragraphs: [
          'YapLog may store account details such as your email address, display name, avatar, and authentication profile when you sign in.',
          'YapLog stores the content you create in the app, including journal entries, mood and favorite metadata, tasks, memos, calendar-related data, imported data, and app settings.',
          'If you use YapLog as a guest, your data is stored locally in your browser on that device. If you sign in, your data may be synced through the cloud.',
        ],
      },
      {
        heading: 'AI Features',
        paragraphs: [
          'When you use AI title generation or journal polishing, the relevant journal text is sent to third-party AI providers so they can generate the requested result.',
          'YapLog currently may use Google Gemini directly and OpenRouter as a fallback for text AI features. These providers process the submitted text according to their own terms and policies.',
          'AI output can be inaccurate or unexpected. You should review generated titles, polished journal text, and transcripts before saving or relying on them.',
        ],
      },
      {
        heading: 'Voice Input And Transcription',
        paragraphs: [
          'When you record or upload audio for transcription, YapLog temporarily uploads the audio file so it can be processed.',
          'YapLog currently uses Supabase Storage for temporary voice files and Groq for audio transcription.',
          'Temporary voice files are intended to be deleted after transcription processing completes. The resulting transcript may be appended to your journal entry if you choose to use it.',
        ],
      },
      {
        heading: 'Service Providers',
        paragraphs: [
          'YapLog currently uses service providers including Supabase for authentication, database, and storage; Netlify for hosting and serverless functions; Google Gemini and OpenRouter for AI text features; Groq for transcription; and AgentMail for authentication emails.',
          'These providers may process data only as needed to provide the related YapLog feature.',
        ],
      },
      {
        heading: 'Export, Import, And Deletion',
        paragraphs: [
          'YapLog includes export and import tools so you can keep a copy of your data or move data between storage modes.',
          'You may delete entries or other content inside the app. Account deletion and full cloud data deletion may require additional controls or a direct request, depending on the current version of YapLog.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'YapLog uses server-side environment variables for provider API keys and uses access controls such as Supabase authentication and storage policies for cloud-backed features.',
          'No app can guarantee perfect security. You should avoid storing information in YapLog that you cannot risk processing through the listed providers.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'YapLog is not intended for children under 18. Do not use YapLog if you are under 18 or are not old enough to consent to the processing of your personal data in your location.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'This Privacy Policy may change as YapLog changes. The “Last updated” date will be revised when the policy is updated.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          `For privacy questions or data requests, contact YapLog at ${contactEmail}.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms describe the basic rules for using YapLog in its current version.',
    sections: [
      {
        heading: 'About YapLog',
        paragraphs: [
          'YapLog is a private journaling and personal organization app. It currently includes journal entries, mood metadata, favorites, local and cloud data modes, import and export tools, AI-assisted writing features, and voice transcription features.',
        ],
      },
      {
        heading: 'Your Account',
        paragraphs: [
          'You are responsible for the activity that happens through your account and for keeping your sign-in credentials secure.',
          'If you use YapLog without signing in, your guest data is stored locally in your browser and may not be recoverable if the browser data is cleared.',
        ],
      },
      {
        heading: 'Your Content',
        paragraphs: [
          'You keep ownership of the journal entries, tasks, memos, audio, transcripts, and other content you create in YapLog.',
          'You give YapLog permission to store, process, transmit, and display your content only as needed to provide the app features you use, including sync, AI polishing, title generation, transcription, import, and export.',
        ],
      },
      {
        heading: 'AI And Transcription',
        paragraphs: [
          'YapLog may send relevant text or audio to third-party providers to generate titles, polish entries, or transcribe voice input.',
          'AI and transcription results may contain mistakes, omissions, or wording you did not intend. You are responsible for reviewing results before saving or using them.',
        ],
      },
      {
        heading: 'Acceptable Use',
        paragraphs: [
          'Do not use YapLog to break the law, abuse the service, attack other systems, upload malicious files, or attempt to bypass provider limits or security controls.',
          'Do not use YapLog in a way that would harm the app, its users, or its service providers.',
        ],
      },
      {
        heading: 'Service Availability',
        paragraphs: [
          'YapLog is provided as-is. Features may change, break, be rate-limited, or become unavailable, especially features that depend on third-party providers.',
          'The app may include experimental or unfinished features as development continues.',
        ],
      },
      {
        heading: 'No Professional Advice',
        paragraphs: [
          'YapLog is for journaling and personal organization. It does not provide medical, legal, financial, mental health, or other professional advice.',
        ],
      },
      {
        heading: 'Termination',
        paragraphs: [
          'Access to YapLog may be limited or terminated if the app is abused, if these terms are violated, or if required by a service provider or applicable law.',
        ],
      },
      {
        heading: 'Limitation of Liability',
        paragraphs: [
          'To the fullest extent allowed by law, YapLog is not responsible for lost data, inaccurate AI output, service interruptions, provider failures, or damages that result from using or being unable to use the app.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'These Terms may change as YapLog changes. The “Last updated” date will be revised when the terms are updated.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          `For questions about these Terms, contact YapLog at ${contactEmail}.`,
        ],
      },
    ],
  },
}

function LegalPage({ type }) {
  const page = legalPages[type]

  if (!page) {
    return <Navigate to="/journal" replace />
  }

  return (
    <main className="h-dvh overflow-y-auto bg-background text-foreground [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
      <header className="sticky top-0 z-30 border-b border-border bg-background/82 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-5">
          <Link
            className="text-[17px] font-semibold underline decoration-double underline-offset-2"
            style={{ fontFamily: "'Space Mono', monospace" }}
            to="/journal"
          >
            YapLog
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            to="/journal"
          >
            Back to app
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-5 py-10 max-sm:py-8">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <h1 className="text-4xl font-bold tracking-normal max-sm:text-3xl">
          {page.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {page.intro}
        </p>

        <div className="mt-10 grid gap-8">
          {page.sections.map((section) => (
            <section className="grid gap-3" key={section.heading}>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  className="text-base leading-7 text-muted-foreground"
                  key={paragraph}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}

export default LegalPage
