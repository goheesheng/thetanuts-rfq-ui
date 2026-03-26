'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppKitButton } from '@reown/appkit/react';
import ColorModeToggle from './ColorModeToggle';

const pageLinks = [
  { href: '/trade', label: 'trade' },
  { href: '/history', label: 'history' },
  { href: '/mm', label: 'mm console' },
  { href: '/events', label: 'events' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] px-4 sticky top-0 z-[100]">
      <div className="flex items-center max-w-[1400px] mx-auto h-10">
        <Link href="/">
          <span className="text-[var(--color-accent-green)] font-bold mr-6 cursor-pointer tracking-tight">
            thetanuts<span className="text-[var(--color-text-tertiary)]">/</span>rfq<span className="text-[var(--color-text-tertiary)]">_</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0 flex-1">
          <span className="text-[var(--color-text-tertiary)] mr-1">~/</span>
          {pageLinks.map((link, i) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <span key={link.href} className="flex items-center">
                {i > 0 && <span className="text-[var(--color-text-tertiary)] mx-1">/</span>}
                <Link href={link.href} prefetch>
                  <span className={`cursor-pointer text-xs ${
                    isActive
                      ? 'text-[var(--color-text-primary)] font-bold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <ColorModeToggle />
          <AppKitButton size="sm" balance="show" />
        </div>
      </div>
    </header>
  );
}
