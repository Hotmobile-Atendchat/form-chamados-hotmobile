import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  IconButton,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Download as DownloadIcon,
  TrendingUp,
  CheckCircle,
  Assignment,
  FilterAlt as FilterIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Description as CsvIcon,
  FolderOpen as FolderOpenIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const SLA_COLORS = ['#4caf50', '#f44336'];
const PROJECT_STATUS_COLORS = ['#1e88e5', '#fb8c00', '#43a047', '#8e24aa', '#546e7a'];

const getKpiValue = (value) => (typeof value === 'number' ? value : 0);

export default function DashboardView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [projectMetrics, setProjectMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  );

  const printRef = useRef(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [chamadosResult, projetosResult] = await Promise.allSettled([
        api.get(`/chamados/dashboard/metrics?start=${startDate}&end=${endDate}`),
        api.get(`/projetos/dashboard/metrics?start=${startDate}&end=${endDate}`),
      ]);

      if (chamadosResult.status === 'fulfilled') {
        setMetrics(chamadosResult.value.data);
      }

      if (projetosResult.status === 'fulfilled') {
        setProjectMetrics(projetosResult.value.data);
      } else {
        setProjectMetrics(null);
      }
    } catch (error) {
      console.error('Erro ao buscar metricas', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const chamadosRaw = metrics?.rawDetails || [];
    const projetosRaw = projectMetrics?.rawDetails || [];
    if (!chamadosRaw.length && !projetosRaw.length) return;

    const headers = ['Tipo', 'ID', 'Status', 'Categoria', 'Responsavel', 'Criado Em', 'Atualizado Em'];
    const chamadosRows = chamadosRaw.map((item) => [
      'Chamado',
      item.id,
      item.status,
      item.prioridade || 'N/A',
      item.responsavel || 'N/A',
      new Date(item.createdAt).toLocaleString(),
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A',
    ]);
    const projetosRows = projetosRaw.map((item) => [
      'Projeto',
      item.id,
      item.status,
      item.tipoProjeto || 'N/A',
      item.responsavel || 'N/A',
      new Date(item.createdAt).toLocaleString(),
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      headers.join(',') +
      '\n' +
      [...chamadosRows, ...projetosRows].map((row) => row.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_operacional_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dashboard_${startDate}.pdf`);
  };

  const chartAxisColor = isDark ? '#dddddd' : '#666666';
  const chartGridColor = isDark ? '#444444' : '#e0e0e0';
  const tooltipStyle = {
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isDark ? '#333' : '#fff',
    color: isDark ? '#fff' : '#000',
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        width: '100%',
        maxWidth: '1450px',
        mx: 'auto',
        mt: 4,
        background: isDark
          ? 'linear-gradient(140deg, #1d1f2f 0%, #1b2335 45%, #242433 100%)'
          : 'linear-gradient(140deg, #f3f7ff 0%, #eef7ff 45%, #fff5ee 100%)',
        borderRadius: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          background: alpha(theme.palette.background.paper, 0.88),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate('/admin')} sx={{ mr: 1.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Dashboard Operacional
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visao consolidada de chamados e projetos.
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip icon={<Assignment />} label={`Chamados: ${getKpiValue(metrics?.kpis?.total)}`} color="primary" variant="outlined" />
            <Chip icon={<FolderOpenIcon />} label={`Projetos: ${getKpiValue(projectMetrics?.kpis?.total)}`} color="secondary" variant="outlined" />
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center',
          borderRadius: 3,
        }}
      >
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Data Inicio"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="Data Fim"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="contained" startIcon={<FilterIcon />} onClick={fetchMetrics}>
            Atualizar
          </Button>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box display="flex" gap={1}>
          <Button variant="outlined" color="success" startIcon={<CsvIcon />} onClick={handleExportCSV}>
            CSV
          </Button>
          <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
            PDF
          </Button>
        </Box>
      </Paper>

      <Box ref={printRef} sx={{ p: 2.5, bgcolor: alpha(theme.palette.background.default, 0.85), borderRadius: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={10}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2.5} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #1976d2', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary" variant="subtitle2">
                        CHAMADOS
                      </Typography>
                      <Assignment color="primary" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                      {getKpiValue(metrics?.kpis?.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #2e7d32', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary" variant="subtitle2">
                        CHAMADOS RESOLVIDOS
                      </Typography>
                      <CheckCircle color="success" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                      {getKpiValue(metrics?.kpis?.finalizados)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #8e24aa', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary" variant="subtitle2">
                        PROJETOS
                      </Typography>
                      <FolderOpenIcon sx={{ color: '#8e24aa' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                      {getKpiValue(projectMetrics?.kpis?.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderLeft: '5px solid #f44336', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary" variant="subtitle2">
                        SLA VIOLADO
                      </Typography>
                      <WarningIcon color="error" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                      {getKpiValue(metrics?.kpis?.slaViolado)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metrics?.kpis?.percentualSlaOk || 100}% OK
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2.5} mb={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2.5, height: 360 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1.2}>
                    Volume Diario de Chamados
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={metrics?.timelineData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="chamados" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, height: 360 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1.2}>
                    SLA de Chamados
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={metrics?.slaData || []} innerRadius={52} outerRadius={74} paddingAngle={4} dataKey="value">
                        {(metrics?.slaData || []).map((entry, index) => (
                          <Cell key={`sla-${index}`} fill={SLA_COLORS[index % SLA_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.5, height: 350 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1.2}>
                    Status dos Projetos
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={projectMetrics?.statusData || []} innerRadius={44} outerRadius={74} dataKey="value">
                        {(projectMetrics?.statusData || []).map((entry, index) => (
                          <Cell key={`status-${index}`} fill={PROJECT_STATUS_COLORS[index % PROJECT_STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.5, height: 350 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1.2}>
                    Tipos de Projeto
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={projectMetrics?.tipoData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" stroke={chartAxisColor} />
                      <YAxis allowDecimals={false} stroke={chartAxisColor} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="value" fill="#8e24aa" radius={[4, 4, 0, 0]} name="Projetos" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
}
