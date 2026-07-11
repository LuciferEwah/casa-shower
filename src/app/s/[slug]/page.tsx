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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Typography variant="h5" className="text-purple-600 font-bold animate-pulse">
          Cargando...
        </Typography>
      </div>
    );
  }

  // If settings don't exist, it might be a 404
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Typography variant="h5" className="text-slate-900 dark:text-slate-100 font-bold">
          Evento no encontrado
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

        <Container maxWidth="lg" className="relative z-10 pt-8 sm:pt-16 px-4 sm:px-6">
          <header className="mb-10 sm:mb-16 text-center">
            <Typography variant="h3" component="h1" className="font-bold tracking-tight mb-4 text-purple-950 dark:text-purple-100 px-2 sm:px-0">
              {settings.babyEmoji || '🏠'} Casa Shower de {settings.babyName || 'Luci'}
            </Typography>
            <div className="flex flex-wrap justify-center gap-3 mb-10 mt-6">
              {settings.eventDate && (
                <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 font-bold text-lg sm:text-xl shadow-sm border border-purple-200 dark:border-purple-800/50 flex items-center gap-2">
                  📅 {settings.eventDate}
                </div>
              )}
              {settings.eventPlace && (
                <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold text-lg sm:text-xl shadow-sm border border-blue-200 dark:border-blue-800/50 flex items-center gap-2">
                  📍 {settings.eventPlace}
                </div>
              )}
            </div>

            <div className="inline-flex justify-center p-2 sm:p-3 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-md mx-auto mb-10">
              {!isAdmin ? (
                <button 
                  onClick={() => setLoginOpen(true)}
                  className="px-6 py-2 rounded-full font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
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

            <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-100/40 to-fuchsia-100/40 dark:from-purple-900/20 dark:to-fuchsia-900/20 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/30 shadow-sm text-center">
              <Typography variant="h6" className="text-purple-800 dark:text-purple-300 font-bold mb-2 flex items-center justify-center gap-2">
                💝 ¡Todo regalo es bienvenido!
              </Typography>
              <Typography variant="body1" className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                {settings.welcomeMessage || "Recuerda que esta lista es de referencia. No es obligatorio comprar en el link sugerido, pero las imágenes muestran el estilo, diseño o los colores que nos gustan."}
              </Typography>
            </div>
          </header>

          <main>
            {isAdmin ? <AdminView slug={slug} gifts={gifts} settings={settings} /> : <GuestView slug={slug} gifts={gifts} />}
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
