'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { reserveGift } from '@/app/actions/giftActions';
import { Card, CardMedia, CardContent, Typography, TextField, Button, Box, Chip } from '@mui/material';

export function GiftCard({ gift }: { gift: Gift }) {
  const [guestName, setGuestName] = useState('');
  const [guestLastname, setGuestLastname] = useState('');

  const handleReserve = async () => {
    if (!guestName || !guestLastname) {
      alert("Por favor ingresa tu nombre y apellido");
      return;
    }
    try {
      const res = await reserveGift(gift.id, gift.unlimited, guestName, guestLastname);
      if (res.success) alert(`Reservado como ${res.animal}!`);
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
  };

  const isReserved = gift.reservedBy || (gift.reservedByList && gift.reservedByList.length > 0);

  return (
    <Card 
      className="rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/50 dark:border-slate-700/50 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col"
      elevation={0}
    >
      {gift.image ? (
        <CardMedia
          component="img"
          height="200"
          image={gift.image}
          alt={gift.name}
          className="h-56 object-cover rounded-t-[2rem]"
        />
      ) : (
        <div className="h-56 bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center rounded-t-[2rem]">
          <span className="text-7xl drop-shadow-md">🎁</span>
        </div>
      )}
      <CardContent className="flex-grow flex flex-col p-6">
        <Typography variant="h6" className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
          {gift.name}
        </Typography>
        <Typography variant="body1" className="text-purple-600 dark:text-purple-400 font-bold mb-4 flex items-center">
          ${gift.price} 
          {gift.unlimited && (
            <Chip size="small" label="Ilimitado" color="secondary" className="ml-3 font-bold px-1" />
          )}
        </Typography>
        
        <div className="mt-auto pt-2">
          {isReserved ? (
            <Box className="p-4 bg-fuchsia-50/80 dark:bg-fuchsia-900/30 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-800 backdrop-blur-sm shadow-inner mt-4">
              <Typography variant="body2" className="text-fuchsia-800 dark:text-fuchsia-200 font-semibold text-center">
                Reservado por {gift.unlimited ? gift.reservedByList?.map(r => r.animal).join(', ') : gift.reservedByAnimal}
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
                InputProps={{ className: 'rounded-xl' }}
              />
              <TextField 
                size="small" 
                variant="outlined" 
                placeholder="Tu apellido" 
                value={guestLastname} 
                onChange={e => setGuestLastname(e.target.value)} 
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
                InputProps={{ className: 'rounded-xl' }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                size="large"
                className="rounded-xl shadow-md hover:shadow-lg py-2 mt-1 font-bold"
                onClick={handleReserve}
              >
                Lo llevo yo!
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
