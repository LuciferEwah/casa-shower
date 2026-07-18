'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Gift } from '@/types';
import { GiftCard } from './GiftCard';
import { updateGuestReservations } from '@/app/actions/giftActions';
import { Typography, Button, Box, MenuItem, Select, FormControl, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Snackbar, Alert } from '@mui/material';
import { GiftCategory, getGiftCategory } from '@/lib/categories';

export interface GuestIdentity {
  name: string;
  lastname: string;
  email: string;
  isCouple?: boolean;
  partnerName?: string;
  partnerLastname?: string;
  hasChildren?: boolean;
  childrenCount?: number;
}

const DESKTOP_PAGE_SIZE = 12;

export function GuestView({ slug, gifts }: { slug: string; gifts: Gift[] }) {
  const [identity, setIdentity] = useState<GuestIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [formName, setFormName] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formEmail, setFormEmail] = useState('');
  
  const [isCouple, setIsCouple] = useState(false);
  const [formPartnerName, setFormPartnerName] = useState('');
  const [formPartnerLastname, setFormPartnerLastname] = useState('');
  const [showCoupleInfo, setShowCoupleInfo] = useState(false);
  
  const [hasChildren, setHasChildren] = useState(false);
  const [formChildrenCount, setFormChildrenCount] = useState(1);
  
  const [error, setError] = useState('');

  // Profile edit states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileLastname, setProfileLastname] = useState('');
  const [profileIsCouple, setProfileIsCouple] = useState(false);
  const [profilePartnerName, setProfilePartnerName] = useState('');
  const [profilePartnerLastname, setProfilePartnerLastname] = useState('');
  const [profileHasChildren, setProfileHasChildren] = useState(false);
  const [profileChildrenCount, setProfileChildrenCount] = useState(1);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccessToast, setProfileSuccessToast] = useState(false);

  const handleOpenProfile = () => {
    if (!identity) return;
    setProfileName(identity.name);
    setProfileLastname(identity.lastname);
    setProfileIsCouple(!!identity.isCouple);
    setProfilePartnerName(identity.partnerName || '');
    setProfilePartnerLastname(identity.partnerLastname || '');
    setProfileHasChildren(!!identity.hasChildren);
    setProfileChildrenCount(identity.childrenCount || 1);
    setProfileError('');
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!identity) return;
    if (!profileName.trim() || !profileLastname.trim()) {
      setProfileError('Por favor completa tu nombre y apellido.');
      return;
    }
    if (profileIsCouple && !profilePartnerName.trim()) {
      setProfileError('Por favor ingresa el nombre de tu pareja / acompañante.');
      return;
    }

    setProfileLoading(true);
    try {
      let reserveName = profileName.trim();
      let reserveLastname = profileLastname.trim();

      if (profileIsCouple && profilePartnerName.trim()) {
        const partnerName = profilePartnerName.trim();
        const partnerLastname = profilePartnerLastname.trim();
        const primaryLastname = profileLastname.trim();

        if (!partnerLastname || partnerLastname.toLowerCase() === primaryLastname.toLowerCase()) {
          reserveName = `${profileName.trim()} y ${partnerName}`;
          reserveLastname = profileLastname.trim();
        } else {
          reserveName = `${profileName.trim()} ${profileLastname.trim()}`;
          reserveLastname = `y ${partnerName} ${partnerLastname}`;
        }
      }
      
      const newFullName = `${reserveName} ${reserveLastname}`;

      const accompaniment = {
        isCouple: profileIsCouple,
        partnerName: profileIsCouple ? profilePartnerName.trim() : undefined,
        partnerLastname: profileIsCouple ? profilePartnerLastname.trim() : undefined,
        hasChildren: profileHasChildren,
        childrenCount: profileHasChildren ? Number(profileChildrenCount) || 1 : undefined,
      };

      await updateGuestReservations(slug, identity.email, newFullName, accompaniment);

      const updatedIdentity: GuestIdentity = {
        ...identity,
        name: profileName.trim(),
        lastname: profileLastname.trim(),
        ...accompaniment
      };

      localStorage.setItem('casa_shower_guest', JSON.stringify(updatedIdentity));
      setIdentity(updatedIdentity);
      
      setProfileModalOpen(false);
      setProfileSuccessToast(true);
    } catch (e: unknown) {
      if (e instanceof Error) setProfileError(e.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GiftCategory | 'all'>('all');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'available' | 'reserved_by_me' | 'reserved_by_others'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc'>('price_asc');
  const [showFilters, setShowFilters] = useState(false);

  // Page number
  const [page, setPage] = useState(1);

  const giftsAnchorRef = useRef<HTMLDivElement | null>(null);

  const scrollToGifts = useCallback(() => {
    if (giftsAnchorRef.current) {
      const rect = giftsAnchorRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      window.scrollTo({
        top: rect.top + scrollTop - 16,
        behavior: 'smooth',
      });
    }
  }, []);

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
    if (isCouple && !formPartnerName.trim()) {
      setError('Por favor ingresa el nombre de tu pareja / acompañante.');
      return;
    }

    const newIdentity: GuestIdentity = {
      name: formName.trim(),
      lastname: formLastname.trim(),
      email: formEmail.trim().toLowerCase(),
      isCouple,
      partnerName: isCouple ? formPartnerName.trim() : undefined,
      partnerLastname: isCouple ? formPartnerLastname.trim() : undefined,
      hasChildren,
      childrenCount: hasChildren ? Number(formChildrenCount) || 1 : undefined,
    };

    localStorage.setItem('casa_shower_guest', JSON.stringify(newIdentity));
    setIdentity(newIdentity);
  };

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  const filteredAndSortedGifts = useMemo(() => {
    let result = gifts.filter((g) => !g.hidden);

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(lowerSearch));
    }

    if (categoryFilter !== 'all') {
      result = result.filter((g) => getGiftCategory(g.price) === categoryFilter);
    }

    if (reservationFilter === 'available') {
      result = result.filter((g) => {
        const count = g.reservedCount || 0;
        const needed = g.neededQuantity || 1;
        const minQuantity = Math.max(1, g.minQuantity || 1);
        const remaining = g.unlimited ? Number.POSITIVE_INFINITY : Math.max(0, needed - count);
        const canMeetMinimum = g.unlimited || remaining >= minQuantity;
        return g.unlimited ? true : count < needed && canMeetMinimum;
      });
    } else if (reservationFilter === 'reserved_by_me') {
      result = result.filter((g) => {
        if (!identity) return false;
        const myEmail = identity.email.toLowerCase();
        if (g.reservedByList && g.reservedByList.some(r => r.email?.toLowerCase() === myEmail)) return true;
        if (g.reservedByEmail?.toLowerCase() === myEmail) return true;
        return false;
      });
    } else if (reservationFilter === 'reserved_by_others') {
      result = result.filter((g) => {
        const count = g.reservedCount || 0;
        if (count === 0) return false;
        if (!identity) return true;
        const myEmail = identity.email.toLowerCase();
        const isByMe = 
          (g.reservedByList && g.reservedByList.some(r => r.email?.toLowerCase() === myEmail)) || 
          g.reservedByEmail?.toLowerCase() === myEmail;
        if (isByMe) {
          const myReservationsCount = g.reservedByList
            ? g.reservedByList.filter(r => r.email?.toLowerCase() === myEmail).length
            : 1;
          return count > myReservationsCount;
        }
        return true;
      });
    }

    if (sortOrder === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [gifts, searchTerm, categoryFilter, reservationFilter, sortOrder, identity]);

  const total = filteredAndSortedGifts.length;
  const totalPages = Math.max(1, Math.ceil(total / DESKTOP_PAGE_SIZE));
  // Derive safe page without setState-in-effect
  const safePage = Math.min(Math.max(1, page), totalPages);

  const visibleGifts = useMemo(() => {
    const start = (safePage - 1) * DESKTOP_PAGE_SIZE;
    return filteredAndSortedGifts.slice(start, start + DESKTOP_PAGE_SIZE);
  }, [filteredAndSortedGifts, safePage]);

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

            {/* Toggle Regalo en Pareja */}
            <label className="relative flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all select-none mt-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💑</span>
                <div className="text-left">
                  <div className="text-sm font-bold text-purple-900 dark:text-purple-100">Regalo en Pareja</div>
                  <div className="text-xs text-purple-700 dark:text-purple-400 font-medium">Hacer la reserva entre dos personas</div>
                </div>
              </div>
              <div className="relative animate-in zoom-in duration-200">
                <input 
                  type="checkbox" 
                  checked={isCouple}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCouple(checked);
                    if (checked) {
                      setShowCoupleInfo(true);
                    }
                    setError('');
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </div>
            </label>

            {/* Campos del Acompañante */}
            {isCouple && (
              <div className="w-full flex flex-col gap-4 mt-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Datos del Acompañante
                </div>
                <input
                  type="text"
                  placeholder="Nombre de tu pareja"
                  value={formPartnerName}
                  onChange={(e) => {
                    setFormPartnerName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Apellido (opcional si es el mismo)"
                  value={formPartnerLastname}
                  onChange={(e) => {
                    setFormPartnerLastname(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Toggle Asistir con Niños */}
            <label className="relative flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all select-none mt-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👶</span>
                <div className="text-left">
                  <div className="text-sm font-bold text-purple-900 dark:text-purple-100">Asistir con Niños / Hijos</div>
                  <div className="text-xs text-purple-700 dark:text-purple-400 font-medium font-sans">Indicar si asistes acompañado de niños</div>
                </div>
              </div>
              <div className="relative animate-in zoom-in duration-200">
                <input 
                  type="checkbox" 
                  checked={hasChildren}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasChildren(checked);
                    setError('');
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </div>
            </label>

            {/* Selector de Cantidad de Niños */}
            {hasChildren && (
              <div className="w-full flex flex-col gap-4 mt-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Cantidad de Niños / Hijos
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormChildrenCount(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all text-lg"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-bold text-lg text-slate-800 dark:text-slate-200">
                    {formChildrenCount} {formChildrenCount === 1 ? 'niño' : 'niños'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormChildrenCount(prev => prev + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Typography className="text-red-500 text-sm mt-4 font-bold animate-pulse">
              {error}
            </Typography>
          )}

          <div className="w-full mt-6">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleLogin}
              className="w-full rounded-full py-4 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r from-purple-700 to-purple-900 text-white border border-purple-500/30"
            >
              Entrar a la Lista
            </Button>
          </div>
        </Box>

        {/* Diálogo Informativo de Pareja */}
        <Dialog 
          open={showCoupleInfo} 
          onClose={() => setShowCoupleInfo(false)}
          classes={{ paper: "rounded-[2rem] p-4 sm:p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 m-4 max-w-sm text-slate-900 dark:text-slate-100" }}
        >
          <DialogTitle className="font-bold text-slate-800 dark:text-slate-100 text-xl pb-2 text-center">
            💑 ¡Regalo en Pareja!
          </DialogTitle>
          <DialogContent className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/60 rounded-full flex items-center justify-center text-3xl shadow-inner border border-purple-200 dark:border-purple-700">
              🎁
            </div>
            <DialogContentText className="text-slate-600 dark:text-slate-400 font-medium text-base leading-relaxed">
              Dado que van a hacer un regalo de a dos, ¡les sugerimos elegir algo genial! Pónganse con un regalo weno sipo. 😉✨
            </DialogContentText>
          </DialogContent>
          <DialogActions className="justify-center pb-2 pt-2">
            <Button 
              onClick={() => setShowCoupleInfo(false)} 
              color="primary" 
              variant="contained"
              className="font-bold rounded-full px-8 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white w-full max-w-[200px]"
              autoFocus
            >
              ¡Entendido! 👍
            </Button>
          </DialogActions>
        </Dialog>
      </section>
    );
  }

  return (
    <section className="guest-view w-full animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 px-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm">
        <Typography className="text-slate-700 dark:text-slate-200 font-medium text-center sm:text-left mb-3 sm:mb-0">
          Hola, <span className="font-bold text-purple-700 dark:text-purple-400">
            {identity.isCouple && identity.partnerName 
              ? `${identity.name} y ${identity.partnerName}` 
              : identity.name}
          </span> 👋
        </Typography>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenProfile}
            className="rounded-full px-4 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/20"
          >
            Editar Perfil 👤
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              localStorage.removeItem('casa_shower_guest');
              setIdentity(null);
            }}
            className="rounded-full px-4 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Anchor for scrolling to gifts */}
      <div ref={giftsAnchorRef} />

      {/* Toolbar: sticky en PC y móvil — al bajar queda fija arriba; al subir vuelve a su lugar */}
      <div
        className={[
          'sticky z-50 mb-6',
          'top-[max(0px,env(safe-area-inset-top,0px))]',
          'p-4 sm:p-5',
          'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
          'rounded-[2rem]',
          'border border-white/70 dark:border-slate-700/70',
          'shadow-lg shadow-purple-900/5 dark:shadow-black/30',
          'flex flex-col gap-4',
        ].join(' ')}
      >
        {/* Fila 1: Buscador y Ordenamiento */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex gap-2 items-center w-full md:max-w-md flex-shrink-0">
            <div className="relative flex-1">
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
            
            {/* Botón de más filtros */}
            <Button
              variant="outlined"
              size="medium"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3.5 py-2.5 flex items-center gap-1.5 min-w-[100px] h-[46px] bg-white/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <span className="text-sm">Filtros</span>
              <span 
                className="text-[10px] transition-transform duration-300 font-sans"
                style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >
                ▼
              </span>
            </Button>
          </div>

          {/* Envoltura nativa para garantizar ocultamiento responsive correcto sin conflictos con MUI */}
          <div className="min-w-[180px] w-full md:w-auto hidden md:block">
            <FormControl size="small" className="w-full">
              <Select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc');
                  resetPagination();
                  scrollToGifts();
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

        {/* Fila 2 (Panel Colapsable): Filtros de Categorías y Reservas */}
        <div
          className={[
            showFilters ? 'flex animate-in slide-in-from-top duration-300' : 'hidden',
            'flex-col gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3'
          ].join(' ')}
        >
          {/* Ordenamiento (solo visible aquí en móvil) */}
          <div className="md:hidden flex flex-col gap-1.5">
            <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
              Ordenar por
            </Typography>
            <FormControl size="small" className="w-full">
              <Select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc');
                  resetPagination();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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

          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Filtro de Categorías */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
                Categorías
              </Typography>
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 items-center">
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
                      scrollToGifts();
                    }}
                    className={`rounded-full w-full py-1.5 whitespace-nowrap text-xs font-bold text-center justify-center ${
                      categoryFilter === cat.id
                        ? cat.active
                        : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtro de Reservas */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 lg:border-l lg:border-slate-100 lg:dark:border-slate-800/60 lg:pl-4">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">
                Estado de Reserva
              </Typography>
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 items-center">
                {(
                  [
                    { id: 'all' as const, label: 'Todos 🎁', active: 'bg-purple-600' },
                    { id: 'available' as const, label: 'Disponibles ✅', active: 'bg-green-600 text-white' },
                    { id: 'reserved_by_me' as const, label: 'Mis Reservas 💖', active: 'bg-fuchsia-600 text-white' },
                    { id: 'reserved_by_others' as const, label: 'Reservados 👥', active: 'bg-blue-600 text-white' },
                  ] as const
                ).map((status) => (
                  <Button
                    key={status.id}
                    variant={reservationFilter === status.id ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      setReservationFilter(status.id);
                      resetPagination();
                      scrollToGifts();
                    }}
                    className={`rounded-full w-full py-1.5 whitespace-nowrap text-xs font-bold text-center justify-center ${
                      reservationFilter === status.id
                        ? status.active
                        : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400 font-medium px-1">
        {total === 0
          ? 'Sin resultados'
          : `Mostrando ${(safePage - 1) * DESKTOP_PAGE_SIZE + 1}–${Math.min(safePage * DESKTOP_PAGE_SIZE, total)} de ${total}`}
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

      {/* Pagination */}
      {total > DESKTOP_PAGE_SIZE && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outlined"
            size="small"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, Math.min(p, totalPages) - 1));
              scrollToGifts();
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
                  scrollToGifts();
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
              scrollToGifts();
            }}
            className="rounded-full px-4 border-slate-300 dark:border-slate-600"
          >
            Siguiente →
          </Button>
        </div>
      )}
      {/* Profile Edit Dialog */}
      <Dialog
        open={profileModalOpen}
        onClose={() => !profileLoading && setProfileModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: 'rounded-[2rem] p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-2xl',
            sx: { borderRadius: '2rem' }
          }
        }}
      >
        <DialogTitle className="font-bold text-center text-purple-900 dark:text-purple-100 text-xl pb-1">
          👤 Mi Perfil
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 mt-2">
          <input
            type="text"
            placeholder="Nombre"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
          />
          <input
            type="text"
            placeholder="Apellido"
            value={profileLastname}
            onChange={(e) => setProfileLastname(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
          />
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={identity?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/20 text-slate-500 cursor-not-allowed text-sm font-medium"
          />

          {/* Toggle Regalo en Pareja */}
          <label className="relative flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/50 dark:border-purple-800/30 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all select-none">
            <div className="flex items-center gap-3">
              <span className="text-xl">💑</span>
              <div className="text-left">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-100">Regalo en Pareja</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">Hacer la reserva entre dos personas</div>
              </div>
            </div>
            <div className="relative animate-in zoom-in duration-200">
              <input 
                type="checkbox" 
                checked={profileIsCouple}
                onChange={(e) => setProfileIsCouple(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </div>
          </label>

          {/* Campos del Acompañante */}
          {profileIsCouple && (
            <div className="w-full flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Datos del Acompañante
              </div>
              <input
                type="text"
                placeholder="Nombre de tu pareja"
                value={profilePartnerName}
                onChange={(e) => setProfilePartnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              />
              <input
                type="text"
                placeholder="Apellido (opcional)"
                value={profilePartnerLastname}
                onChange={(e) => setProfilePartnerLastname(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
              />
            </div>
          )}

          {/* Toggle Asistir con Niños */}
          <label className="relative flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/50 dark:border-purple-800/30 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all select-none">
            <div className="flex items-center gap-3">
              <span className="text-xl">👶</span>
              <div className="text-left">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-100">Asistir con Niños / Hijos</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium font-sans">Indicar si asistes acompañado de niños</div>
              </div>
            </div>
            <div className="relative animate-in zoom-in duration-200">
              <input 
                type="checkbox" 
                checked={profileHasChildren}
                onChange={(e) => setProfileHasChildren(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </div>
          </label>

          {/* Selector de Cantidad de Niños */}
          {profileHasChildren && (
            <div className="w-full flex flex-col gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Cantidad de Niños / Hijos
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProfileChildrenCount(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all text-base"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-base text-slate-800 dark:text-slate-200">
                  {profileChildrenCount} {profileChildrenCount === 1 ? 'niño' : 'niños'}
                </div>
                <button
                  type="button"
                  onClick={() => setProfileChildrenCount(prev => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all text-base"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {profileError && (
            <Typography className="text-red-500 text-xs font-bold text-center mt-1 animate-pulse">
              {profileError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions className="flex gap-2 p-4 pt-1 justify-between">
          <Button 
            onClick={() => setProfileModalOpen(false)} 
            disabled={profileLoading}
            variant="outlined"
            className="rounded-full px-6 py-2.5 font-bold text-sm border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 w-full shadow-sm"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            disabled={profileLoading}
            variant="contained"
            color="primary"
            className="rounded-full px-6 py-2.5 font-bold text-sm bg-gradient-to-r from-purple-700 to-purple-900 text-white w-full"
          >
            {profileLoading ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={profileSuccessToast}
        autoHideDuration={4000}
        onClose={() => setProfileSuccessToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setProfileSuccessToast(false)} 
          severity="success" 
          variant="filled"
          className="rounded-xl shadow-lg font-medium"
        >
          ¡Perfil actualizado con éxito!
        </Alert>
      </Snackbar>
    </section>
  );
}
