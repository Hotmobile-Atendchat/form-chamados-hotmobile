import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ToggleThemeButton from './ToggleThemeButton';

const PROJECT_COLUMNS = {
  NOVO: { id: 'NOVO', title: 'Novo', bg: '#E3F2FD', border: '#2196F3' },
  PLANEJAMENTO: { id: 'PLANEJAMENTO', title: 'Planejamento', bg: '#FFF3E0', border: '#FB8C00' },
  EM_EXECUCAO: { id: 'EM_EXECUCAO', title: 'Em Execução', bg: '#E8F5E9', border: '#43A047' },
  VALIDACAO: { id: 'VALIDACAO', title: 'Validação', bg: '#F3E5F5', border: '#8E24AA' },
  FINALIZADO: { id: 'FINALIZADO', title: 'Finalizado', bg: '#ECEFF1', border: '#546E7A' },
};

export default function ProjectBoard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [projetos, setProjetos] = useState([]);
  const [busca, setBusca] = useState('');
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const carregarProjetos = async () => {
    try {
      const { data } = await api.get('/projetos');
      setProjetos(data);
    } catch (error) {
      toast.error('Erro ao carregar projetos.');
    }
  };

  useEffect(() => {
    carregarProjetos();
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Você saiu do sistema.');
    navigate('/login');
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const novoStatus = destination.droppableId;
    const projetoId = parseInt(draggableId, 10);
    atualizarStatus(projetoId, novoStatus);
  };

  const atualizarStatus = async (id, novoStatus) => {
    const projetosAntigos = [...projetos];
    const dadosAtualizacao = { status: novoStatus };

    if (novoStatus === 'EM_EXECUCAO') {
      const nomeResponsavel = user?.nome || user?.name || user?.email;
      const corResponsavel = user?.cor || '#1976d2';
      if (nomeResponsavel) {
        dadosAtualizacao.responsavel = nomeResponsavel;
        dadosAtualizacao.responsavelCor = corResponsavel;
      }
    }

    setProjetos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: novoStatus,
              responsavel: dadosAtualizacao.responsavel || p.responsavel,
              responsavelCor: dadosAtualizacao.responsavelCor || p.responsavelCor,
            }
          : p,
      ),
    );

    if (projetoSelecionado && projetoSelecionado.id === id) {
      setProjetoSelecionado((prev) =>
        prev
          ? {
              ...prev,
              status: novoStatus,
              responsavel: dadosAtualizacao.responsavel || prev.responsavel,
              responsavelCor: dadosAtualizacao.responsavelCor || prev.responsavelCor,
            }
          : null,
      );
    }

    try {
      await api.patch(`/projetos/${id}/status`, dadosAtualizacao);
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
      setProjetos(projetosAntigos);
    }
  };

  const handleDeleteProjeto = async () => {
    if (!projetoSelecionado) return;
    try {
      await api.delete(`/projetos/${projetoSelecionado.id}`);
      setProjetos((prev) => prev.filter((p) => p.id !== projetoSelecionado.id));
      toast.success('Projeto excluído com sucesso.');
      setConfirmDeleteOpen(false);
      setProjetoSelecionado(null);
    } catch (error) {
      toast.error('Erro ao excluir projeto.');
    }
  };

  const projetosFiltrados = projetos.filter((p) => {
    const termo = busca.toLowerCase();
    return (
      p.nomeEmpresa.toLowerCase().includes(termo) ||
      p.id.toString().includes(termo) ||
      p.tipoProjeto.toLowerCase().includes(termo) ||
      (p.descricao || '').toLowerCase().includes(termo)
    );
  });

  return (
    <Box sx={{ p: 3, height: '90vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', marginTop: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Projetos
        </Typography>

        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')}>
            Chamados
          </Button>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ fontWeight: 'bold' }}>
            Sair
          </Button>
          <ToggleThemeButton />
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar projeto..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
        />
      </Paper>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 6, overflowX: 'auto', flexGrow: 1 }}>
          {Object.entries(PROJECT_COLUMNS).map(([cid, col]) => {
            const list = projetosFiltrados.filter((p) => p.status === cid);
            return (
              <Droppable key={cid} droppableId={cid}>
                {(prov, snap) => (
                  <Paper
                    ref={prov.innerRef}
                    {...prov.droppableProps}
                    elevation={0}
                    sx={{
                      width: 320,
                      minWidth: 320,
                      bgcolor: snap.isDraggingOver ? '#e0e0e0' : isDark ? '#2e2e2e' : '#ebecf0',
                      p: 2,
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '100%',
                    }}
                  >
                    <Box sx={{ mb: 2, pb: 1, borderBottom: `3px solid ${col.border}`, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">{col.title}</Typography>
                      <Chip label={list.length} size="small" />
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                      {list.map((item, idx) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={idx}>
                          {(p) => (
                            <Card
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              onClick={() => setProjetoSelecionado(item)}
                              sx={{ mb: 2, cursor: 'pointer', borderLeft: `5px solid ${col.border}` }}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="caption">#{item.id}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {item.nomeEmpresa}
                                </Typography>
                                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                  <Chip label={item.tipoProjeto} size="small" sx={{ bgcolor: col.bg, fontWeight: 'bold' }} />
                                  {item.responsavel && (
                                    <Chip
                                      size="small"
                                      label={item.responsavel}
                                      sx={{ bgcolor: item.responsavelCor || '#1976d2', color: '#fff' }}
                                    />
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                    </Box>
                  </Paper>
                )}
              </Droppable>
            );
          })}
        </Box>
      </DragDropContext>

      <Dialog open={Boolean(projetoSelecionado)} onClose={() => setProjetoSelecionado(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Projeto #{projetoSelecionado?.id}</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
              <BusinessIcon color="primary" fontSize="small" /> {projetoSelecionado?.nomeEmpresa}
            </Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Tipo de Projeto</Typography>
            <Typography variant="body1">{projetoSelecionado?.tipoProjeto}</Typography>
          </Box>
          {projetoSelecionado?.descricao && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">Descrição</Typography>
              <Typography variant="body2">{projetoSelecionado?.descricao}</Typography>
            </Box>
          )}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contatos</Typography>
          <List dense disablePadding>
            {(projetoSelecionado?.emails || []).map((email, idx) => (
              <ListItem key={`email-${idx}`} disableGutters>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={email} />
              </ListItem>
            ))}
            {(projetoSelecionado?.telefones || []).map((tel, idx) => (
              <ListItem key={`tel-${idx}`} disableGutters>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <PhoneIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={tel} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setConfirmDeleteOpen(true)}>Excluir</Button>
          <Button onClick={() => setProjetoSelecionado(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Excluir Projeto?</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir o projeto #{projetoSelecionado?.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteProjeto} variant="contained" color="error">Sim, Excluir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
