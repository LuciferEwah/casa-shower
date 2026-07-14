'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Gift } from '@/types';
import { GiftCard } from './GiftCard';
import { Typography, Button, Box, MenuItem, Select, FormControl } from '@mui/material';
import { GiftCategory, getGiftCategory } from '@/lib/categories';

export interface GuestIdentity {
  name: string;
  lastname: string;
  email: string;
}

const DESKTOP_PAGE_SIZE = 12;
const MOBILE_BATCH_SIZE = 8;

function useIsDesktop(breakpointPx = 768) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [breakpointPx]);

  return isDesktop;
}

export function GuestView({ slug, gifts }: { slug: string; gifts: Gift[] }) {
  const [identity, setIdentity] = useState<GuestIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [formName, setFormName] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GiftCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc'>('price_asc');

  // Desktop: page number. Mobile: how many batches loaded.
  const [page, setPage] = useState(1);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_BATCH_SIZE);

  const isDesktop = useIsDesktop(768);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('casa_shower_guest');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          // eslint-disable-next-line
          setIdentity(parsed);
        }
      } catch {
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
      email: formEmail.trim().toLowerCase(),
    };

    localStorage.setItem('casa_shower_guest', JSON.stringify(newIdentity));
    setIdentity(newIdentity);
  };

  const resetPagination = useCallback(() => {
    setPage(1);
    setMobileVisibleCount(MOBILE_BATCH_SIZE);
  }, []);

  const filteredAndSortedGifts = useMemo(() => {
    let result = [...gifts];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(lowerSearch));
    }

    if (categoryFilter !== 'all') {
      result = result.filter((g) => getGiftCategory(g.price) === categoryFilter);
    }

    if (sortOrder === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [gifts, searchTerm, categoryFilter, sortOrder]);

  const total = filteredAndSortedGifts.length;
  const totalPages = Math.max(1, Math.ceil(total / DESKTOP_PAGE_SIZE));
  // Derive safe page without setState-in-effect
  const safePage = Math.min(Math.max(1, page), totalPages);

  const desktopGifts = useMemo(() => {
    const start = (safePage - 1) * DESKTOP_PAGE_SIZE;
    return filteredAndSortedGifts.slice(start, start + DESKTOP_PAGE_SIZE);
  }, [filteredAndSortedGifts, safePage]);

  const mobileGifts = useMemo(() => {
    return filteredAndSortedGifts.slice(0, mobileVisibleCount);
  }, [filteredAndSortedGifts, mobileVisibleCount]);

  const visibleGifts = isDesktop ? desktopGifts : mobileGifts;
  const hasMoreMobile = !isDesktop && mobileVisibleCount < total;

  const loadMoreMobile = useCallback(() => {
    setMobileVisibleCount((n) => Math.min(n + MOBILE_BATCH_SIZE, total));
  }, [total]);

  // Infinite scroll on mobile (setState only in observer callback)
  useEffect(() => {
    if (isDesktop || !hasMoreMobile) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreMobile();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isDesktop, hasMoreMobile, loadMoreMobile, mobileVisibleCount]);

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push('…');
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }, [safePage, totalPages]);

  if (!isLoaded) return null;

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
            <input
              type="text"
              placeholder="Nombre"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Apellido"
              value={formLastname}
              onChange={(e) => {
                setFormLastname(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Toolbar: sticky on mobile, normal on desktop */}
      <div
        className={[
          'z-30 mb-6 p-3 sm:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[1.5rem] border border-white/60 dark:border-slate-800/60 shadow-md',
          'flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-stretch md:items-center',
          // fixed-ish search bar feel on mobile
          'sticky top-0 md:static md:top-auto',
          'supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80',
        ].join(' ')}
      >
        <div className="relative w-full md:max-w-xs flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">🔍</span>
          </div>
          <input
            type="search"
            placeholder="Buscar regalos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              resetPagination();
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow text-base"
            enterKeyHint="search"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar items-center">
            {(
              [
                { id: 'all' as const, label: 'Todos', active: 'bg-purple-600' },
                {
                  id: 'bronze' as const,
                  label: 'Bronce 🥉',
                  active: 'bg-amber-800 text-amber-100',
                },
                {
                  id: 'silver' as const,
                  label: 'Plata 🥈',
                  active: 'bg-slate-500 text-slate-100',
                },
                {
                  id: 'gold' as const,
                  label: 'Oro 🥇',
                  active: 'bg-yellow-500 text-yellow-950',
                },
              ] as const
            ).map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setCategoryFilter(cat.id);
                  resetPagination();
                }}
                className={`rounded-full px-4 whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? cat.active
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <FormControl size="small" className="min-w-[150px]">
            <Select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc');
                resetPagination();
              }}
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

      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400 font-medium px-1">
        {total === 0
          ? 'Sin resultados'
          : isDesktop
            ? `Mostrando ${(safePage - 1) * DESKTOP_PAGE_SIZE + 1}–${Math.min(safePage * DESKTOP_PAGE_SIZE, total)} de ${total}`
            : `Mostrando ${Math.min(mobileVisibleCount, total)} de ${total}`}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {visibleGifts.length > 0 ? (
          visibleGifts.map((gift) => (
            <GiftCard key={gift.id} slug={slug} gift={gift} guestIdentity={identity} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            No se encontraron regalos con esos filtros. 😢
          </div>
        )}
      </div>

      {/* Desktop pagination */}
      {isDesktop && total > DESKTOP_PAGE_SIZE && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outlined"
            size="small"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, Math.min(p, totalPages) - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full px-4 border-slate-300 dark:border-slate-600"
          >
            ← Anterior
          </Button>

          {pageNumbers.map((p, idx) =>
            p === '…' ? (
              <span key={`e-${idx}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={safePage === p ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`min-w-[40px] rounded-full ${
                  safePage === p
                    ? 'bg-purple-700 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outlined"
            size="small"
            disabled={safePage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full px-4 border-slate-300 dark:border-slate-600"
          >
            Siguiente →
          </Button>
        </div>
      )}

      {/* Mobile infinite scroll sentinel */}
      {!isDesktop && hasMoreMobile && (
        <div ref={loadMoreRef} className="mt-8 flex flex-col items-center gap-3 py-6">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <Typography className="text-sm text-slate-500 dark:text-slate-400">
            Cargando más regalos…
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={loadMoreMobile}
            className="text-purple-600 dark:text-purple-400"
          >
            Cargar más
          </Button>
        </div>
      )}

      {!isDesktop && !hasMoreMobile && total > 0 && (
        <div className="mt-8 text-center text-sm text-slate-400 py-4">
          Fin de la lista · {total} regalos
        </div>
      )}
    </section>
  );
}
