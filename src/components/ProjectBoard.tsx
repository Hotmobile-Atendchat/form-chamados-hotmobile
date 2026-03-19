import React, { useEffect, useMemo, useState } from 'react';
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
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon,
  FolderOpen as FolderOpenIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ToggleThemeButton from './ToggleThemeButton';

const PROJECT_COLUMNS = {
  NOVO: { id: 'NOVO', title: 'Backlog', border: '#1e88e5' },
  PLANEJAMENTO: { id: 'PLANEJAMENTO', title: 'Planejamento', border: '#fb8c00' },
  EM_EXECUCAO: { id: 'EM_EXECUCAO', title: 'Execucao', border: '#43a047' },
  VALIDACAO: { id: 'VALIDACAO', title: 'Validacao', border: '#8e24aa' },
  FINALIZADO: { id: 'FINALIZADO', title: 'Finalizado', border: '#546e7a' },
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
    toast.info('Voce saiu do sistema.');
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
      toast.success('Status atualizado.');
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
      toast.success('Projeto excluido com sucesso.');
      setConfirmDeleteOpen(false);
      setProjetoSelecionado(null);
    } catch (error) {
      toast.error('Erro ao excluir projeto.');
    }
  };

  const projetosFiltrados = useMemo(
    () =>
      projetos.filter((projeto) => {
        const termo = busca.toLowerCase();
        return (
          (projeto.nomeEmpresa || '').toLowerCase().includes(termo) ||
          (projeto.nomeProjeto || '').toLowerCase().includes(termo) ||
          projeto.id.toString().includes(termo) ||
          (projeto.tipoProjeto || '').toLowerCase().includes(termo) ||
          (projeto.descricao || '').toLowerCase().includes(termo)
        );
      }),
    [busca, projetos],
  );

  const totalProjetos = projetos.length;
  const totalFinalizados = projetos.filter((p) => p.status === 'FINALIZADO').length;

  return (
    <Box
      sx={{
        p: 3,
        minHeight: '90vh',
        mt: 5,
        background: isDark
          ? 'linear-gradient(140deg, #1d1f2f 0%, #1b2335 45%, #242433 100%)'
          : 'linear-gradient(140deg, #f3f7ff 0%, #eef7ff 45%, #fff5ee 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          p: 3,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          background: alpha(theme.palette.background.paper, 0.88),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Gestao de Projetos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pipeline de execucao com acompanhamento por etapa.
            </Typography>
          </Box>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Chip icon={<FolderOpenIcon />} label={`Total: ${totalProjetos}`} color="primary" variant="outlined" />
            <Chip icon={<AssignmentTurnedInIcon />} label={`Finalizados: ${totalFinalizados}`} color="success" variant="outlined" />
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')}>
              Chamados
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
              Sair
            </Button>
            <ToggleThemeButton />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome do projeto, empresa, tipo ou codigo..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
        />
      </Paper>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {Object.entries(PROJECT_COLUMNS).map(([columnId, column]) => {
            const list = projetosFiltrados.filter((projeto) => projeto.status === columnId);
            return (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    elevation={0}
                    sx={{
                      width: 330,
                      minWidth: 330,
                      p: 1.5,
                      borderRadius: 3,
                      border: `1px solid ${alpha(column.border, 0.3)}`,
                      bgcolor: snapshot.isDraggingOver ? alpha(column.border, 0.08) : alpha(theme.palette.background.paper, 0.9),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {column.title}
                      </Typography>
                      <Chip label={list.length} size="small" />
                    </Box>

                    <Box sx={{ minHeight: 70 }}>
                      {list.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(dragProvided) => (
                            <Card
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setProjetoSelecionado(item)}
                              sx={{
                                mb: 1.4,
                                cursor: 'pointer',
                                borderRadius: 2.5,
                                borderLeft: `4px solid ${column.border}`,
                                boxShadow: '0 8px 20px rgba(22, 29, 52, 0.08)',
                              }}
                            >
                              <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
                                <Box display="flex" justifyContent="space-between" mb={0.8}>
                                  <Typography variant="caption">#{item.id}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                                  {item.nomeProjeto || `Projeto ${item.id}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                                  {item.nomeEmpresa}
                                </Typography>
                                <Box display="flex" gap={0.8} mt={1.2} flexWrap="wrap">
                                  <Chip label={item.tipoProjeto} size="small" sx={{ bgcolor: alpha(column.border, 0.14), fontWeight: 700 }} />
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
                      {provided.placeholder}
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
            <Typography variant="subtitle2" color="text.secondary">
              Nome do Projeto
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {projetoSelecionado?.nomeProjeto}
            </Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Empresa
            </Typography>
            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
              <BusinessIcon color="primary" fontSize="small" /> {projetoSelecionado?.nomeEmpresa}
            </Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Tipo de Projeto
            </Typography>
            <Typography variant="body1">{projetoSelecionado?.tipoProjeto}</Typography>
          </Box>
          {projetoSelecionado?.descricao && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Descricao
              </Typography>
              <Typography variant="body2">{projetoSelecionado?.descricao}</Typography>
            </Box>
          )}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Contatos
          </Typography>
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
          <Button color="error" onClick={() => setConfirmDeleteOpen(true)}>
            Excluir
          </Button>
          <Button onClick={() => setProjetoSelecionado(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Excluir Projeto?</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o projeto #{projetoSelecionado?.id}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteProjeto} variant="contained" color="error">
            Sim, Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
