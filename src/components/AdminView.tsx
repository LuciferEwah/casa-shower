'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { deleteGift, unreserveGift } from '@/app/actions/giftActions';
import { GiftForm } from './GiftForm';
import { Button, Typography, Chip } from '@mui/material';

export function AdminView({ gifts }: { gifts: Gift[] }) {
  const [editingGift, setEditingGift] = useState<Gift | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Seguro que quieres eliminar este regalo?")) {
      try {
        await deleteGift(id);
      } catch (e: unknown) {
        if (e instanceof Error) alert(e.message);
      }
    }
  };

  const handleUnreserve = async (id: string) => {
    try {
      await unreserveGift(id);
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
  };

  return (
    <section className="admin-view w-full max-w-4xl mx-auto">
      
      <GiftForm key={editingGift ? editingGift.id : 'new'} editGift={editingGift} onSaved={() => setEditingGift(null)} />

      <div className="flex flex-col gap-4 mt-8 sm:mt-12">
        {gifts.map(gift => (
          <div key={gift.id} className="flex flex-col md:flex-row items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4 sm:gap-6 mb-4 md:mb-0 w-full md:w-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                {gift.image ? (
                  <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🎁</div>
                )}
              </div>
              <div className="flex-1">
                <Typography variant="subtitle1" className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-1">
                  {gift.name}
                </Typography>
                <Typography variant="body2" className="text-zinc-600 dark:text-zinc-400 font-medium mb-2">
                  ${gift.price} {gift.unlimited && <span className="text-zinc-400 ml-1">• Ilimitado</span>}
                </Typography>
                {(gift.reservedBy || (gift.reservedByList && gift.reservedByList.length > 0)) && (
                  <Chip 
                    size="small" 
                    variant="outlined" 
                    label={`Reservado (${gift.unlimited ? gift.reservedByList?.length : '1'})`} 
                    className="font-semibold border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                  />
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Button size="small" variant="outlined" color="inherit" className="flex-1 md:flex-none rounded-full font-bold px-4 border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800" onClick={() => setEditingGift(gift)}>
                Editar
              </Button>
              <Button size="small" variant="outlined" color="error" className="flex-1 md:flex-none rounded-full font-bold px-4 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(gift.id)}>
                Eliminar
              </Button>
              {(gift.reservedBy || (gift.reservedByList && gift.reservedByList.length > 0)) && (
                <Button size="small" variant="contained" color="inherit" className="w-full md:w-auto rounded-full font-bold px-4 shadow-sm bg-zinc-200 hover:bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100" onClick={() => handleUnreserve(gift.id)}>
                  Liberar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
