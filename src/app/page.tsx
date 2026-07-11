'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/eventActions';
import { Container, Typography, TextField, Button, Box, CircularProgress } from '@mui/material';
import { MuiThemeProvider } from '@/components/MuiThemeProvider';

export default function LandingPage() {
  const router = useRouter();
  
  const [slug, setSlug] = useState('');
  const [babyName, setBabyName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    
    // basic validation
    if (!slug || !babyName || !adminPin) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('El Link Personalizado solo puede contener letras minusculas, numeros y guiones (-)');
      return;
    }
    if (adminPin.length < 4) {
      setError('El PIN debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await createEvent(slug, babyName, adminPin);
      if (res.success) {
        // Redirigir al nuevo evento
        router.push(`/s/${slug}`);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Ocurrio un error desconocido');
      }
    }
    setLoading(false);
  };

  return (
    <MuiThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
        
        {/* Ambient Glows for Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-400/30 dark:bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />

        <Container maxWidth="sm" className="relative z-10">
          <Box className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 text-center">
            <Typography variant="h3" className="font-bold mb-2 text-purple-950 dark:text-purple-100">
              🎁 Casa Shower
            </Typography>
            <Typography variant="body1" className="text-purple-700 dark:text-purple-300 mb-8 font-medium">
              Crea tu lista de regalos en segundos
            </Typography>

            {error && (
              <Box className="bg-red-50/80 text-red-600 p-3 rounded-xl mb-6 text-sm border border-red-200">
                {error}
              </Box>
            )}

            <div className="flex flex-col gap-5 text-left">
              <TextField
                label="Nombre del Evento"
                variant="outlined"
                fullWidth
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Ej: Luci"
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
              />
              
              <TextField
                label="Link Personalizado (Slug)"
                variant="outlined"
                fullWidth
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ej: casa-luci"
                helperText={`Tu link será: casashower.com/s/${slug || '...'}`}
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
              />

              <TextField
                label="PIN de Administrador"
                variant="outlined"
                type="password"
                fullWidth
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Min 4 caracteres"
                className="bg-white/40 dark:bg-slate-950/40 rounded-xl"
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleCreate}
                disabled={loading}
                className="rounded-full py-3.5 font-bold mt-2 shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 disabled:opacity-70"
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear mi Casa Shower'}
              </Button>
            </div>
          </Box>
        </Container>
      </div>
    </MuiThemeProvider>
  );
}
