'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import { loginAdmin } from '@/app/actions/adminActions';

interface LoginModalProps {
  slug: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ slug, open, onClose, onSuccess }: LoginModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const res = await loginAdmin(slug, pin);
    setLoading(false);
    if (res.success) {
      setPin('');
      onSuccess();
    } else {
      setError(res.error || 'PIN incorrecto');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      sx={{ 
        '& .MuiDialog-paper': { 
          borderRadius: '2rem', 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
        } 
      }}
    >
      <DialogTitle className="font-bold text-center text-purple-900 pt-8 pb-2">Acceso Administrador</DialogTitle>
      <DialogContent className="flex flex-col gap-4 mt-2 px-8 pb-4">
        <TextField
          autoFocus
          label="PIN de Administrador"
          type="password"
          fullWidth
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          error={!!error}
          helperText={error}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="bg-white/50 rounded-2xl mt-2"
        />
      </DialogContent>
      <DialogActions className="p-6 pt-0 justify-center gap-4">
        <Button onClick={onClose} className="text-slate-500 font-bold px-6 py-2 rounded-full">Cancelar</Button>
        <Button onClick={handleLogin} variant="contained" color="primary" disabled={loading} className="font-bold px-8 py-2 rounded-full shadow-md">
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
