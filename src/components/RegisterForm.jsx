import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import 'react-toastify/dist/ReactToastify.css';

const CORES_DISPONIVEIS = ['#1976d2', '#d32f2f', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#7b1fa2', '#455a64'];

export default function RegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cor: '#1976d2',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleColorSelect = (corEscolhida) => {
    setFormData({ ...formData, cor: corEscolhida });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.nome || !formData.email || !formData.senha) {
      toast.warning('Preencha todos os campos obrigatorios.');
      return;
    }
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas nao coincidem.');
      return;
    }
    if (formData.senha.length < 6) {
      toast.warning('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        cor: formData.cor,
      };

      const response = await api.post('/auth/register', payload);
      toast.success(response.data?.message || 'Cadastro realizado. Verifique seu email para ativar a conta.');

      setFormData({ nome: '', email: '', senha: '', confirmarSenha: '', cor: '#1976d2' });

      setTimeout(() => navigate('/login'), 1700);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Erro ao cadastrar usuario.';
      if (Array.isArray(msg)) {
        toast.error(msg.join(', '));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <Box
        sx={{
          my: 'auto',
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: formData.cor, transition: 'background-color 0.3s' }}>
            <PersonAddIcon />
          </Avatar>

          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
            Criar Nova Conta
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            A conta so sera liberada apos validacao no email.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="nome"
              label="Nome Completo"
              name="nome"
              autoComplete="name"
              autoFocus
              value={formData.nome}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />

            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Escolha sua cor:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {CORES_DISPONIVEIS.map((cor) => (
                  <Tooltip title="Escolher cor" key={cor}>
                    <Box
                      onClick={() => handleColorSelect(cor)}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: cor,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, border 0.2s',
                        transform: formData.cor === cor ? 'scale(1.2)' : 'scale(1)',
                        border: formData.cor === cor ? '3px solid #333' : '2px solid transparent',
                        boxShadow: formData.cor === cor ? 3 : 1,
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              name="senha"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="senha"
              value={formData.senha}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmarSenha"
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              id="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              error={formData.confirmarSenha !== '' && formData.senha !== formData.confirmarSenha}
              helperText={
                formData.confirmarSenha !== '' && formData.senha !== formData.confirmarSenha ? 'As senhas nao conferem' : ''
              }
            />

            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              loading={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontWeight: 'bold',
                bgcolor: formData.cor,
                '&:hover': { bgcolor: formData.cor, filter: 'brightness(0.9)' },
              }}
            >
              CADASTRAR
            </LoadingButton>

            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ color: formData.cor }}
            >
              Ja tem uma conta? Faca Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
