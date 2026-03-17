'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBar } from './SearchBar';

function Breadcrumb() {
  const pathname = usePathname();

  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];

  parts.forEach((part, i) => {
    const href = '/' + parts.slice(0, i + 1).join('/');
    let label = part.charAt(0).toUpperCase() + part.slice(1);
    if (part === 'track') label = 'Track';
    if (part === 'artist') label = 'Artist';
    if (part === 'album') label = 'Album';
    if (part === 'producer') label = 'Producer';
    if (part === 'settings') label = 'Settings';
    if (part.length > 20) label = '...';
    crumbs.push({ label, href });
  });

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-600">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="text-gray-200">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-200 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent-spotify flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm hidden sm:block">
              Music Deep Dive
            </span>
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Breadcrumb */}
          <div className="hidden sm:block">
            <Breadcrumb />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-bg-hover transition-colors"
            >
              Home
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-bg-hover transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
