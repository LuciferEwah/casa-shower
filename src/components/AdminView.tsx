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

  const handleUnreserve = async (id: string, unlimited: boolean) => {
    try {
      await unreserveGift(id, unlimited);
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
  };

  return (
    <section className="admin-view w-full max-w-4xl mx-auto">
      
      <GiftForm key={editingGift ? editingGift.id : 'new'} editGift={editingGift} onSaved={() => setEditingGift(null)} />

      <div className="flex flex-col gap-5 mt-10">
        {gifts.map(gift => (
          <div key={gift.id} className="flex flex-col md:flex-row items-center justify-between p-5 rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center gap-6 mb-6 md:mb-0 w-full md:w-auto">
              <div className="w-24 h-24 rounded-2xl bg-purple-100/50 dark:bg-purple-900/30 overflow-hidden flex-shrink-0 border border-white/60 dark:border-purple-800 shadow-sm">
                {gift.image ? (
                  <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                )}
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">
                  {gift.name}
                </Typography>
                <Typography variant="body1" className="text-purple-600 dark:text-purple-400 font-bold mb-2">
                  ${gift.price} {gift.unlimited && <span className="text-slate-400 font-medium ml-1">• Ilimitado</span>}
                </Typography>
                {(gift.reservedBy || (gift.reservedByList && gift.reservedByList.length > 0)) && (
                  <Chip 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                    label={`Reservado (${gift.unlimited ? gift.reservedByList?.length : '1'})`} 
                    className="font-bold border-fuchsia-300 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300"
                  />
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end w-full md:w-auto">
              <Button size="medium" variant="outlined" color="primary" className="rounded-full font-bold px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => setEditingGift(gift)}>
                Editar
              </Button>
              <Button size="medium" variant="outlined" color="error" className="rounded-full font-bold px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => handleDelete(gift.id)}>
                Eliminar
              </Button>
              {(gift.reservedBy || (gift.reservedByList && gift.reservedByList.length > 0)) && (
                <Button size="medium" variant="contained" color="secondary" className="rounded-full font-bold px-6 shadow-md" onClick={() => handleUnreserve(gift.id, gift.unlimited)}>
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
