'use client';

import { useState, useMemo } from 'react';
import { Gift, Settings } from '@/types';
import { deleteGift, unreserveGift, adminRemoveReservationIndex, adminRemoveReservationByEmail } from '@/app/actions/giftActions';
import { updateEventSettings } from '@/app/actions/eventActions';
import { GiftForm } from './GiftForm';
import { Button, Typography, Chip, Box, TextField, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const ADMIN_GIFTS_PAGE_SIZE = 10;

export function AdminView({ slug, gifts, settings }: { slug: string, gifts: Gift[], settings: Settings }) {
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [formData, setFormData] = useState(settings);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState<'gifts' | 'analytics' | 'settings'>('gifts');
  const [guestSearch, setGuestSearch] = useState('');
  const [giftSearch, setGiftSearch] = useState('');
  const [giftPage, setGiftPage] = useState(1);
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleDelete = async (id: string) => {
    confirmAction("Eliminar Regalo", "¿Seguro que quieres eliminar este regalo? Esta acción no se puede deshacer.", async () => {
      try {
        await deleteGift(slug, id);
        showToast('Regalo eliminado', 'success');
      } catch (e: unknown) {
        if (e instanceof Error) showToast(e.message, 'error');
      }
    });
  };

  const handleUnreserve = async (id: string) => {
    confirmAction("Liberar Todas las Reservas", "¿Seguro que quieres liberar TODAS las reservas de este regalo? Volverá a estar disponible para todos.", async () => {
      try {
        await unreserveGift(slug, id);
        showToast('Reservas liberadas', 'success');
      } catch (e: unknown) {
        if (e instanceof Error) showToast(e.message, 'error');
      }
    });
  };

  const handleRemoveIndividual = async (id: string, index: number) => {
    confirmAction("Eliminar Reserva Individual", "¿Quieres eliminar 1 reserva de esta persona para este regalo?", async () => {
      try {
        await adminRemoveReservationIndex(slug, id, index);
        showToast('Reserva individual eliminada', 'success');
      } catch (e: unknown) {
        if (e instanceof Error) showToast(e.message, 'error');
      }
    });
  };

  const handleRemoveAll = async (id: string, identifier: string) => {
    confirmAction("Eliminar Todas las Reservas", "¿Quieres eliminar TODAS las reservas de esta persona para este regalo?", async () => {
      try {
        await adminRemoveReservationByEmail(slug, id, identifier);
        showToast('Todas las reservas eliminadas', 'success');
      } catch (e: unknown) {
        if (e instanceof Error) showToast(e.message, 'error');
      }
    });
  };

  const getGroupedReservations = (list: { name: string, email?: string, animal?: string }[]) => {
    const groups: Record<string, { name: string, email?: string, animal?: string, count: number, indices: number[] }> = {};
    list.forEach((res, idx) => {
      const key = res.email ? res.email.toLowerCase() : res.name.toLowerCase();
      if (!groups[key]) {
        groups[key] = { ...res, count: 0, indices: [] };
      }
      groups[key].count += 1;
      groups[key].indices.push(idx);
    });
    return Object.values(groups);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
    showToast('¡Link copiado al portapapeles!', 'success');
  };

  // Financial Dashboard calculations
  let totalMoney = 0;
  let totalReservedItems = 0;
  const guestsMap = new Map<string, { email?: string, total: number, items: { name: string, giftId: string }[] }>();

  gifts.forEach(gift => {
    const count = gift.reservedCount || 0;
    if (count > 0) {
      totalMoney += gift.price * count;
      totalReservedItems += count;
    }
    
    if (gift.reservedByList) {
      gift.reservedByList.forEach(r => {
        const guest = guestsMap.get(r.name) || { email: r.email, total: 0, items: [] };
        guest.total += gift.price;
        guest.items.push({ name: gift.name, giftId: gift.id });
        if (r.email) guest.email = r.email; // Ensure email is captured
        guestsMap.set(r.name, guest);
      });
    } else if (gift.reservedBy) {
      const guest = guestsMap.get(gift.reservedBy) || { email: gift.reservedByEmail || undefined, total: 0, items: [] };
      guest.total += gift.price;
      guest.items.push({ name: gift.name, giftId: gift.id });
      if (gift.reservedByEmail) guest.email = gift.reservedByEmail;
      guestsMap.set(gift.reservedBy, guest);
    }
  });
  
  const uniqueGuests = Array.from(guestsMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);

  const getGroupedGuestItems = (items: { name: string, giftId: string }[]) => {
    const groups: Record<string, { name: string, giftId: string, count: number }> = {};
    items.forEach(item => {
      if (!groups[item.giftId]) {
        groups[item.giftId] = { ...item, count: 0 };
      }
      groups[item.giftId].count += 1;
    });
    return Object.values(groups);
  };

  const filteredUniqueGuests = uniqueGuests.filter(g => 
    g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
    (g.email && g.email.toLowerCase().includes(guestSearch.toLowerCase()))
  );

  const filteredAdminGifts = useMemo(() => {
    const q = giftSearch.trim().toLowerCase();
    if (!q) return gifts;
    return gifts.filter((g) => {
      const name = (g.name || '').toLowerCase();
      const link = (g.link || '').toLowerCase();
      const price = String(g.price ?? '');
      return name.includes(q) || link.includes(q) || price.includes(q);
    });
  }, [gifts, giftSearch]);

  const giftTotalPages = Math.max(1, Math.ceil(filteredAdminGifts.length / ADMIN_GIFTS_PAGE_SIZE));
  const giftSafePage = Math.min(Math.max(1, giftPage), giftTotalPages);
  const pagedAdminGifts = useMemo(() => {
    const start = (giftSafePage - 1) * ADMIN_GIFTS_PAGE_SIZE;
    return filteredAdminGifts.slice(start, start + ADMIN_GIFTS_PAGE_SIZE);
  }, [filteredAdminGifts, giftSafePage]);

  const giftPageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    if (giftTotalPages <= 7) {
      for (let i = 1; i <= giftTotalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (giftSafePage > 3) pages.push('…');
    for (
      let i = Math.max(2, giftSafePage - 1);
      i <= Math.min(giftTotalPages - 1, giftSafePage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (giftSafePage < giftTotalPages - 2) pages.push('…');
    pages.push(giftTotalPages);
    return pages;
  }, [giftSafePage, giftTotalPages]);

  return (
    <section className="admin-view w-full max-w-7xl mx-auto">
      
      {/* Menu Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex justify-start sm:justify-center gap-2 bg-white/40 dark:bg-slate-900/40 p-1.5 rounded-2xl sm:rounded-full backdrop-blur-md shadow-sm overflow-x-auto w-full sm:w-auto">
          <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'gifts' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('gifts')}>🎁 Regalos</button>
          <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'analytics' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('analytics')}>📊 Análisis</button>
          <button className={`whitespace-nowrap px-6 py-2.5 rounded-xl sm:rounded-full font-bold transition-all ${currentTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`} onClick={() => setCurrentTab('settings')}>⚙️ Ajustes</button>
        </div>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={handleCopyLink}
          className="whitespace-nowrap rounded-full font-bold px-6 py-2 border-2 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 w-full sm:w-auto"
        >
          🔗 Copiar Link de Invitados
        </Button>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <Typography variant="h6" className="font-bold text-purple-900 dark:text-purple-100">Detalle de Invitados</Typography>
              <TextField 
                size="small"
                variant="outlined"
                placeholder="Buscar por nombre o correo..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl w-full sm:w-64"
              />
            </div>
            
            {uniqueGuests.length === 0 ? (
              <Typography className="text-slate-500 text-center py-8">Aún no hay invitados que hayan reservado regalos.</Typography>
            ) : filteredUniqueGuests.length === 0 ? (
              <Typography className="text-slate-500 text-center py-8">No se encontraron invitados con esa búsqueda.</Typography>
            ) : (
              <TableContainer component={Paper} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <Table size="medium">
                  <TableHead className="bg-purple-100/50 dark:bg-purple-900/20">
                    <TableRow>
                      <TableCell className="font-bold text-purple-900 dark:text-purple-100">Nombre</TableCell>
                      <TableCell className="font-bold text-purple-900 dark:text-purple-100">Correo</TableCell>
                      <TableCell className="font-bold text-purple-900 dark:text-purple-100">Regalos Reservados</TableCell>
                      <TableCell align="right" className="font-bold text-purple-900 dark:text-purple-100">Total Gastado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUniqueGuests.map((guest) => (
                      <TableRow key={guest.name} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-700/50">{guest.name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50">{guest.email || '-'}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50 max-w-[400px]">
                          <div className="flex flex-wrap gap-2">
                            {getGroupedGuestItems(guest.items).map((item) => (
                              <Chip 
                                key={item.giftId} 
                                label={`${item.name} ${item.count > 1 ? `(x${item.count})` : ''}`}
                                size="small"
                                onDelete={() => handleRemoveAll(item.giftId, guest.email || guest.name)}
                                className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800/50 font-medium"
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell align="right" className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-700/50">
                          ${guest.total.toLocaleString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 p-6 sm:p-10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
            <Typography variant="h5" className="font-bold text-purple-900 dark:text-purple-100" sx={{ mb: 4 }}>
              Ajustes del Evento
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-2 mb-8">
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
              <TextField
                label="Mensaje de Bienvenida (Opcional)"
                variant="outlined"
                multiline
                rows={3}
                value={formData.welcomeMessage || ''}
                onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                className="bg-white/40 dark:bg-slate-950/40 rounded-2xl sm:col-span-2"
                placeholder="Ej: Recuerda que esta lista es de referencia..."
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
          {/* PC: editar izquierda | lista derecha · Móvil: apilado */}
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
            {/* Panel editar (izquierda en PC, sticky) */}
            <aside className="w-full lg:w-[min(420px,38%)] flex-shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pb-4 order-1">
              <GiftForm
                slug={slug}
                key={editingGift ? editingGift.id : 'new'}
                editGift={editingGift}
                onSaved={() => setEditingGift(null)}
                compact
              />
            </aside>

            {/* Panel productos (derecha en PC) */}
            <div className="flex-1 min-w-0 order-2">
              {/* Buscador sticky */}
              <div
                className={[
                  'sticky z-50 mb-4 p-3 sm:p-4',
                  'top-[max(0px,env(safe-area-inset-top,0px))]',
                  'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
                  'rounded-[1.5rem] border border-white/70 dark:border-slate-700/70',
                  'shadow-lg shadow-purple-900/5 dark:shadow-black/30',
                  'flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between',
                ].join(' ')}
              >
                <div className="relative w-full sm:max-w-md flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400">🔍</span>
                  </div>
                  <input
                    type="search"
                    placeholder="Buscar regalo por nombre, precio o link..."
                    value={giftSearch}
                    onChange={(e) => {
                      setGiftSearch(e.target.value);
                      setGiftPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                    enterKeyHint="search"
                  />
                </div>
                <Typography className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap px-1">
                  {filteredAdminGifts.length === 0
                    ? 'Sin resultados'
                    : `Mostrando ${(giftSafePage - 1) * ADMIN_GIFTS_PAGE_SIZE + 1}–${Math.min(giftSafePage * ADMIN_GIFTS_PAGE_SIZE, filteredAdminGifts.length)} de ${filteredAdminGifts.length}`}
                  {giftSearch.trim() && filteredAdminGifts.length !== gifts.length && (
                    <span className="text-slate-400"> · total {gifts.length}</span>
                  )}
                </Typography>
              </div>

              <div className="flex flex-col gap-3">
                {pagedAdminGifts.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 rounded-[2rem] bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-700/50">
                    {gifts.length === 0
                      ? 'Aún no hay regalos. Agrégalos en el panel de la izquierda.'
                      : 'No hay regalos que coincidan con la búsqueda.'}
                  </div>
                ) : (
                  pagedAdminGifts.map((gift) => {
                    const isSelected = editingGift?.id === gift.id;
                    return (
                      <div
                        key={gift.id}
                        className={[
                          'flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 rounded-[1.5rem] backdrop-blur-lg border shadow-md transition-all hover:shadow-lg',
                          isSelected
                            ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/40'
                            : 'bg-white/60 dark:bg-slate-900/60 border-white/50 dark:border-slate-700/50',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto min-w-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-purple-100/50 dark:bg-purple-900/30 overflow-hidden flex-shrink-0 border border-white/60 dark:border-purple-800 shadow-sm">
                            {gift.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Typography variant="subtitle1" className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-0.5 text-base sm:text-lg line-clamp-2">
                              {gift.name}
                            </Typography>
                            <Typography variant="body2" className="text-purple-600 dark:text-purple-400 font-bold mb-1">
                              ${gift.price.toLocaleString('es-CL')}
                              {gift.unlimited && <span className="text-slate-400 font-medium ml-1">• Ilimitado</span>}
                              {(gift.minQuantity ?? 1) > 1 && (
                                <span className="text-slate-400 font-medium ml-1">• Mín. {gift.minQuantity}</span>
                              )}
                              {gift.hidden && <span className="text-red-500 dark:text-red-400 font-bold ml-1">• Oculto 🚫</span>}
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

                        <div className="flex flex-row flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                          <Button
                            size="medium"
                            variant={isSelected ? 'contained' : 'outlined'}
                            color="primary"
                            className="rounded-full font-bold px-5 py-2 bg-white/50 dark:bg-slate-900/50 shadow-sm"
                            onClick={() => setEditingGift(gift)}
                          >
                            {isSelected ? 'Editando…' : 'Editar'}
                          </Button>
                          <Button
                            size="medium"
                            variant="outlined"
                            color="error"
                            className="rounded-full font-bold px-5 py-2 bg-white/50 dark:bg-slate-900/50 shadow-sm"
                            onClick={() => handleDelete(gift.id)}
                          >
                            Eliminar
                          </Button>
                          {(gift.reservedCount && gift.reservedCount > 0) ? (
                            <Button
                              size="medium"
                              variant="contained"
                              color="secondary"
                              className="rounded-full font-bold px-5 py-2 shadow-md"
                              onClick={() => handleUnreserve(gift.id)}
                            >
                              Liberar
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {filteredAdminGifts.length > ADMIN_GIFTS_PAGE_SIZE && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={giftSafePage <= 1}
                    onClick={() => setGiftPage((p) => Math.max(1, Math.min(p, giftTotalPages) - 1))}
                    className="rounded-full px-4 border-slate-300 dark:border-slate-600"
                  >
                    ← Anterior
                  </Button>
                  {giftPageNumbers.map((p, idx) =>
                    p === '…' ? (
                      <span key={`e-${idx}`} className="px-2 text-slate-400">
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={giftSafePage === p ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setGiftPage(p)}
                        className={`min-w-[40px] rounded-full ${
                          giftSafePage === p
                            ? 'bg-purple-700 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={giftSafePage >= giftTotalPages}
                    onClick={() =>
                      setGiftPage((p) => Math.min(giftTotalPages, Math.min(p, giftTotalPages) + 1))
                    }
                    className="rounded-full px-4 border-slate-300 dark:border-slate-600"
                  >
                    Siguiente →
                  </Button>
                </div>
              )}
            </div>
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

      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        classes={{ paper: "rounded-[2rem] p-4 sm:p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 m-4" }}
      >
        <DialogTitle className="font-bold text-slate-800 dark:text-slate-100 text-xl pb-2">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="text-slate-600 dark:text-slate-400 font-medium">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="px-6 pb-4 pt-4 gap-3">
          <Button 
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))} 
            color="inherit" 
            className="font-bold rounded-full px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }} 
            color="error" 
            variant="contained" 
            className="font-bold rounded-full px-8 py-2 shadow-md hover:shadow-lg"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
