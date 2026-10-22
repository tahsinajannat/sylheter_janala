'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Minimal tab switcher; every panel is rendered by the server and passed in. */
export function SimpleTabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" className="mb-4 inline-flex rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', active === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
