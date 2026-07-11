'use client';

import { useState, useEffect } from 'react';
import { useFirebaseGifts } from '@/hooks/useFirebaseGifts';
import { useFirebaseSettings } from '@/hooks/useFirebaseSettings';
import { GuestView } from '@/components/GuestView';
import { AdminView } from '@/components/AdminView';
import { LoginModal } from '@/components/LoginModal';
import { Container, Typography } from '@mui/material';
import { MuiThemeProvider } from '@/components/MuiThemeProvider';
import { checkAdmin, logoutAdmin } from '@/app/actions/adminActions';
import { useParams } from 'next/navigation';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { gifts, loading: giftsLoading } = useFirebaseGifts(slug);
  const { settings, loading: settingsLoading } = useFirebaseSettings(slug);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      checkAdmin(slug).then(isAuth => {
        setIsAdmin(isAuth);
        setCheckingAuth(false);
      });
    }
  }, [slug]);

  const handleLogout = async () => {
    await logoutAdmin(slug);
    setIsAdmin(false);
  };

  if (giftsLoading || settingsLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Typography variant="h6" className="text-zinc-900 dark:text-zinc-100 font-bold animate-pulse">
          Cargando...
        </Typography>
      </div>
    );
  }

  // If settings don't exist, it might be a 404
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Typography variant="h5" className="text-zinc-900 dark:text-zinc-100 font-bold">
          Evento no encontrado
        </Typography>
      </div>
    );
  }

  return (
    <MuiThemeProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-x-hidden transition-colors duration-300 pb-20">
        
        <Container maxWidth="lg" className="relative z-10 pt-8 sm:pt-16 px-4 sm:px-6">
          <header className="mb-10 sm:mb-16 text-center">
            <Typography variant="h3" component="h1" className="font-bold tracking-tight mb-4 text-zinc-950 dark:text-zinc-100 px-2 sm:px-0">
              {settings.babyEmoji || '🏠'} Casa Shower de {settings.babyName || 'Luci'}
            </Typography>
            <Typography variant="subtitle1" className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
              {settings.eventDate} {settings.eventDate && settings.eventPlace && '•'} {settings.eventPlace}
            </Typography>

            <div className="inline-flex justify-center p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mx-auto">
              {!isAdmin ? (
                <button 
                  onClick={() => setLoginOpen(true)}
                  className="px-6 py-2 rounded-full font-semibold text-sm sm:text-base text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Administrar
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-full font-semibold text-sm sm:text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                >
                  Salir Admin
                </button>
              )}
            </div>
          </header>

          <main>
            {isAdmin ? <AdminView slug={slug} gifts={gifts} /> : <GuestView slug={slug} gifts={gifts} />}
          </main>
        </Container>
      </div>
      
      <LoginModal 
        slug={slug}
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        onSuccess={() => {
          setLoginOpen(false);
          setIsAdmin(true);
        }} 
      />
    </MuiThemeProvider>
  );
}
