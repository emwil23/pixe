import type { ReactNode } from 'react'

function Page({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <article className="[&_h2]:font-display [&_p]:text-muted [&_ul]:text-muted mx-auto max-w-3xl px-6 pt-36 pb-28 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-3xl [&_li]:mt-2 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <p className="spec text-accent-text">Last updated {updated}</p>
      <h1 className="font-display mt-4 text-6xl">{title}</h1>
      {children}
    </article>
  )
}

export function Privacy() {
  return (
    <Page title="Privacy" updated="19 October 2026">
      <p>
        The short version: your boards stay on your device, and images you drop in are never
        uploaded. We don't run ads, trackers or analytics.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Boards, notes, palettes, briefs and settings are stored in your browser (IndexedDB and local
        storage). Images you drop on the Palette page are read in your browser and never leave it.
        Clearing your browser data deletes your boards.
      </p>

      <h2>Photo search</h2>
      <p>
        Searches go through our server (ew-apps-api) to Unsplash, Pexels and Openverse, so our API
        keys stay private. Each service sees the search words, not who you are. The photos then load
        straight from that service's servers, which see your IP address like any website would. When
        you export a board, we tell Unsplash which of its photos were downloaded, as its rules
        require.
      </p>
      <p>
        Font cards load their fonts from Google Fonts (fonts.googleapis.com), which sees your IP
        address.
      </p>

      <h2>When you use the AI</h2>
      <p>
        You choose the provider in Settings. The AI only ever sees what you typed as a vibe or
        search, the text on your board (titles, notes, alt text, tags, colours, font names) and{' '}
        <strong>public stock photos</strong> from Unsplash, Pexels and Openverse. Images you upload
        are never sent to any AI.
      </p>
      <ul>
        <li>
          <strong>Pixe AI (free)</strong> runs through our server on Google's Gemini API free tier.{' '}
          <strong>
            Google may read and use prompts sent on the free tier to improve its products
          </strong>
          , so don't put personal or sensitive details in vibes or notes you send to the AI. You
          sign in with an email code or a passkey (Supabase) so we can count your daily calls; we
          store your email, a user id, the date you confirmed you're 18 or over, a per-day call
          count and, if you add one, your passkey's public key. Nothing else. You can delete all of
          it any time from Settings. This option is not offered in the EEA, the UK or Switzerland,
          or to anyone under 18.
        </li>
        <li>
          <strong>Puter</strong>, <strong>OpenRouter</strong> and <strong>your own key</strong> send
          requests straight from your browser to that service, under its own privacy policy. Keys
          are stored only in your browser.
        </li>
      </ul>

      <h2>Our server</h2>
      <p>
        Our API logs the time, route and status of requests to keep it running, and uses your IP
        address in memory to apply rate limits and the region rule. Search results are cached in
        memory for an hour. We don't sell or share data.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or deletion requests: reach Emmanuel via{' '}
        <a className="text-accent-text underline" href="https://emmanuelwilson.tech">
          emmanuelwilson.tech
        </a>
        .
      </p>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="Terms" updated="19 October 2026">
      <p>
        Pixe is open-source software provided as is, without warranty. By using it you agree to
        these terms.
      </p>
      <h2>Photos and licences</h2>
      <p>
        Pixe doesn't own or host the photos. Unsplash and Pexels photos are under the{' '}
        <a className="text-accent-text underline" href="https://unsplash.com/license">
          Unsplash licence
        </a>{' '}
        and the{' '}
        <a className="text-accent-text underline" href="https://www.pexels.com/license/">
          Pexels licence
        </a>
        . Openverse photos carry the Creative Commons licence shown on each one, which may forbid
        commercial use or changes. Openverse doesn't check licences, so check the photo's own page
        before you use it. Keep the credit lines Pixe shows.
      </p>
      <h2>Your boards</h2>
      <p>Your boards are yours and live on your device. You are responsible for backing them up.</p>
      <h2>The AI</h2>
      <p>
        AI descriptions, briefs and font suggestions can be wrong. Check them before you rely on
        them. Fair-use limits apply to the free AI server, and we may change or pause it.
      </p>
      <h2>Pro</h2>
      <p>
        When Pro launches, its price and refund rules will be shown at checkout. Pro never unlocks
        the AI itself; that stays free.
      </p>
      <h2>Licence</h2>
      <p>
        The source code is MIT-licensed. The Pixe name, logo and character artwork belong to
        EWSTUDIOS.
      </p>
    </Page>
  )
}
