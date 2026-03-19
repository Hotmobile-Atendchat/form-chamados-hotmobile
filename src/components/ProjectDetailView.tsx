import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  EventNote as EventNoteIcon,
  FolderOpen as FolderOpenIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const STATUS_LABELS = {
  NOVO: 'Backlog',
  PLANEJAMENTO: 'Planejamento',
  EM_EXECUCAO: 'Execucao',
  VALIDACAO: 'Validacao',
  FINALIZADO: 'Finalizado',
};

const TASK_STATUS = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluida',
};

const SPRINT_STATUS = {
  PLANEJADA: 'Planejada',
  ATIVA: 'Ativa',
  CONCLUIDA: 'Concluida',
};

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function ProjectDetailView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { id } = useParams();
  const [projeto, setProjeto] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      try {
        const { data } = await api.get(`/projetos/${id}`);
        setProjeto(data);
      } catch {
        toast.error('Erro ao carregar detalhes do projeto.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const tarefas = projeto?.tarefas || [];
  const sprints = projeto?.sprints || [];
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((t: any) => t.status === 'CONCLUIDA').length;
  const progresso = totalTarefas ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
  const sprintsConcluidas = sprints.filter((s: any) => s.status === 'CONCLUIDA').length;

  const tarefasPorSprint: Record<string, any[]> = {};
  tarefas.forEach((t: any) => {
    const key = t.sprintId ? String(t.sprintId) : 'sem-sprint';
    if (!tarefasPorSprint[key]) tarefasPorSprint[key] = [];
    tarefasPorSprint[key].push(t);
  });

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
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          background: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Projeto #{projeto?.id || id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visao macro e detalhada do ciclo do projeto.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
            onClick={() => navigate('/admin/projetos')}
          >
            Voltar ao Kanban
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Carregando dados do projeto...
          </Typography>
          <LinearProgress />
        </Paper>
      ) : !projeto ? null : (
        <>
          <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
            <Typography variant="h5" fontWeight={800} mb={0.5}>
              {projeto.nomeProjeto}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={1.4}>
              {projeto.nomeEmpresa}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1.4}>
              <Chip label={STATUS_LABELS[projeto.status as keyof typeof STATUS_LABELS] || projeto.status} color="primary" />
              <Chip label={projeto.tipoProjeto} variant="outlined" />
              {projeto.responsavel && (
                <Chip
                  icon={<PersonIcon />}
                  label={projeto.responsavel}
                  sx={{ bgcolor: projeto.responsavelCor || '#1976d2', color: '#fff' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {projeto.descricao || 'Sem descricao.'}
            </Typography>
          </Paper>

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} gap={1.5} mb={2.5}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">Total de Sprints</Typography>
              <Typography variant="h5" fontWeight={800}>{sprints.length}</Typography>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">Sprints Finalizadas</Typography>
              <Typography variant="h5" fontWeight={800}>{sprintsConcluidas}</Typography>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">Total de Tarefas</Typography>
              <Typography variant="h5" fontWeight={800}>{totalTarefas}</Typography>
            </Paper>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">Tarefas Concluidas</Typography>
              <Typography variant="h5" fontWeight={800}>{tarefasConcluidas}</Typography>
            </Paper>
          </Box>

          <Paper sx={{ p: 2, borderRadius: 3, mb: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Progresso Geral
              </Typography>
              <Typography variant="subtitle2" fontWeight={800}>
                {progresso}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progresso} sx={{ height: 10, borderRadius: 99 }} />
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1.2}>
              Sprints e Tarefas
            </Typography>
            {sprints.map((sprint: any) => (
              <Box key={sprint.id} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" mb={0.8}>
                  <Typography variant="subtitle2" fontWeight={700} display="flex" alignItems="center" gap={0.6}>
                    <EventNoteIcon fontSize="small" /> {sprint.nome}
                  </Typography>
                  <Box display="flex" gap={0.8} flexWrap="wrap">
                    <Chip size="small" label={SPRINT_STATUS[sprint.status as keyof typeof SPRINT_STATUS] || sprint.status} />
                    <Chip size="small" label={`${formatDate(sprint.dataInicio)} - ${formatDate(sprint.dataFim)}`} />
                  </Box>
                </Box>
                <List dense disablePadding>
                  {(tarefasPorSprint[String(sprint.id)] || []).map((task: any) => (
                    <ListItem key={task.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 0.8 }}>
                      <ListItemText
                        primary={task.titulo}
                        secondary={`Status: ${TASK_STATUS[task.status as keyof typeof TASK_STATUS] || task.status} | Autor: ${task.autor}${task.responsavel ? ` | Resp: ${task.responsavel}` : ''}`}
                      />
                    </ListItem>
                  ))}
                  {(tarefasPorSprint[String(sprint.id)] || []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma tarefa nesta sprint.
                    </Typography>
                  )}
                </List>
                <Divider sx={{ mt: 1.2 }} />
              </Box>
            ))}

            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={0.8}>
                Tarefas sem sprint
              </Typography>
              <List dense disablePadding>
                {(tarefasPorSprint['sem-sprint'] || []).map((task: any) => (
                  <ListItem key={task.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 0.8 }}>
                    <ListItemText
                      primary={task.titulo}
                      secondary={`Status: ${TASK_STATUS[task.status as keyof typeof TASK_STATUS] || task.status} | Autor: ${task.autor}${task.responsavel ? ` | Resp: ${task.responsavel}` : ''}`}
                    />
                  </ListItem>
                ))}
                {(tarefasPorSprint['sem-sprint'] || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma tarefa fora de sprint.
                  </Typography>
                )}
              </List>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Informacoes Gerais
            </Typography>
            <Box display="flex" gap={0.8} flexWrap="wrap" mb={1.2}>
              <Chip icon={<FolderOpenIcon />} label={`Criado em: ${formatDate(projeto.createdAt)}`} />
              <Chip icon={<AssignmentTurnedInIcon />} label={`Atualizado em: ${formatDate(projeto.updatedAt)}`} />
            </Box>
            <Typography variant="subtitle2" mb={0.5}>Contatos</Typography>
            <Typography variant="body2" color="text.secondary">
              E-mails: {(projeto.emails || []).join(', ') || '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Telefones: {(projeto.telefones || []).join(', ') || '-'}
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
}
