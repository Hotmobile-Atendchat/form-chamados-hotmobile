import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Paper, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function VerifyAccountView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Validando sua conta...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificacao ausente. Use o link completo enviado no email.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-account?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage(response.data?.message || 'Conta verificada com sucesso.');
      } catch (error) {
        const backendMessage = error?.response?.data?.message;
        setStatus('error');
        setMessage(Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage || 'Falha ao verificar conta.');
      }
    };

    verify();
  }, [token]);

  return (
    <Container component="main" maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', py: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: '100%', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {status === 'loading' && <CircularProgress />}
          {status === 'success' && <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />}
          {status === 'error' && <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Verificacao de Conta
        </Typography>

        <Alert
          icon={status === 'success' ? <MarkEmailReadIcon /> : undefined}
          severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
          sx={{ mt: 2, textAlign: 'left' }}
        >
          {message}
        </Alert>

        <Button variant="contained" sx={{ mt: 3, textTransform: 'none' }} onClick={() => navigate('/login')}>
          Ir para Login
        </Button>
      </Paper>
    </Container>
  );
}
