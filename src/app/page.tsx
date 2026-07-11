'use client';

import { useFirebaseGifts } from '@/hooks/useFirebaseGifts';
import { useFirebaseSettings } from '@/hooks/useFirebaseSettings';
import { GuestView } from '@/components/GuestView';
import { Container, Typography } from '@mui/material';
import { MuiThemeProvider } from '@/components/MuiThemeProvider';
import Link from 'next/link';

export default function HomePage() {
  const { gifts, loading: giftsLoading } = useFirebaseGifts();
  const { settings, loading: settingsLoading } = useFirebaseSettings();

  if (giftsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Typography variant="h5" className="text-purple-600 font-bold animate-pulse">
          Cargando Regalos...
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
          <header className="mb-12 text-center">
            <Typography variant="h2" component="h1" className="font-bold tracking-tight mb-4 text-purple-950 dark:text-purple-100">
              {settings?.babyEmoji || '👶'} Baby Shower de {settings?.babyName || 'Kai'}
            </Typography>
            <Typography variant="h6" className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
              {settings?.eventDate} {settings?.eventDate && settings?.eventPlace && '•'} {settings?.eventPlace}
            </Typography>

            <div className="inline-flex justify-center p-1.5 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm mx-auto">
               <Link href="/admin" className="px-6 py-2 rounded-full font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all">
                 Administrar
               </Link>
            </div>
          </header>

          <main>
            <GuestView gifts={gifts} />
          </main>
        </Container>
      </div>
    </MuiThemeProvider>
  );
}
