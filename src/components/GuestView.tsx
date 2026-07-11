'use client';

import { useState, useEffect, useMemo } from 'react';
import { Gift } from '@/types';
import { GiftCard } from './GiftCard';
import { Typography, TextField, Button, Box, MenuItem, Select, InputAdornment, FormControl } from '@mui/material';
import { GiftCategory, getGiftCategory } from '@/lib/categories';

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

  // Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GiftCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc'>('price_asc');

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

  const filteredAndSortedGifts = useMemo(() => {
    let result = [...gifts];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(lowerSearch));
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(g => getGiftCategory(g.price) === categoryFilter);
    }

    // Sort
    if (sortOrder === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [gifts, searchTerm, categoryFilter, sortOrder]);

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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 px-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm">
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

      {/* Toolbar: Search, Filter, Sort */}
      <div className="mb-8 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[1.5rem] border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">🔍</span>
          </div>
          <input 
            type="text"
            placeholder="Buscar regalos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar items-center">
            <Button 
              variant={categoryFilter === 'all' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-full px-4 whitespace-nowrap ${categoryFilter === 'all' ? 'bg-purple-600' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
            >
              Todos
            </Button>
            <Button 
              variant={categoryFilter === 'bronze' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setCategoryFilter('bronze')}
              className={`rounded-full px-4 whitespace-nowrap ${categoryFilter === 'bronze' ? 'bg-amber-800 text-amber-100' : 'border-amber-700/30 text-amber-800 dark:text-amber-500'}`}
            >
              Bronce 🥉
            </Button>
            <Button 
              variant={categoryFilter === 'silver' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setCategoryFilter('silver')}
              className={`rounded-full px-4 whitespace-nowrap ${categoryFilter === 'silver' ? 'bg-slate-500 text-slate-100' : 'border-slate-400/50 text-slate-600 dark:text-slate-400'}`}
            >
              Plata 🥈
            </Button>
            <Button 
              variant={categoryFilter === 'gold' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setCategoryFilter('gold')}
              className={`rounded-full px-4 whitespace-nowrap ${categoryFilter === 'gold' ? 'bg-yellow-500 text-yellow-950' : 'border-yellow-500/50 text-yellow-600 dark:text-yellow-500'}`}
            >
              Oro 🥇
            </Button>
          </div>

          {/* Sort */}
          <FormControl size="small" className="min-w-[150px]">
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc')}
              className="bg-white/50 dark:bg-slate-950/50 rounded-xl"
              sx={{ borderRadius: '0.75rem' }}
            >
              <MenuItem value="default">Recomendados</MenuItem>
              <MenuItem value="price_asc">Menor a Mayor</MenuItem>
              <MenuItem value="price_desc">Mayor a Menor</MenuItem>
            </Select>
          </FormControl>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {filteredAndSortedGifts.length > 0 ? (
          filteredAndSortedGifts.map(gift => (
            <GiftCard key={gift.id} slug={slug} gift={gift} guestIdentity={identity} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            No se encontraron regalos con esos filtros. 😢
          </div>
        )}
      </div>
    </section>
  );
}
