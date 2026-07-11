'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import { loginAdmin } from '@/app/actions/adminActions';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const res = await loginAdmin(pin);
    setLoading(false);
    if (res.success) {
      setPin('');
      onSuccess();
    } else {
      setError(res.error || 'PIN incorrecto');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { borderRadius: '1rem' } }}>
      <DialogTitle className="font-bold">Acceso Administrador</DialogTitle>
      <DialogContent className="flex flex-col gap-4 mt-2">
        <TextField
          autoFocus
          label="PIN"
          type="password"
          fullWidth
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          error={!!error}
          helperText={error}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
      </DialogContent>
      <DialogActions className="p-4">
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleLogin} variant="contained" disabled={loading} className="bg-black text-white hover:bg-zinc-800">
          {loading ? <CircularProgress size={24} /> : 'Entrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
