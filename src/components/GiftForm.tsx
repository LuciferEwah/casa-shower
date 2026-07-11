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
    <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <Typography variant="h6" className="font-bold mb-6 text-center text-zinc-900 dark:text-zinc-100">
        {editGift ? 'Editar Regalo' : 'Agregar Nuevo Regalo'}
      </Typography>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <TextField label="Nombre del regalo" fullWidth value={formName} onChange={e => setFormName(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 rounded-xl" />
        <TextField label="Precio" type="number" fullWidth value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-zinc-50 dark:bg-zinc-950 rounded-xl" />
        <TextField label="URL de Imagen" fullWidth value={formImage} onChange={e => setFormImage(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 rounded-xl sm:col-span-2" />
        <TextField label="Link de compra (Opcional)" fullWidth value={formLink} onChange={e => setFormLink(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 rounded-xl sm:col-span-2" />
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <FormControlLabel
          control={<Switch checked={formUnlimited} onChange={e => setFormUnlimited(e.target.checked)} color="primary" />}
          label={<Typography className="font-medium text-zinc-700 dark:text-zinc-300">Regalo Ilimitado (Todos pueden reservar)</Typography>}
          className="ml-1 w-full sm:w-auto"
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {editGift && (
            <Button 
              variant="outlined" 
              color="inherit" 
              className="rounded-full px-6 py-2 sm:py-3 font-bold border-zinc-300 text-zinc-700 hover:bg-zinc-100 w-full sm:w-auto"
              onClick={onSaved}
            >
              Cancelar
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            className="rounded-full px-8 py-2 sm:py-3 font-bold shadow-sm hover:shadow-md w-full sm:w-auto bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black"
            onClick={handleSave}
          >
            {editGift ? 'Guardar Cambios' : 'Agregar Regalo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
