'use client';

import { useState, useEffect } from 'react';
import { Gift } from '@/types';
import { reserveGift } from '@/app/actions/giftActions';
import { Card, CardMedia, CardContent, Typography, TextField, Button, Box, Chip, CircularProgress } from '@mui/material';

export function GiftCard({ gift }: { gift: Gift }) {
  const [guestName, setGuestName] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [hasReserved, setHasReserved] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!guestName || !guestLastname) {
      alert("Por favor ingresa tu nombre y apellido");
      return;
    }
    setLoading(true);
    try {
      const res = await reserveGift(gift.id, guestName, guestLastname);
      if (res.success) {
        alert(`Reservado como ${res.animal}!`);
        const stored = localStorage.getItem('casa_shower_reservations');
        const reservations = stored ? JSON.parse(stored) : [];
        reservations.push(gift.id);
        localStorage.setItem('casa_shower_reservations', JSON.stringify(reservations));
        setHasReserved(true);
      }
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
    setLoading(false);
  };

  const needed = gift.neededQuantity || 1;
  const count = gift.reservedCount || 0;
  const isSoldOut = !gift.unlimited && count >= needed;
  
  return (
    <Card 
      className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
      elevation={0}
    >
      {gift.image ? (
        <CardMedia
          component="img"
          height="200"
          image={gift.image}
          alt={gift.name}
          className="h-48 sm:h-56 object-cover rounded-t-2xl"
        />
      ) : (
        <div className="h-48 sm:h-56 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-t-2xl">
          <span className="text-6xl sm:text-7xl opacity-50">🎁</span>
        </div>
      )}
      <CardContent className="flex-grow flex flex-col p-5 sm:p-6">
        <Typography variant="h6" className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
          {gift.name}
        </Typography>
        <Typography variant="body1" className="text-zinc-700 dark:text-zinc-300 font-bold mb-2 flex items-center flex-wrap gap-2">
          ${gift.price} 
          {gift.unlimited && (
            <Chip size="small" label="Ilimitado" variant="outlined" className="font-bold border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400" />
          )}
        </Typography>

        {!gift.unlimited && needed > 1 && (
          <Typography variant="body2" className="text-zinc-500 mb-4 font-medium">
            Faltan {needed - count} de {needed}
          </Typography>
        )}
        
        <div className="mt-auto pt-2">
          {hasReserved ? (
            <Box className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800/50 mt-2">
              <Typography variant="body2" className="text-green-700 dark:text-green-400 font-medium text-center">
                🎁 Tú reservaste esto
              </Typography>
            </Box>
          ) : isSoldOut ? (
            <Box className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 mt-2">
              <Typography variant="body2" className="text-zinc-700 dark:text-zinc-300 font-medium text-center">
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
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.75rem' } }}
              />
              <TextField 
                size="small" 
                variant="outlined" 
                placeholder="Tu apellido" 
                value={guestLastname} 
                onChange={e => setGuestLastname(e.target.value)} 
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.75rem' } }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                disabled={loading}
                className="rounded-xl py-2 mt-1 font-bold bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black disabled:opacity-50"
                onClick={handleReserve}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Lo llevo yo!'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
