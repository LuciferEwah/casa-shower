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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans flex items-center justify-center p-4">
        <Container maxWidth="sm">
          <Box className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 text-center">
            <Typography variant="h3" className="font-bold mb-2">
              🎁 Casa Shower
            </Typography>
            <Typography variant="body1" className="text-zinc-500 dark:text-zinc-400 mb-8">
              Crea tu lista de regalos en segundos
            </Typography>

            {error && (
              <Box className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
                {error}
              </Box>
            )}

            <div className="flex flex-col gap-5 text-left">
              <TextField
                label="Nombre del Bebe (o del Evento)"
                variant="outlined"
                fullWidth
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Ej: Kai"
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl"
              />
              
              <TextField
                label="Link Personalizado (Slug)"
                variant="outlined"
                fullWidth
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ej: baby-shower-kai"
                helperText={`Tu link será: casashower.com/s/${slug || '...'}`}
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl"
              />

              <TextField
                label="PIN de Administrador"
                variant="outlined"
                type="password"
                fullWidth
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Min 4 caracteres"
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl"
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleCreate}
                disabled={loading}
                className="rounded-full py-3.5 font-bold mt-2 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black disabled:opacity-70"
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
