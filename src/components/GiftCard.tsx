'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { reserveGift, cancelReservation } from '@/app/actions/giftActions';
import { Card, CardMedia, CardContent, Typography, Button, Box, Chip, CircularProgress, Snackbar, Alert, Dialog } from '@mui/material';
import { GuestIdentity } from './GuestView';
import { getGiftCategory, categoryLabels } from '@/lib/categories';

export function GiftCard({ slug, gift, guestIdentity }: { slug: string, gift: Gift, guestIdentity?: GuestIdentity }) {
  const [loading, setLoading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
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

  const handleReserve = async () => {
    if (!guestIdentity) {
      showToast("Error: No estás identificado", 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await reserveGift(slug, gift.id, guestIdentity.name, guestIdentity.lastname, guestIdentity.email);
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

  const count = gift.reservedCount || 0;
  const needed = gift.neededQuantity || 1;
  const available = gift.unlimited ? true : count < needed;
  const reservedByMe = isReservedByMe();
  
  const category = getGiftCategory(gift.price);
  const catStyle = categoryLabels[category];

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
          className="h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className="h-[220px] w-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-7xl">
          🎁
        </div>
      )}
      
      <CardContent className="p-6">
        <Typography variant="h5" className="font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">
          {gift.name}
        </Typography>
        
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-purple-600 dark:text-purple-400">
            ${gift.price.toLocaleString('es-CL')}
          </Typography>
          <Typography variant="body2" className="text-slate-500 font-medium">
            {gift.unlimited ? 'Ilimitado' : `Reservados: ${count} / ${needed}`}
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
                  <Typography className="text-slate-500 dark:text-slate-400 font-medium">Este regalo ya fue reservado.</Typography>
                </Box>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    disabled={loading || (reservedByMe && !gift.unlimited)} 
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
        PaperProps={{ className: "bg-transparent shadow-none" }}
      >
        <div className="relative flex justify-center items-center p-4 sm:p-8">
          <Button 
            onClick={() => setImageModalOpen(false)} 
            className="absolute top-0 right-0 sm:top-4 sm:right-4 min-w-0 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white z-50 shadow-md backdrop-blur-sm"
          >
            ✕
          </Button>
          <img 
            src={gift.image} 
            alt={gift.name} 
            className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl" 
          />
        </div>
      </Dialog>
    </Card>
  );
}
