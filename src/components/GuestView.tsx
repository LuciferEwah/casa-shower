'use client';

import { Gift } from '@/types';
import { GiftCard } from './GiftCard';

export function GuestView({ slug, gifts }: { slug: string, gifts: Gift[] }) {
  return (
    <section className="guest-view w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {gifts.map(gift => (
          <GiftCard key={gift.id} slug={slug} gift={gift} />
        ))}
      </div>
    </section>
  );
}
