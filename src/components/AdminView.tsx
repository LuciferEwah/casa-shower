'use client';

import { useState } from 'react';
import { Gift, Settings } from '@/types';
import { deleteGift, unreserveGift } from '@/app/actions/giftActions';
import { updateEventSettings } from '@/app/actions/eventActions';
import { GiftForm } from './GiftForm';
import { Button, Typography, Chip, Box, TextField, CircularProgress } from '@mui/material';

export function AdminView({ slug, gifts, settings }: { slug: string, gifts: Gift[], settings: Settings }) {
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleDelete = async (id: string) => {
    if (confirm("Seguro que quieres eliminar este regalo?")) {
      try {
        await deleteGift(slug, id);
      } catch (e: unknown) {
        if (e instanceof Error) alert(e.message);
      }
    }
  };

  const handleUnreserve = async (id: string) => {
    try {
      await unreserveGift(slug, id);
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await updateEventSettings(slug, formData);
      alert('Ajustes guardados correctamente');
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
    setSettingsLoading(false);
  };

  // Financial Dashboard calculations
  let totalMoney = 0;
  let totalReservedItems = 0;
  const uniqueGuests = new Set<string>();

  gifts.forEach(gift => {
    const count = gift.reservedCount || 0;
    if (count > 0) {
      totalMoney += gift.price * count;
      totalReservedItems += count;
    }
    
    if (gift.reservedByList) {
      gift.reservedByList.forEach(r => uniqueGuests.add(r.name));
    } else if (gift.reservedBy) {
      uniqueGuests.add(gift.reservedBy);
    }
  });

  return (
    <section className="admin-view w-full max-w-4xl mx-auto">
      
      {/* Financial Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Box className="p-6 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
          <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Monto Total</Typography>
          <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
            ${totalMoney.toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box className="p-6 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
          <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Regalos Reservados</Typography>
          <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
            {totalReservedItems}
          </Typography>
        </Box>
        <Box className="p-6 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
          <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Invitados Únicos</Typography>
          <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
            {uniqueGuests.size}
          </Typography>
        </Box>
      </div>

      {/* Ajustes Generales */}
      <div className="mb-8 p-6 sm:p-8 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
        <Typography variant="h6" className="font-bold mb-6 text-purple-900 dark:text-purple-100">Ajustes del Evento</Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <TextField
            label="Nombre del Evento"
            variant="outlined"
            value={formData.babyName}
            onChange={(e) => setFormData({...formData, babyName: e.target.value})}
            className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          />
          <TextField
            label="Emoji (ej: 👶)"
            variant="outlined"
            value={formData.babyEmoji}
            onChange={(e) => setFormData({...formData, babyEmoji: e.target.value})}
            className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          />
          <TextField
            label="Fecha del Evento"
            variant="outlined"
            value={formData.eventDate}
            onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
            className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          />
          <TextField
            label="Lugar del Evento"
            variant="outlined"
            value={formData.eventPlace}
            onChange={(e) => setFormData({...formData, eventPlace: e.target.value})}
            className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          />
        </div>
        <Button 
          variant="contained" 
          onClick={handleSaveSettings} 
          disabled={settingsLoading}
          size="large"
          className="mt-6 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 disabled:opacity-50"
        >
          {settingsLoading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Ajustes'}
        </Button>
      </div>
      
      <GiftForm slug={slug} key={editingGift ? editingGift.id : 'new'} editGift={editingGift} onSaved={() => setEditingGift(null)} />

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
              <div className="flex-1">
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">
                  {gift.name}
                </Typography>
                <Typography variant="body1" className="text-purple-600 dark:text-purple-400 font-bold mb-2">
                  ${gift.price} {gift.unlimited && <span className="text-slate-400 font-medium ml-1">• Ilimitado</span>}
                </Typography>
                {(gift.reservedCount && gift.reservedCount > 0) ? (
                  <Chip 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                    label={`Reservado (${gift.reservedCount})`} 
                    className="font-bold border-fuchsia-300 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300"
                  />
                ) : null}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-center md:justify-end">
              <Button size="medium" variant="outlined" color="primary" className="flex-1 md:flex-none rounded-full font-bold px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => setEditingGift(gift)}>
                Editar
              </Button>
              <Button size="medium" variant="outlined" color="error" className="flex-1 md:flex-none rounded-full font-bold px-6 bg-white/50 dark:bg-slate-900/50" onClick={() => handleDelete(gift.id)}>
                Eliminar
              </Button>
              {(gift.reservedCount && gift.reservedCount > 0) ? (
                <Button size="medium" variant="contained" color="secondary" className="w-full md:w-auto rounded-full font-bold px-6 shadow-md" onClick={() => handleUnreserve(gift.id)}>
                  Liberar
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
