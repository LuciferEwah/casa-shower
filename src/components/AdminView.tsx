'use client';

import { useState } from 'react';
import { Gift, Settings } from '@/types';
import { deleteGift, unreserveGift } from '@/app/actions/giftActions';
import { updateEventSettings } from '@/app/actions/eventActions';
import { GiftForm } from './GiftForm';
import { Button, Typography, Chip, Box, TextField, CircularProgress, Snackbar, Alert } from '@mui/material';

export function AdminView({ slug, gifts, settings }: { slug: string, gifts: Gift[], settings: Settings }) {
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [formData, setFormData] = useState(settings);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState<'gifts' | 'analytics' | 'settings'>('gifts');

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Seguro que quieres eliminar este regalo?")) {
      try {
        await deleteGift(slug, id);
        showToast('Regalo eliminado', 'success');
      } catch (e: unknown) {
        if (e instanceof Error) showToast(e.message, 'error');
      }
    }
  };

  const handleUnreserve = async (id: string) => {
    try {
      await unreserveGift(slug, id);
      showToast('Regalo liberado', 'success');
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message, 'error');
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      await updateEventSettings(slug, formData);
      showToast('Ajustes guardados correctamente', 'success');
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message, 'error');
    }
    setSettingsLoading(false);
  };

  // Financial Dashboard calculations
  let totalMoney = 0;
  let totalReservedItems = 0;
  const guestsMap = new Map<string, { total: number, items: string[] }>();

  gifts.forEach(gift => {
    const count = gift.reservedCount || 0;
    if (count > 0) {
      totalMoney += gift.price * count;
      totalReservedItems += count;
    }
    
    if (gift.reservedByList) {
      gift.reservedByList.forEach(r => {
        const guest = guestsMap.get(r.name) || { total: 0, items: [] };
        guest.total += gift.price;
        guest.items.push(gift.name);
        guestsMap.set(r.name, guest);
      });
    } else if (gift.reservedBy) {
      const guest = guestsMap.get(gift.reservedBy) || { total: 0, items: [] };
      guest.total += gift.price;
      guest.items.push(gift.name);
      guestsMap.set(gift.reservedBy, guest);
    }
  });
  
  const uniqueGuests = Array.from(guestsMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);

  return (
    <section className="admin-view w-full max-w-4xl mx-auto">
      
      {/* Menu Tabs */}
      <div className="flex justify-start sm:justify-center gap-2 mb-8 bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl sm:rounded-full backdrop-blur-md shadow-sm overflow-x-auto">
        <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'gifts' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('gifts')}>🎁 Regalos</button>
        <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'analytics' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('analytics')}>📊 Análisis</button>
        <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('settings')}>⚙️ Ajustes</button>
      </div>

      {currentTab === 'analytics' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Financial Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Box className="p-6 sm:p-8 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
              <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Monto Total</Typography>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
                ${totalMoney.toLocaleString('es-CL')}
              </Typography>
            </Box>
            <Box className="p-6 sm:p-8 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
              <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Regalos Reservados</Typography>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
                {totalReservedItems}
              </Typography>
            </Box>
            <Box className="p-6 sm:p-8 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 text-center shadow-md">
              <Typography variant="body2" className="text-purple-600 dark:text-purple-400 uppercase tracking-wide font-bold mb-1">Invitados Únicos</Typography>
              <Typography variant="h4" className="font-bold text-slate-800 dark:text-slate-100">
                {uniqueGuests.length}
              </Typography>
            </Box>
          </div>

          <div className="p-6 sm:p-8 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
            <Typography variant="h6" className="font-bold mb-6 text-purple-900 dark:text-purple-100">Detalle de Invitados</Typography>
            {uniqueGuests.length === 0 ? (
              <Typography className="text-slate-500 text-center py-8">Aún no hay invitados que hayan reservado regalos.</Typography>
            ) : (
              <div className="flex flex-col gap-4">
                {uniqueGuests.map(guest => (
                  <div key={guest.name} className="p-4 sm:p-5 rounded-[1.5rem] bg-white/60 dark:bg-slate-800/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm border border-white/30 dark:border-slate-700/30">
                    <div>
                      <Typography className="font-bold text-slate-800 dark:text-slate-100 text-lg">{guest.name}</Typography>
                      <Typography variant="body2" className="text-purple-600 dark:text-purple-400 font-medium">
                        {guest.items.join(', ')}
                      </Typography>
                    </div>
                    <Typography className="font-bold text-xl text-slate-800 dark:text-slate-100">
                      ${guest.total.toLocaleString('es-CL')}
                    </Typography>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 p-6 sm:p-10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
            <Typography variant="h5" className="font-bold mb-8 text-purple-900 dark:text-purple-100">Ajustes del Evento</Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <TextField
                label="Nombre del Evento"
                variant="outlined"
                value={formData.babyName}
                onChange={(e) => setFormData({...formData, babyName: e.target.value})}
                className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
              />
              <TextField
                label="Emoji (ej: 🏠)"
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
              color="primary"
              onClick={handleSaveSettings} 
              disabled={settingsLoading}
              size="large"
              className="w-full sm:w-auto mt-8 px-10 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 disabled:opacity-50"
            >
              {settingsLoading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Ajustes'}
            </Button>
          </div>
        </div>
      )}

      {currentTab === 'gifts' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GiftForm slug={slug} key={editingGift ? editingGift.id : 'new'} editGift={editingGift} onSaved={() => setEditingGift(null)} />

          <div className="flex flex-col gap-5 mt-10">
            {gifts.map(gift => (
              <div key={gift.id} className="flex flex-col md:flex-row items-center justify-between p-5 sm:p-6 rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-md transition-all hover:shadow-lg">
                <div className="flex items-center gap-6 mb-6 md:mb-0 w-full md:w-auto">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-purple-100/50 dark:bg-purple-900/30 overflow-hidden flex-shrink-0 border border-white/60 dark:border-purple-800 shadow-sm">
                    {gift.image ? (
                      <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Typography variant="h6" className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 text-lg sm:text-xl">
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
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-center md:justify-end">
                  <Button size="large" variant="outlined" color="primary" className="w-full sm:w-auto rounded-full font-bold px-8 py-2.5 sm:py-3 bg-white/50 dark:bg-slate-900/50 shadow-sm" onClick={() => setEditingGift(gift)}>
                    Editar
                  </Button>
                  <Button size="large" variant="outlined" color="error" className="w-full sm:w-auto rounded-full font-bold px-8 py-2.5 sm:py-3 bg-white/50 dark:bg-slate-900/50 shadow-sm" onClick={() => handleDelete(gift.id)}>
                    Eliminar
                  </Button>
                  {(gift.reservedCount && gift.reservedCount > 0) ? (
                    <Button size="large" variant="contained" color="secondary" className="w-full sm:w-auto rounded-full font-bold px-8 py-2.5 sm:py-3 shadow-md" onClick={() => handleUnreserve(gift.id)}>
                      Liberar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity} 
          variant="filled"
          className="rounded-xl shadow-lg"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  );
}
