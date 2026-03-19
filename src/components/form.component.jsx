import * as React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  InputAdornment,
  Typography,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';

import MultipleSelectCheckmarks from './priority.checkbox.component';
import LoadingButtonsTransition from './button.send.component';
import InputFileUpload from './button.file.upload.component';
import AudioRecorder from './AudioRecorder';

const PROJECT_TYPES = [
  { value: 'Integra\u00e7\u00e3o', label: 'Integra\u00e7\u00e3o' },
  { value: 'Automa\u00e7\u00e3o', label: 'Automa\u00e7\u00e3o' },
  { value: 'Agente de IA', label: 'Agente de IA' },
  { value: 'Outro', label: 'Outro' },
];

export default function MultilineTextFields() {
  const theme = useTheme();
  const topRef = React.useRef();
  const [openWarning, setOpenWarning] = React.useState(false);

  const [formData, setFormData] = React.useState({
    tipoSolicitacao: 'CHAMADO',
    nome: '',
    email: [''],
    telefone: [''],
    servico: '',
    nomeProjeto: '',
    tipoProjeto: '',
    descricao: '',
    anexos: [],
  });

  const isProjeto = formData.tipoSolicitacao === 'PROJETO';

  const handleAudioRecorded = (audioFile) => {
    setFormData((prev) => ({ ...prev, anexos: [...(prev.anexos || []), audioFile] }));
  };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const length = phoneNumber.length;
    if (length < 4) return phoneNumber;
    if (length < 7) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    if (length === 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (field, index = null) => (event) => {
    let value = event.target.value;
    if (field === 'telefone') value = formatPhoneNumber(value);
    if (index !== null) {
      const updated = [...formData[field]];
      updated[index] = value;
      setFormData((prev) => ({ ...prev, [field]: updated }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTipoSolicitacaoChange = (event, newValue) => {
    if (!newValue) return;
    setFormData((prev) => ({
      ...prev,
      tipoSolicitacao: newValue,
      servico: newValue === 'CHAMADO' ? prev.servico : '',
      nomeProjeto: newValue === 'PROJETO' ? prev.nomeProjeto : '',
      tipoProjeto: newValue === 'PROJETO' ? prev.tipoProjeto : '',
    }));
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
    setTimeout(scrollToTop, 100);
  };

  const handleRemoveField = (field, index) => {
    setFormData((prev) => {
      const updated = [...prev[field]];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  const handleRemoveAnexo = (index) => {
    setFormData((prev) => {
      const updated = [...prev.anexos];
      updated.splice(index, 1);
      return { ...prev, anexos: updated };
    });
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type));
    if (validFiles.length < files.length) setOpenWarning(true);
    if (validFiles.length > 0) {
      setFormData((prev) => ({ ...prev, anexos: [...(prev.anexos || []), ...validFiles] }));
    }
    event.target.value = '';
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          px: { xs: 1.5, md: 2 },
          pb: 4,
          width: '100%',
          background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fbff 45%, #fff7f0 100%)',
        }}
      >
        <Paper
          component="form"
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            boxShadow: '0 16px 48px rgba(20, 35, 90, 0.12)',
            bgcolor: alpha('#ffffff', 0.94),
            backdropFilter: 'blur(8px)',
            width: '100%',
            maxWidth: '860px',
            overflowY: 'auto',
            maxHeight: '88vh',
          }}
          onSubmit={(e) => e.preventDefault()}
          noValidate
          autoComplete="off"
        >
          <div ref={topRef} />

          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                m: '0 auto',
                background: 'linear-gradient(135deg, #0049c6 0%, #1876ff 100%)',
                width: 62,
                height: 62,
                mb: 2,
              }}
            >
              <SupportAgentIcon fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: '#1d2a4d' }}>
              Central de Chamados e Projetos
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Hotmobile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560, mx: 'auto' }}>
              Abra um chamado técnico  ou inicie um projeto de integração, automação ou IA em um fluxo de atendimento.
            </Typography>
            <Divider sx={{ mt: 2.5 }} />
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: isProjeto ? alpha('#7b1fa2', 0.08) : alpha('#1976d2', 0.08),
              border: `1px solid ${isProjeto ? alpha('#7b1fa2', 0.22) : alpha('#1976d2', 0.2)}`,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#3e4a67' }}>
              Tipo de solicitação
            </Typography>
            <ToggleButtonGroup
              value={formData.tipoSolicitacao}
              exclusive
              onChange={handleTipoSolicitacaoChange}
              fullWidth
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  border: 0,
                },
              }}
            >
              <ToggleButton value="CHAMADO">
                <WorkOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
                Chamado
              </ToggleButton>
              <ToggleButton value="PROJETO">
                <BuildCircleOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
                Projeto
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="overline" sx={{ color: '#5a6b91', letterSpacing: '0.08em', fontWeight: 700 }}>
                Dados iniciais
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome da empresa"
                value={formData.nome}
                onChange={handleChange('nome')}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {isProjeto && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome do projeto"
                  value={formData.nomeProjeto}
                  onChange={handleChange('nomeProjeto')}
                  fullWidth
                  placeholder="Ex: Implantacao IA Comercial"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              {isProjeto ? (
                <FormControl fullWidth>
                  <InputLabel id="tipo-projeto-label">Tipo de projeto</InputLabel>
                  <Select
                    labelId="tipo-projeto-label"
                    value={formData.tipoProjeto}
                    label="Tipo de projeto"
                    onChange={handleChange('tipoProjeto')}
                  >
                    {PROJECT_TYPES.map((projectType) => (
                      <MenuItem key={projectType.value} value={projectType.value}>
                        {projectType.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <MultipleSelectCheckmarks value={formData.servico} onChange={handleChange('servico')} sx={{ width: '100%' }} />
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="overline" sx={{ color: '#5a6b91', letterSpacing: '0.08em', fontWeight: 700 }}>
                Contatos para atualizações
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              {formData.telefone.map((tel, index) => (
                <Grid
                  container
                  spacing={1}
                  key={index}
                  alignItems="center"
                  sx={{ mb: index === formData.telefone.length - 1 ? 0 : 1.4 }}
                >
                  <Grid item xs={index > 0 ? 10 : 12}>
                    <TextField
                      label={`Telefone ${index + 1}`}
                      value={tel}
                      onChange={handleChange('telefone', index)}
                      fullWidth
                      placeholder="(11) 99999-9999"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {index > 0 && (
                    <Grid item xs={2}>
                      <Button onClick={() => handleRemoveField('telefone', index)} color="error" fullWidth>
                        <DeleteIcon />
                      </Button>
                    </Grid>
                  )}
                </Grid>
              ))}
              <Button onClick={() => handleAddField('telefone')} size="small" sx={{ mt: 1, textTransform: 'none' }}>
                + Adicionar telefone
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              {formData.email.map((email, index) => (
                <Grid
                  container
                  spacing={1}
                  key={index}
                  alignItems="center"
                  sx={{ mb: index === formData.email.length - 1 ? 0 : 1.4 }}
                >
                  <Grid item xs={index > 0 ? 10 : 12}>
                    <TextField
                      label={`E-mail ${index + 1}`}
                      value={email}
                      onChange={handleChange('email', index)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {index > 0 && (
                    <Grid item xs={2}>
                      <Button onClick={() => handleRemoveField('email', index)} color="error" fullWidth>
                        <DeleteIcon />
                      </Button>
                    </Grid>
                  )}
                </Grid>
              ))}
              <Button onClick={() => handleAddField('email')} size="small" sx={{ mt: 1, textTransform: 'none' }}>
                + Adicionar e-mail
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="overline" sx={{ color: '#5a6b91', letterSpacing: '0.08em', fontWeight: 700 }}>
                Escopo da solicitações
              </Typography>
              <TextField
                label="Descrição"
                value={formData.descricao}
                onChange={handleChange('descricao')}
                multiline
                rows={4}
                fullWidth
                placeholder={isProjeto ? 'Descreva objetivo, escopo e prazo desejado.' : 'Descreva o problema e o impacto no seu atendimento.'}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <InputFileUpload onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                <Typography variant="caption" color="text.secondary">
                  ou
                </Typography>
                <AudioRecorder onAudioReady={handleAudioRecorded} />
              </Box>

              {formData.anexos && formData.anexos.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {formData.anexos.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => handleRemoveAnexo(index)}
                      icon={file.type.includes('audio') ? <MicIcon /> : <AttachFileIcon />}
                      color={file.type.includes('audio') ? 'secondary' : 'default'}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
              <LoadingButtonsTransition formData={formData} setFormData={setFormData} />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Dialog open={openWarning} onClose={() => setOpenWarning(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ed6c02' }}>
          <WarningAmberRoundedIcon />
          Tipo inv\u00e1lido
        </DialogTitle>
        <DialogContent>
          <DialogContentText>Apenas arquivos JPG, JPEG, PNG e PDF s\u00e3o permitidos.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWarning(false)} variant="contained" color="primary">
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
