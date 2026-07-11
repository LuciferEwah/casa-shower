'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { saveGift } from '@/app/actions/giftActions';
import { Typography, TextField, Button, FormControlLabel, Switch, Snackbar, Alert, Box } from '@mui/material';

export function GiftForm({ slug, editGift, onSaved }: { slug: string, editGift?: Gift | null, onSaved: () => void }) {
  const [formName, setFormName] = useState(editGift?.name || '');
  const [formImage, setFormImage] = useState(editGift?.image || '');
  const [formLink, setFormLink] = useState(editGift?.link || '');
  const [formPrice, setFormPrice] = useState(editGift?.price || 0);
  const [formUnlimited, setFormUnlimited] = useState(editGift?.unlimited || false);
  const [formNeededQuantity, setFormNeededQuantity] = useState(editGift?.neededQuantity || 1);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const handleSave = async () => {
    if (!formName || !formPrice) {
      setToast({ open: true, message: "Completa nombre y precio", severity: 'warning' });
      return;
    }

    const data = {
      name: formName,
      image: formImage,
      link: formLink,
      price: Number(formPrice),
      unlimited: formUnlimited,
      neededQuantity: Number(formNeededQuantity),
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
    <Box className="p-6 sm:p-8 mb-12 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
      <Typography variant="h5" className="font-bold mb-8 text-center text-purple-900 dark:text-purple-100">
        {editGift ? 'Editar Regalo' : 'Agregar Nuevo Regalo'}
      </Typography>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <TextField label="Nombre del regalo" fullWidth value={formName} onChange={e => setFormName(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Precio" type="number" fullWidth value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Cantidad Necesaria" type="number" fullWidth value={formNeededQuantity} onChange={e => setFormNeededQuantity(Number(e.target.value))} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" disabled={formUnlimited} />
        <TextField label="URL de Imagen" fullWidth value={formImage} onChange={e => setFormImage(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Link de compra (Opcional)" fullWidth value={formLink} onChange={e => setFormLink(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl sm:col-span-2" />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/30 dark:bg-slate-950/30 p-4 rounded-2xl border border-white/40 dark:border-slate-800/50">
        <FormControlLabel
          control={<Switch checked={formUnlimited} onChange={e => setFormUnlimited(e.target.checked)} color="primary" />}
          label={<Typography className="font-semibold text-slate-700 dark:text-slate-300">Regalo Ilimitado (Todos pueden reservar)</Typography>}
          className="ml-1 w-full sm:w-auto"
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {editGift && (
            <Button 
              variant="outlined" 
              color="inherit" 
              className="rounded-full px-6 py-2 sm:py-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
              onClick={onSaved}
            >
              Cancelar
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            className="rounded-full px-8 py-2 sm:py-3 font-bold shadow-md hover:shadow-lg w-full sm:w-auto"
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
