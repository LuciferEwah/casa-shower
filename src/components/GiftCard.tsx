'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { reserveGift, cancelReservation } from '@/app/actions/giftActions';
import { Card, CardMedia, CardContent, Typography, Button, Box, Chip, CircularProgress, Snackbar, Alert, Dialog } from '@mui/material';
import { GuestIdentity } from './GuestView';
import { getGiftCategory, categoryLabels } from '@/lib/categories';

export function GiftCard({ slug, gift, guestIdentity }: { slug: string, gift: Gift, guestIdentity?: GuestIdentity }) {
  const count = gift.reservedCount || 0;
  const needed = gift.neededQuantity || 1;
  const minQuantity = Math.max(1, gift.minQuantity || 1);
  const remaining = gift.unlimited ? Number.POSITIVE_INFINITY : Math.max(0, needed - count);
  const canMeetMinimum = gift.unlimited || remaining >= minQuantity;

  const [loading, setLoading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(minQuantity);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const isReservedByMe = () => {
    if (!guestIdentity) return false;
    const myEmail = guestIdentity.email.toLowerCase();
    if (gift.reservedByList && gift.reservedByList.some(r => r.email?.toLowerCase() === myEmail)) return true;
    if (gift.reservedByEmail?.toLowerCase() === myEmail) return true;
    return false;
  };

  const handleDecrease = () => {
    if (selectedQuantity <= minQuantity) {
      showToast(
        `No se puede bajar. El mínimo para este producto es ${minQuantity}`,
        'warning'
      );
      return;
    }
    setSelectedQuantity((prev) => prev - 1);
  };

  const handleIncrease = () => {
    if (!gift.unlimited && selectedQuantity >= remaining) return;
    setSelectedQuantity((prev) => prev + 1);
  };

  const handleReserve = async () => {
    if (!guestIdentity) {
      showToast("Error: No estás identificado", 'error');
      return;
    }
    if (selectedQuantity < minQuantity) {
      showToast(
        `No se puede bajar. El mínimo para este producto es ${minQuantity}`,
        'warning'
      );
      return;
    }
    
    setLoading(true);
    try {
      let reserveName = guestIdentity.name;
      let reserveLastname = guestIdentity.lastname;

      if (guestIdentity.isCouple && guestIdentity.partnerName) {
        const partnerName = guestIdentity.partnerName.trim();
        const partnerLastname = (guestIdentity.partnerLastname || '').trim();
        const primaryLastname = guestIdentity.lastname.trim();

        if (!partnerLastname || partnerLastname.toLowerCase() === primaryLastname.toLowerCase()) {
          reserveName = `${guestIdentity.name} y ${partnerName}`;
          reserveLastname = guestIdentity.lastname;
        } else {
          reserveName = `${guestIdentity.name} ${guestIdentity.lastname}`;
          reserveLastname = `y ${partnerName} ${partnerLastname}`;
        }
      }

      const res = await reserveGift(
        slug, 
        gift.id, 
        reserveName, 
        reserveLastname, 
        guestIdentity.email, 
        selectedQuantity,
        {
          isCouple: guestIdentity.isCouple,
          partnerName: guestIdentity.partnerName,
          hasChildren: guestIdentity.hasChildren,
          childrenCount: guestIdentity.childrenCount
        }
      );
      if (res.success) {
        showToast(`¡Reservado exitosamente!`, 'success');
      }
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message, 'error');
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!guestIdentity) return;
    
    setLoading(true);
    try {
      const res = await cancelReservation(slug, gift.id, guestIdentity.email);
      if (res.success) {
        showToast(`Reserva anulada`, 'success');
      }
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message, 'error');
    }
    setLoading(false);
  };

  const available = gift.unlimited ? true : count < needed && canMeetMinimum;
  const reservedByMe = isReservedByMe();
  
  const category = getGiftCategory(gift.price);
  const catStyle = categoryLabels[category];
  const showQuantitySelector =
    !reservedByMe &&
    canMeetMinimum &&
    (gift.unlimited || remaining > minQuantity || minQuantity > 1);

  return (
    <Card className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 ${!available && !reservedByMe ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 grayscale-[50%]' : 'bg-white/70 dark:bg-slate-900/70 border-white/60 dark:border-slate-700/50 backdrop-blur-xl'}`}>
      
      {/* Category Badge */}
      <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md border bg-gradient-to-r ${catStyle.color} ${catStyle.border}`}>
        {catStyle.label}
      </div>

      {!available && !reservedByMe && (
        <div className="absolute top-4 right-4 z-10">
          <Chip label="Agotado" color="default" className="font-bold bg-slate-200/90 dark:bg-slate-700/90 text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm" />
        </div>
      )}
      {reservedByMe && (
        <div className="absolute top-4 right-4 z-10 animate-in zoom-in">
          <Chip label="Reservado por ti 💖" color="success" className="font-bold bg-green-100/90 dark:bg-green-900/90 text-green-700 dark:text-green-300 shadow-sm backdrop-blur-sm border border-green-200 dark:border-green-800" />
        </div>
      )}

      {gift.image ? (
        <CardMedia
          component="img"
          height="220"
          image={gift.image}
          alt={gift.name}
          onClick={() => setImageModalOpen(true)}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = 'none';
            const fallback = el.parentElement?.querySelector('[data-img-fallback]');
            if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
          }}
          className="h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      ) : null}
      <div
        data-img-fallback
        className="h-[220px] w-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-7xl"
        style={{ display: gift.image ? 'none' : 'flex' }}
      >
        🎁
      </div>
      
      <CardContent className="p-6">
        <Typography variant="h5" className="font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">
          {gift.name}
        </Typography>
        
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-purple-600 dark:text-purple-400">
            ${gift.price.toLocaleString('es-CL')}
          </Typography>
          <Typography variant="body2" className="text-slate-500 font-medium text-right">
            {gift.unlimited ? 'Ilimitado' : `Reservados: ${count} / ${needed}`}
            {minQuantity > 1 && (
              <span className="block text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                Mín. {minQuantity} por reserva
              </span>
            )}
          </Typography>
        </div>

        <div className="flex flex-col gap-4">
          {gift.link && (
            <Button 
              variant="outlined" 
              href={gift.link} 
              target="_blank" 
              className="rounded-full py-2 border-slate-300 text-slate-600 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Ver en tienda 🛒
            </Button>
          )}
          
          {guestIdentity && (
            <div className="mt-2">
              {!available && !reservedByMe ? (
                <Box className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700">
                  <Typography className="text-slate-500 dark:text-slate-400 font-medium">
                    {!gift.unlimited && remaining > 0 && remaining < minQuantity
                      ? `Quedan ${remaining}, pero el mínimo es ${minQuantity}. No se puede reservar.`
                      : 'Este regalo ya fue reservado.'}
                  </Typography>
                </Box>
              ) : (
                <div className="flex flex-col gap-3">
                  {showQuantitySelector && (
                    <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div className="flex items-center justify-between">
                        <Typography variant="body2" className="font-bold text-slate-700 dark:text-slate-300">
                          Cantidad a reservar:
                        </Typography>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={handleDecrease}
                            className={`w-8 h-8 rounded-full font-bold transition-colors ${
                              selectedQuantity <= minQuantity
                                ? 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-400 dark:text-slate-500'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                            aria-label="Disminuir cantidad"
                          >-</button>
                          <Typography className="font-bold min-w-[1.5rem] text-center">{selectedQuantity}</Typography>
                          <button 
                            type="button"
                            disabled={!gift.unlimited && selectedQuantity >= remaining}
                            onClick={handleIncrease}
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors"
                            aria-label="Aumentar cantidad"
                          >+</button>
                        </div>
                      </div>
                      {minQuantity > 1 && (
                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400">
                          Mínimo {minQuantity} · no se puede reservar menos
                        </Typography>
                      )}
                    </div>
                  )}

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    disabled={loading || (reservedByMe && !gift.unlimited) || (!reservedByMe && !canMeetMinimum)} 
                    onClick={handleReserve}
                    className="rounded-xl py-3 font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 
                     (reservedByMe && !gift.unlimited) ? '¡Ya lo reservaste!' : 
                     gift.unlimited ? 'Reservar Otro' : 'Reservar Regalo'}
                  </Button>
                  
                  {reservedByMe && (
                    <Button 
                      fullWidth 
                      variant="text" 
                      color="error"
                      disabled={loading}
                      onClick={handleCancel}
                      className="rounded-xl py-2 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    >
                      Anular Reserva
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

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
          className="rounded-xl shadow-lg font-medium"
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Full Image Modal */}
      <Dialog 
        open={imageModalOpen} 
        onClose={() => setImageModalOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "transparent",
            boxShadow: "none",
            backgroundImage: "none"
          }
        }}
      >
        <div className="flex justify-center items-center p-2 sm:p-8">
          <div className="relative inline-block max-w-full">
            <button 
              onClick={() => setImageModalOpen(false)} 
              className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold z-50 shadow-md backdrop-blur-sm border border-white/20 transition-colors"
            >
              ✕
            </button>
            <img 
              src={gift.image} 
              alt={gift.name} 
              className="max-h-[85vh] max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl" 
            />
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
