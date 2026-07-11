'use client';

import { useState, useEffect } from 'react';
import { Gift } from '@/types';
import { reserveGift } from '@/app/actions/giftActions';
import { Card, CardMedia, CardContent, Typography, TextField, Button, Box, Chip, CircularProgress, Snackbar, Alert } from '@mui/material';

export function GiftCard({ slug, gift }: { slug: string, gift: Gift }) {
  const [guestName, setGuestName] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [hasReserved, setHasReserved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  useEffect(() => {
    // Check localStorage if this user reserved this gift
    const stored = localStorage.getItem('casa_shower_reservations');
    if (stored) {
      const reservations = JSON.parse(stored);
      if (reservations.includes(gift.id)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasReserved(true);
      }
    }
  }, [gift.id]);

  const handleReserve = async () => {
    if (!guestName.trim() || !guestLastname.trim()) {
      showToast("Por favor ingresa tu nombre y apellido", 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await reserveGift(slug, gift.id, guestName, guestLastname);
      if (res.success) {
        const stored = localStorage.getItem('casa_shower_reservations') || '[]';
        const reservations = JSON.parse(stored);
        reservations.push(gift.id);
        localStorage.setItem('casa_shower_reservations', JSON.stringify(reservations));
        
        setHasReserved(true);
        showToast(`Reservado como ${res.animal}!`, 'success');
        
        setGuestName('');
        setGuestLastname('');
      }
    } catch (e: unknown) {
      if (e instanceof Error) showToast(e.message, 'error');
    }
    setLoading(false);
  };

  const needed = gift.neededQuantity || 1;
  const count = gift.reservedCount || 0;
  const isSoldOut = !gift.unlimited && count >= needed;
  
  return (
    <Card 
      className="rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      elevation={0}
    >
      {gift.image ? (
        <CardMedia
          component="img"
          height="200"
          image={gift.image}
          alt={gift.name}
          className="h-48 sm:h-56 object-cover rounded-t-[2rem]"
        />
      ) : (
        <div className="h-48 sm:h-56 bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center rounded-t-[2rem]">
          <span className="text-6xl sm:text-7xl drop-shadow-md">🎁</span>
        </div>
      )}
      <CardContent className="flex-grow flex flex-col p-5 sm:p-6">
        <Typography variant="h6" className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1">
          {gift.name}
        </Typography>
        <Typography variant="body1" className="text-purple-600 dark:text-purple-400 font-bold mb-2 flex items-center flex-wrap gap-2">
          ${gift.price} 
          {gift.unlimited && (
            <Chip size="small" label="Ilimitado" color="secondary" className="font-bold px-1" />
          )}
        </Typography>

        {!gift.unlimited && needed > 1 && (
          <Typography variant="body2" className="text-slate-500 dark:text-slate-400 mb-4 font-medium">
            Faltan {needed - count} de {needed}
          </Typography>
        )}
        
        <div className="mt-auto pt-2">
          {hasReserved ? (
            <Box className="p-3 sm:p-4 bg-fuchsia-50/80 dark:bg-fuchsia-900/30 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-800 backdrop-blur-sm shadow-inner mt-2">
              <Typography variant="body2" className="text-fuchsia-800 dark:text-fuchsia-200 font-semibold text-center">
                🎁 Tú reservaste esto
              </Typography>
            </Box>
          ) : isSoldOut ? (
            <Box className="p-3 sm:p-4 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm mt-2 text-center shadow-inner">
              <Typography variant="body2" className="text-slate-500 dark:text-slate-400 font-semibold">
                Agotado
              </Typography>
            </Box>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <TextField 
                size="small" 
                variant="outlined" 
                placeholder="Tu nombre" 
                value={guestName} 
                onChange={e => setGuestName(e.target.value)} 
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
              />
              <TextField 
                size="small" 
                variant="outlined" 
                placeholder="Tu apellido" 
                value={guestLastname} 
                onChange={e => setGuestLastname(e.target.value)} 
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
              />
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                disabled={loading}
                className="rounded-xl py-2 mt-1 font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                onClick={handleReserve}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Lo llevo yo!'}
              </Button>
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
    </Card>
  );
}
