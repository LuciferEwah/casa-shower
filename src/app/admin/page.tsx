'use client';

import { useState, useEffect } from 'react';
import { useFirebaseGifts } from '@/hooks/useFirebaseGifts';
import { useFirebaseSettings } from '@/hooks/useFirebaseSettings';
import { AdminView } from '@/components/AdminView';
import { loginAdmin, logoutAdmin, checkAdmin } from '@/app/actions/adminActions';
import Link from 'next/link';
import { Container, Typography, TextField, Button } from '@mui/material';
import { MuiThemeProvider } from '@/components/MuiThemeProvider';

export default function AdminPage() {
  const { gifts, loading } = useFirebaseGifts();
  const { settings } = useFirebaseSettings();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');

  useEffect(() => {
    checkAdmin().then(isAuth => {
      setIsAdmin(isAuth);
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    const res = await loginAdmin(pin);
    if (res.success) {
      setIsAdmin(true);
    } else {
      alert(res.error);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAdmin(false);
  };

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Typography variant="h6" className="text-zinc-900 dark:text-zinc-100 font-bold animate-pulse">
          Cargando Admin...
        </Typography>
      </div>
    );
  }

  return (
    <MuiThemeProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-x-hidden transition-colors duration-300 pb-20">
        
        <Container maxWidth="lg" className="relative z-10 pt-8 sm:pt-16 px-4 sm:px-6">
          
          {!isAdmin ? (
            <div className="max-w-sm mx-auto mt-10 sm:mt-20 p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
              <Typography variant="h5" className="font-bold mb-6 text-zinc-900 dark:text-zinc-100">
                Acceso Administrador
              </Typography>
              <TextField 
                fullWidth
                type="password" 
                label="PIN" 
                variant="outlined"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 rounded-xl mb-6"
              />
              <Button 
                fullWidth
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleLogin} 
                className="rounded-full py-3 font-bold mb-6"
              >
                Entrar
              </Button>
              <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors text-sm">
                Volver a la Lista de Regalos
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-8 sm:mb-12 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm gap-4">
                <div className="text-center md:text-left">
                  <Typography variant="h5" className="font-bold text-zinc-950 dark:text-zinc-100">
                    Panel de Admin
                  </Typography>
                  <Typography variant="body2" className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                    {settings?.babyEmoji || '🏠'} Casa Shower de {settings?.babyName || 'Luci'}
                  </Typography>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Link href="/" className="w-full sm:w-auto">
                    <Button fullWidth variant="outlined" color="inherit" className="rounded-full font-bold px-6 border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      Ver Lista
                    </Button>
                  </Link>
                  <Button fullWidth variant="contained" sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' } }} onClick={handleLogout} className="rounded-full font-bold px-6 sm:w-auto">
                    Salir
                  </Button>
                </div>
              </header>

              <main>
                <AdminView gifts={gifts} />
              </main>
            </>
          )}

        </Container>
      </div>
    </MuiThemeProvider>
  );
}
