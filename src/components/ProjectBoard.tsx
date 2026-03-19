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
  Divider,
  MenuItem,
  IconButton,
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
  Checklist as ChecklistIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  Replay as ReplayIcon,
  Person as PersonIcon,
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

const TASK_STATUS = {
  PENDENTE: { label: 'Pendente', color: 'default' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'warning' },
  CONCLUIDA: { label: 'Concluida', color: 'success' },
};

export default function ProjectBoard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [projetos, setProjetos] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [busca, setBusca] = useState('');
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editandoTarefaId, setEditandoTarefaId] = useState(null);
  const [tarefaForm, setTarefaForm] = useState({
    titulo: '',
    descricao: '',
    sprint: '',
    responsavel: '',
  });

  const carregarProjetos = async () => {
    try {
      const { data } = await api.get('/projetos');
      setProjetos(data);
      return data;
    } catch (error) {
      toast.error('Erro ao carregar projetos.');
      return [];
    }
  };

  const carregarUsuarios = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setEquipe(data || []);
    } catch (error) {
      setEquipe([]);
    }
  };

  useEffect(() => {
    carregarProjetos();
    carregarUsuarios();
  }, []);

  const refreshProjetoSelecionado = (projectId, listaProjetos) => {
    const source = listaProjetos || projetos;
    const atualizado = source.find((projeto) => projeto.id === projectId);
    if (atualizado) setProjetoSelecionado(atualizado);
  };

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

    try {
      await api.patch(`/projetos/${id}/status`, dadosAtualizacao);
      toast.success('Status atualizado.');
      const projetosAtualizados = await carregarProjetos();
      refreshProjetoSelecionado(id, projetosAtualizados);
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

  const limparFormTarefa = () => {
    setTarefaForm({ titulo: '', descricao: '', sprint: '', responsavel: '' });
    setEditandoTarefaId(null);
  };

  const handleCriarOuAtualizarTarefa = async () => {
    if (!projetoSelecionado || !tarefaForm.titulo.trim()) {
      toast.warning('Informe o titulo da tarefa.');
      return;
    }

    const usuarioSelecionado = equipe.find((u) => u.nome === tarefaForm.responsavel);
    const payload = {
      titulo: tarefaForm.titulo,
      descricao: tarefaForm.descricao || undefined,
      sprint: tarefaForm.sprint || undefined,
      responsavel: tarefaForm.responsavel || undefined,
      responsavelCor: usuarioSelecionado?.cor || undefined,
    };

    try {
      if (editandoTarefaId) {
        await api.patch(`/projetos/${projetoSelecionado.id}/tarefas/${editandoTarefaId}`, payload);
        toast.success('Tarefa atualizada.');
      } else {
        await api.post(`/projetos/${projetoSelecionado.id}/tarefas`, payload);
        toast.success('Tarefa criada.');
      }
      await carregarProjetos();
      const { data } = await api.get(`/projetos/${projetoSelecionado.id}`);
      setProjetoSelecionado(data);
      limparFormTarefa();
    } catch (error) {
      toast.error('Erro ao salvar tarefa.');
    }
  };

  const handleEditarTarefa = (task) => {
    setEditandoTarefaId(task.id);
    setTarefaForm({
      titulo: task.titulo || '',
      descricao: task.descricao || '',
      sprint: task.sprint || '',
      responsavel: task.responsavel || '',
    });
  };

  const handleToggleStatusTarefa = async (task) => {
    if (!projetoSelecionado) return;
    const nextStatus = task.status === 'CONCLUIDA' ? 'EM_ANDAMENTO' : 'CONCLUIDA';
    try {
      await api.patch(`/projetos/${projetoSelecionado.id}/tarefas/${task.id}`, { status: nextStatus });
      const { data } = await api.get(`/projetos/${projetoSelecionado.id}`);
      setProjetoSelecionado(data);
      setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } catch (error) {
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const handleExcluirTarefa = async (taskId) => {
    if (!projetoSelecionado) return;
    try {
      await api.delete(`/projetos/${projetoSelecionado.id}/tarefas/${taskId}`);
      const { data } = await api.get(`/projetos/${projetoSelecionado.id}`);
      setProjetoSelecionado(data);
      setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      toast.success('Tarefa excluida.');
    } catch (error) {
      toast.error('Erro ao excluir tarefa.');
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
              Pipeline de execucao com sprint e tarefas por projeto.
            </Typography>
          </Box>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Chip icon={<FolderOpenIcon />} label={`Total: ${totalProjetos}`} color="primary" variant="outlined" sx={{ borderRadius: 2.5, height: 38, fontWeight: 700 }} />
            <Chip icon={<AssignmentTurnedInIcon />} label={`Finalizados: ${totalFinalizados}`} color="success" variant="outlined" sx={{ borderRadius: 2.5, height: 38, fontWeight: 700 }} />
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ borderRadius: 2.5, height: 38, px: 2, textTransform: 'none', fontWeight: 700 }}>
              Chamados
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ borderRadius: 2.5, height: 38, px: 2, textTransform: 'none', fontWeight: 700 }}>
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
        <Box sx={{ display: 'flex', gap: 2.5, overflowX: 'auto', pb: 1, minHeight: 0 }}>
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
                      width: 360,
                      minWidth: 360,
                      maxHeight: 'calc(100vh - 280px)',
                      p: 1.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(column.border, 0.28)}`,
                      bgcolor: snapshot.isDraggingOver
                        ? (isDark ? 'rgba(56, 69, 90, 0.75)' : 'rgba(205, 227, 255, 0.7)')
                        : (isDark ? 'rgba(35, 42, 57, 0.88)' : 'rgba(255, 255, 255, 0.9)'),
                      boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.35)' : '0 16px 40px rgba(31, 74, 152, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        mb: 1.5,
                        px: 1,
                        py: 1.2,
                        borderRadius: 3,
                        borderBottom: `3px solid ${column.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(248, 251, 255, 0.95)',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {column.title}
                      </Typography>
                      <Chip label={list.length} size="small" />
                    </Box>

                    <Box sx={{ minHeight: 70, flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                      {list.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(dragProvided) => (
                            <Card
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => {
                                limparFormTarefa();
                                setProjetoSelecionado(item);
                              }}
                              sx={{
                                mb: 1.4,
                                cursor: 'pointer',
                                borderRadius: 3,
                                borderLeft: `4px solid ${column.border}`,
                                boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.28)' : '0 8px 20px rgba(22, 29, 52, 0.08)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: isDark ? '0 12px 24px rgba(0,0,0,0.4)' : '0 12px 24px rgba(22, 29, 52, 0.16)',
                                },
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
                                  <Chip icon={<ChecklistIcon />} label={`${item.tarefas?.length || 0} tasks`} size="small" sx={{ bgcolor: alpha('#1976d2', 0.1), fontWeight: 700 }} />
                                  {item.responsavel && (
                                    <Chip size="small" label={item.responsavel} sx={{ bgcolor: item.responsavelCor || '#1976d2', color: '#fff' }} />
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

      <Dialog
        open={Boolean(projetoSelecionado)}
        onClose={() => {
          setProjetoSelecionado(null);
          limparFormTarefa();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Projeto #{projetoSelecionado?.id}</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Nome do Projeto</Typography>
            <Typography variant="h6" fontWeight={800}>{projetoSelecionado?.nomeProjeto}</Typography>
          </Box>
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
              <Typography variant="subtitle2" color="text.secondary">Descricao</Typography>
              <Typography variant="body2">{projetoSelecionado?.descricao}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Sprint e Tarefas</Typography>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, mb: 2 }}>
            <Box display="flex" gap={1.2} flexWrap="wrap">
              <TextField
                label="Titulo da tarefa"
                size="small"
                value={tarefaForm.titulo}
                onChange={(e) => setTarefaForm((prev) => ({ ...prev, titulo: e.target.value }))}
                sx={{ minWidth: 240, flex: 1 }}
              />
              <TextField
                label="Sprint"
                size="small"
                value={tarefaForm.sprint}
                onChange={(e) => setTarefaForm((prev) => ({ ...prev, sprint: e.target.value }))}
                sx={{ width: 140 }}
              />
              <TextField
                select
                label="Responsavel"
                size="small"
                value={tarefaForm.responsavel}
                onChange={(e) => setTarefaForm((prev) => ({ ...prev, responsavel: e.target.value }))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Sem atribuicao</MenuItem>
                {equipe.map((membro) => (
                  <MenuItem key={membro.id} value={membro.nome}>
                    {membro.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Descricao"
              size="small"
              multiline
              rows={2}
              fullWidth
              sx={{ mt: 1.2 }}
              value={tarefaForm.descricao}
              onChange={(e) => setTarefaForm((prev) => ({ ...prev, descricao: e.target.value }))}
            />
            <Box display="flex" gap={1} mt={1.2}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCriarOuAtualizarTarefa}>
                {editandoTarefaId ? 'Salvar Edicao' : 'Criar Tarefa'}
              </Button>
              {editandoTarefaId && (
                <Button variant="outlined" onClick={limparFormTarefa}>
                  Cancelar
                </Button>
              )}
            </Box>
          </Paper>

          <List dense disablePadding>
            {(projetoSelecionado?.tarefas || []).map((task) => (
              <ListItem
                key={task.id}
                disableGutters
                sx={{
                  p: 1.2,
                  mb: 1,
                  borderRadius: 2.2,
                  border: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{task.titulo}</Typography>
                    {task.descricao && (
                      <Typography variant="body2" color="text.secondary">{task.descricao}</Typography>
                    )}
                    <Box display="flex" gap={0.8} mt={0.8} flexWrap="wrap">
                      <Chip size="small" label={TASK_STATUS[task.status]?.label || task.status} color={TASK_STATUS[task.status]?.color || 'default'} />
                      {task.sprint && <Chip size="small" label={`Sprint ${task.sprint}`} />}
                      <Chip size="small" icon={<PersonIcon />} label={`Autor: ${task.autor}`} />
                      {task.responsavel && (
                        <Chip
                          size="small"
                          label={`Resp: ${task.responsavel}`}
                          sx={{ bgcolor: task.responsavelCor || '#1976d2', color: '#fff' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    <IconButton size="small" color="primary" onClick={() => handleEditarTarefa(task)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={task.status === 'CONCLUIDA' ? 'warning' : 'success'}
                      onClick={() => handleToggleStatusTarefa(task)}
                    >
                      {task.status === 'CONCLUIDA' ? <ReplayIcon fontSize="small" /> : <DoneIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleExcluirTarefa(task.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
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
          <Button onClick={() => { setProjetoSelecionado(null); limparFormTarefa(); }}>Fechar</Button>
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
