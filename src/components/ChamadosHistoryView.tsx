import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ToggleThemeButton from './ToggleThemeButton';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

export default function ChamadosHistoryView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [busca, setBusca] = useState('');
  const [historico, setHistorico] = useState([]);
  const [selecionado, setSelecionado] = useState(null);

  const carregarHistorico = async () => {
    try {
      const { data } = await api.get('/chamados');
      const finalizados = (data || []).filter((item) => item.status === 'FINALIZADO');
      setHistorico(finalizados);
    } catch {
      toast.error('Erro ao carregar historico de chamados.');
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const historicoFiltrado = useMemo(() => {
    const termo = busca.toLowerCase();
    return historico.filter((item) => {
      return (
        String(item.id).includes(termo) ||
        (item.nomeEmpresa || '').toLowerCase().includes(termo) ||
        (item.servico || '').toLowerCase().includes(termo) ||
        (item.descricao || '').toLowerCase().includes(termo) ||
        (item.responsavel || '').toLowerCase().includes(termo)
      );
    });
  }, [busca, historico]);

  return (
    <Box sx={{ p: 3, minHeight: '90vh', mt: 5, background: isDark ? 'linear-gradient(140deg, #1d1f2f 0%, #1b2335 45%, #242433 100%)' : 'linear-gradient(140deg, #f3f7ff 0%, #eef7ff 45%, #fff5ee 100%)' }}>
      <Paper elevation={0} sx={{ borderRadius: 4, p: 3, mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: alpha(theme.palette.background.paper, 0.88), backdropFilter: 'blur(10px)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Historico de Chamados Finalizados</Typography>
            <Typography variant="body2" color="text.secondary">Registro completo dos chamados removidos do fluxo ativo.</Typography>
          </Box>
          <Box display="flex" gap={1.2} flexWrap="wrap">
            <Chip icon={<AssignmentTurnedInIcon />} label={`Total: ${historico.length}`} color="success" variant="outlined" sx={{ borderRadius: 2.5, height: 38, fontWeight: 700 }} />
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ borderRadius: 2.5, height: 38, px: 2, textTransform: 'none', fontWeight: 700 }}>Voltar ao Kanban</Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={() => { logout(); navigate('/login'); }} sx={{ borderRadius: 2.5, height: 38, px: 2, textTransform: 'none', fontWeight: 700 }}>Sair</Button>
            <ToggleThemeButton />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por ID, empresa, servico, descricao ou responsavel..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Grid container spacing={2}>
        {historicoFiltrado.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(19,78,172,0.14)' }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption">#{item.id}</Typography>
                <Chip size="small" color="success" label="Finalizado" />
              </Box>
              <Typography variant="subtitle1" fontWeight={800}>{item.nomeEmpresa}</Typography>
              <Box mt={1} display="flex" gap={0.8} flexWrap="wrap">
                <Chip size="small" label={item.servico} />
                {item.responsavel && <Chip size="small" icon={<PersonIcon />} label={item.responsavel} />}
              </Box>
              <Box mt={1.2} display="flex" flexDirection="column" gap={0.4}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.6}><BusinessIcon sx={{ fontSize: 14 }} /> Empresa: {item.nomeEmpresa}</Typography>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.6}><AccessTimeIcon sx={{ fontSize: 14 }} /> Finalizado em: {formatDateTime(item.updatedAt)}</Typography>
              </Box>
              <Button sx={{ mt: 1.5, textTransform: 'none' }} size="small" onClick={() => setSelecionado(item)}>Ver detalhes</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(selecionado)} onClose={() => setSelecionado(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chamado #{selecionado?.id}
          <IconButton onClick={() => setSelecionado(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
          <Typography variant="h6" fontWeight={700} mb={2}>{selecionado?.nomeEmpresa}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Servico</Typography>
          <Typography mb={2}>{selecionado?.servico}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Descricao</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }} mb={2}>{selecionado?.descricao || '-'}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Criado em</Typography>
          <Typography mb={1}>{formatDateTime(selecionado?.createdAt)}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Finalizado em</Typography>
          <Typography>{formatDateTime(selecionado?.updatedAt)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelecionado(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
