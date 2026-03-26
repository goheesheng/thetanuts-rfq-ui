import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="max-w-[700px] mx-auto p-8">
      <div className="flex flex-col gap-6 py-12 md:py-20">
        <pre className="text-[var(--color-accent-green)] text-sm leading-relaxed">
{` _____ _          _                    _
|_   _| |__   ___| |_ __ _ _ __  _   _| |_ ___
  | | | '_ \\ / _ \\ __/ _\` | '_ \\| | | | __/ __|
  | | | | | |  __/ || (_| | | | | |_| | |_\\__ \\
  |_| |_| |_|\\___|\\__\\__,_|_| |_|\\__,_|\\__|___/
  ____  _____ ___
 |  _ \\|  ___|/ _ \\
 | |_) | |_ | | | |
 |  _ <|  _|| |_| |
 |_| \\_\\_|   \\__\\_\\`}
        </pre>

        <div className="text-[var(--color-text-secondary)] text-sm space-y-1">
          <p>{'>'} rfq trading ui for the thetanuts optionfactory contract</p>
          <p>{'>'} create rfqs | receive encrypted offers | settle on-chain options on base</p>
        </div>

        <div className="flex gap-4 mt-4 flex-wrap">
          <Link href="/trade" prefetch>
            <span className="cursor-pointer text-sm border border-[var(--color-accent-green)] text-[var(--color-accent-green)] px-4 py-2 hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)]">
              {'>'} start trading
            </span>
          </Link>
          <Link href="/mm" prefetch>
            <span className="cursor-pointer text-sm border border-[var(--color-border-emphasis)] text-[var(--color-text-secondary)] px-4 py-2 hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              {'>'} mm console
            </span>
          </Link>
          <Link href="/events" prefetch>
            <span className="cursor-pointer text-sm border border-[var(--color-border-emphasis)] text-[var(--color-text-secondary)] px-4 py-2 hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              {'>'} live events
            </span>
          </Link>
        </div>

        <div className="mt-8 text-[var(--color-text-tertiary)] text-xs space-y-0.5">
          <p>$ echo &quot;rfq lifecycle: create → offer → reveal → settle&quot;</p>
          <p className="text-[var(--color-text-secondary)]">rfq lifecycle: create → offer → reveal → settle</p>
        </div>
      </div>
    </div>
  );
}
