import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Avatar, Container } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const sharedFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: alpha('#ffffff', 0.98),
      transition: 'all 0.2s ease',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha('#1976d2', 0.5),
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
        borderWidth: '1.5px',
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning('Preencha todos os campos.');
      return;
    }

    setShowResendButton(false);
    const result = await login(email, password);

    if (result.success) {
      toast.success('Bem-vindo.');
      navigate('/admin');
      return;
    }

    if (result.needsVerification) {
      toast.warning(result.message || 'Conta nao verificada.');
      setShowResendButton(true);
      return;
    }

    toast.error(result.message || 'Email ou senha invalidos.');
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.warning('Informe o email para reenviar a verificacao.');
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      toast.success(response.data?.message || 'Email de verificacao reenviado.');
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message.join(', ') : message || 'Erro ao reenviar email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Acesso Restrito
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={sharedFieldSx}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={sharedFieldSx}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 1, py: 1.2, borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            Entrar
          </Button>

          {showResendButton && (
            <Button
              type="button"
              fullWidth
              variant="outlined"
              disabled={resendLoading}
              onClick={handleResendVerification}
              sx={{ mb: 1.5, py: 1.1, borderRadius: 2.5, textTransform: 'none' }}
            >
              {resendLoading ? 'Reenviando...' : 'Reenviar email de verificacao'}
            </Button>
          )}

          <Button
            type="button"
            fullWidth
            variant="text"
            onClick={() => navigate('/register')}
            sx={{ py: 0.8, textTransform: 'none' }}
          >
            Criar conta de suporte
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

