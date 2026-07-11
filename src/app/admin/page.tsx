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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Typography variant="h5" className="text-purple-600 font-bold animate-pulse">
          Cargando Admin...
        </Typography>
      </div>
    );
  }

  return (
    <MuiThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans relative overflow-x-hidden transition-colors duration-300 pb-20">
        
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-400/30 dark:bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <Container maxWidth="lg" className="relative z-10 pt-16">
          
          {!isAdmin ? (
            <div className="max-w-md mx-auto mt-20 p-8 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl text-center">
              <Typography variant="h5" className="font-bold mb-6 text-purple-900 dark:text-purple-100">
                Acceso Administrador
              </Typography>
              <TextField 
                fullWidth
                type="password" 
                label="PIN" 
                variant="outlined"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="bg-white/40 dark:bg-slate-950/40 rounded-2xl mb-6"
              />
              <Button 
                fullWidth
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleLogin} 
                className="rounded-full py-3 font-bold shadow-md hover:shadow-lg mb-4"
              >
                Entrar
              </Button>
              <Link href="/" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-semibold transition-colors">
                Volver a la Lista de Regalos
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-12 flex flex-col md:flex-row justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-sm">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <Typography variant="h4" className="font-bold text-purple-950 dark:text-purple-100">
                    Panel de Admin
                  </Typography>
                  <Typography variant="body1" className="text-slate-600 dark:text-slate-400 font-medium">
                    {settings?.babyEmoji || '👶'} Baby Shower de {settings?.babyName || 'Kai'}
                  </Typography>
                </div>
                <div className="flex gap-4">
                  <Link href="/">
                    <Button variant="outlined" color="primary" className="rounded-full font-bold px-6 bg-white/50 dark:bg-slate-800/50">
                      Ver Lista
                    </Button>
                  </Link>
                  <Button variant="contained" color="error" onClick={handleLogout} className="rounded-full font-bold px-6 shadow-md">
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
