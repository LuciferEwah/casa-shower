'use client';

import { useState, useEffect } from 'react';
import { Gift } from '@/types';
import { GiftCard } from './GiftCard';
import { Typography, TextField, Button, Box } from '@mui/material';

export interface GuestIdentity {
  name: string;
  lastname: string;
  email: string;
}

export function GuestView({ slug, gifts }: { slug: string, gifts: Gift[] }) {
  const [identity, setIdentity] = useState<GuestIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('casa_shower_guest');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          // eslint-disable-next-line
          setIdentity(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
    setIsLoaded(true);
  }, []);

  const handleLogin = () => {
    if (!formName.trim() || !formLastname.trim() || !formEmail.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    
    const newIdentity = { 
      name: formName.trim(), 
      lastname: formLastname.trim(), 
      email: formEmail.trim().toLowerCase() 
    };
    
    localStorage.setItem('casa_shower_guest', JSON.stringify(newIdentity));
    setIdentity(newIdentity);
  };

  if (!isLoaded) return null; // Avoid hydration mismatch

  if (!identity) {
    return (
      <section className="flex flex-col items-center justify-center py-10 px-4 w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <Box className="w-full p-8 sm:p-10 rounded-[2rem] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-purple-200 dark:border-purple-900/50 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-purple-800 to-purple-950"></div>
          
          <div className="w-20 h-20 mb-6 bg-purple-100 dark:bg-purple-900/60 rounded-full flex items-center justify-center text-4xl shadow-inner border border-purple-200 dark:border-purple-700">
            👋
          </div>
          
          <Typography variant="h5" className="font-bold mb-2 text-purple-900 dark:text-purple-100">
            ¡Bienvenido!
          </Typography>
          <Typography variant="body1" className="text-slate-600 dark:text-slate-300 mb-8 font-medium">
            Ingresa tus datos para ver y reservar regalos. Solo tú podrás ver tus reservas.
          </Typography>

          <div className="w-full flex flex-col gap-5">
            <TextField
              fullWidth
              label="Nombre"
              variant="outlined"
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setError(''); }}
              className="bg-white/50 dark:bg-slate-950/50 rounded-xl"
            />
            <TextField
              fullWidth
              label="Apellido"
              variant="outlined"
              value={formLastname}
              onChange={(e) => { setFormLastname(e.target.value); setError(''); }}
              className="bg-white/50 dark:bg-slate-950/50 rounded-xl"
            />
            <TextField
              fullWidth
              type="email"
              label="Correo Electrónico"
              variant="outlined"
              value={formEmail}
              onChange={(e) => { setFormEmail(e.target.value); setError(''); }}
              className="bg-white/50 dark:bg-slate-950/50 rounded-xl"
            />
          </div>

          {error && (
            <Typography className="text-red-500 text-sm mt-4 font-bold animate-pulse">
              {error}
            </Typography>
          )}

          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleLogin}
            className="w-full mt-8 rounded-full py-4 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r from-purple-700 to-purple-900 text-white border border-purple-500/30"
          >
            Entrar a la Lista
          </Button>
        </Box>
      </section>
    );
  }

  return (
    <section className="guest-view w-full animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 p-4 px-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm">
        <Typography className="text-slate-700 dark:text-slate-200 font-medium text-center sm:text-left mb-3 sm:mb-0">
          Hola, <span className="font-bold text-purple-700 dark:text-purple-400">{identity.name}</span> 👋
        </Typography>
        <Button 
          variant="text" 
          size="small"
          onClick={() => {
            localStorage.removeItem('casa_shower_guest');
            setIdentity(null);
          }}
          className="rounded-full px-4 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400"
        >
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {gifts.map(gift => (
          <GiftCard key={gift.id} slug={slug} gift={gift} guestIdentity={identity} />
        ))}
      </div>
    </section>
  );
}
