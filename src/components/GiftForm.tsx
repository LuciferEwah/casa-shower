'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { saveGift } from '@/app/actions/giftActions';
import { Typography, TextField, Button, FormControlLabel, Switch, Snackbar, Alert, Box } from '@mui/material';

export function GiftForm({
  slug,
  editGift,
  onSaved,
  compact = false,
}: {
  slug: string;
  editGift?: Gift | null;
  onSaved: () => void;
  /** Layout más denso para panel lateral en admin PC */
  compact?: boolean;
}) {
  const [formName, setFormName] = useState(editGift?.name || '');
  const [formImage, setFormImage] = useState(editGift?.image || '');
  const [formLink, setFormLink] = useState(editGift?.link || '');
  const [formPrice, setFormPrice] = useState(editGift?.price || 0);
  const [formUnlimited, setFormUnlimited] = useState(editGift?.unlimited || false);
  const [formHidden, setFormHidden] = useState(editGift?.hidden || false);
  const [formNeededQuantity, setFormNeededQuantity] = useState(editGift?.neededQuantity || 1);
  const [formMinQuantity, setFormMinQuantity] = useState(editGift?.minQuantity || 1);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const handleSave = async () => {
    if (!formName || !formPrice) {
      setToast({ open: true, message: "Completa nombre y precio", severity: 'warning' });
      return;
    }

    const needed = Math.max(1, Number(formNeededQuantity) || 1);
    const minQ = Math.max(1, Number(formMinQuantity) || 1);

    if (minQ < 1) {
      setToast({ open: true, message: "La cantidad mínima debe ser al menos 1", severity: 'warning' });
      return;
    }
    if (!formUnlimited && minQ > needed) {
      setToast({ open: true, message: "La cantidad mínima no puede ser mayor que la cantidad necesaria", severity: 'warning' });
      return;
    }

    const data = {
      name: formName,
      image: formImage,
      link: formLink,
      price: Number(formPrice),
      unlimited: formUnlimited,
      hidden: formHidden,
      neededQuantity: needed,
      minQuantity: minQ,
      reservedCount: editGift?.reservedCount || 0,
      reservedBy: editGift?.reservedBy || null,
      reservedByAnimal: editGift?.reservedByAnimal || null,
      reservedByList: editGift?.reservedByList || []
    };

    try {
      await saveGift(slug, data, editGift?.id);
      onSaved();
    } catch (e: unknown) {
      if (e instanceof Error) setToast({ open: true, message: e.message, severity: 'error' });
    }
  };

  return (
    <Box
      className={[
        'rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl',
        compact ? 'p-4 sm:p-5 mb-0' : 'p-6 sm:p-8 mb-12',
      ].join(' ')}
    >
      <Typography
        variant={compact ? 'h6' : 'h5'}
        className="font-bold text-center text-purple-900 dark:text-purple-100"
        sx={{ mb: compact ? 2 : 4 }}
      >
        {editGift ? '✏️ Editar Regalo' : '➕ Agregar Nuevo Regalo'}
      </Typography>
      {editGift && compact && (
        <Typography
          variant="body2"
          className="text-center text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 px-1"
        >
          {editGift.name}
        </Typography>
      )}
      
      <div
        className={[
          'grid gap-3 mb-4 mt-2',
          compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8',
        ].join(' ')}
      >
        <TextField label="Nombre del regalo" fullWidth size={compact ? 'small' : 'medium'} value={formName} onChange={e => setFormName(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Precio de Referencia" type="number" fullWidth size={compact ? 'small' : 'medium'} value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField
          label="Cantidad Necesaria"
          type="number"
          fullWidth
          size={compact ? 'small' : 'medium'}
          value={formNeededQuantity}
          onChange={e => setFormNeededQuantity(Number(e.target.value))}
          className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          disabled={formUnlimited}
          slotProps={{ htmlInput: { min: 1 } }}
          helperText={compact ? undefined : (formUnlimited ? 'No aplica si es ilimitado' : 'Total de unidades que se necesitan')}
        />
        <TextField
          label="Cantidad mínima por reserva"
          type="number"
          fullWidth
          size={compact ? 'small' : 'medium'}
          value={formMinQuantity}
          onChange={e => setFormMinQuantity(Number(e.target.value))}
          className="bg-white/40 dark:bg-slate-950/40 rounded-2xl"
          slotProps={{ htmlInput: { min: 1 } }}
          helperText={compact ? undefined : 'El invitado no puede reservar menos que esto (ej. 6)'}
        />
        <TextField label="URL de Imagen" fullWidth size={compact ? 'small' : 'medium'} value={formImage} onChange={e => setFormImage(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Link de compra (Opcional)" fullWidth size={compact ? 'small' : 'medium'} value={formLink} onChange={e => setFormLink(e.target.value)} className={`bg-white/40 dark:bg-slate-950/40 rounded-2xl ${compact ? '' : 'sm:col-span-2'}`} />
      </div>
      
      <div className={`flex flex-col gap-3 ${compact ? 'mt-2' : 'sm:flex-row justify-between items-center mt-8 pt-4'}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <FormControlLabel 
            control={<Switch checked={formUnlimited} onChange={e => setFormUnlimited(e.target.checked)} color="primary" size="small" />} 
            label="Regalo ilimitado"
            className="text-slate-700 dark:text-slate-300"
          />
          <FormControlLabel 
            control={<Switch checked={formHidden} onChange={e => setFormHidden(e.target.checked)} color="primary" size="small" />} 
            label="Ocultar regalo"
            className="text-slate-700 dark:text-slate-300"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {editGift && (
            <Button 
              variant="outlined" 
              color="inherit" 
              className="rounded-full px-6 py-2.5 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 w-full shadow-sm"
              onClick={onSaved}
            >
              Cancelar
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            className="rounded-full px-6 py-2.5 font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 w-full"
            onClick={handleSave}
          >
            {editGift ? 'Guardar Cambios' : 'Agregar Regalo'}
          </Button>
        </div>
      </div>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast({ ...toast, open: false })} 
          severity={toast.severity} 
          variant="filled"
          className="rounded-xl shadow-lg font-medium"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
