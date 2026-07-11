'use client';

import { useState } from 'react';
import { Gift } from '@/types';
import { saveGift } from '@/app/actions/giftActions';
import { Typography, TextField, Button, FormControlLabel, Switch } from '@mui/material';

export function GiftForm({ editGift, onSaved }: { editGift?: Gift | null, onSaved: () => void }) {
  const [formName, setFormName] = useState(editGift?.name || '');
  const [formImage, setFormImage] = useState(editGift?.image || '');
  const [formLink, setFormLink] = useState(editGift?.link || '');
  const [formPrice, setFormPrice] = useState(editGift?.price || 0);
  const [formUnlimited, setFormUnlimited] = useState(editGift?.unlimited || false);

  const handleSave = async () => {
    if (!formName || !formPrice) return alert("Completa nombre y precio");

    const data = {
      name: formName,
      image: formImage,
      link: formLink,
      price: Number(formPrice),
      unlimited: formUnlimited,
      reservedBy: editGift?.reservedBy || null,
      reservedByAnimal: editGift?.reservedByAnimal || null,
      reservedByList: editGift?.reservedByList || []
    };

    try {
      await saveGift(data, editGift?.id);
      onSaved();
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
    }
  };

  return (
    <div className="p-8 mb-12 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-xl">
      <Typography variant="h5" className="font-bold mb-8 text-center text-purple-900 dark:text-purple-100">
        {editGift ? 'Editar Regalo' : 'Agregar Nuevo Regalo'}
      </Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TextField label="Nombre del regalo" fullWidth value={formName} onChange={e => setFormName(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="Precio" type="number" fullWidth value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl" />
        <TextField label="URL de Imagen" fullWidth value={formImage} onChange={e => setFormImage(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl md:col-span-2" />
        <TextField label="Link de compra (Opcional)" fullWidth value={formLink} onChange={e => setFormLink(e.target.value)} className="bg-white/40 dark:bg-slate-950/40 rounded-2xl md:col-span-2" />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/30 dark:bg-slate-950/30 p-4 rounded-2xl border border-white/40 dark:border-slate-800/50">
        <FormControlLabel
          control={<Switch checked={formUnlimited} onChange={e => setFormUnlimited(e.target.checked)} color="primary" />}
          label={<Typography className="font-semibold text-slate-700 dark:text-slate-300">Regalo Ilimitado (Todos pueden reservar)</Typography>}
          className="ml-2"
        />
        <div className="flex gap-3 w-full sm:w-auto">
          {editGift && (
            <Button 
              variant="outlined" 
              color="inherit" 
              size="large"
              className="rounded-full px-6 py-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={onSaved}
            >
              Cancelar
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            className="rounded-full px-10 py-3 font-bold shadow-md hover:shadow-lg w-full sm:w-auto"
            onClick={handleSave}
          >
            {editGift ? 'Guardar Cambios' : 'Agregar Regalo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
