import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ProjectLinksModal() {
  const theme = useTheme();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const links = [
    {
      name: 'Montagem de Bot',
      url: 'https://hotmobile.com.br/hot360/monte-seu-bot/',
      desc: 'Monte seu bot com orientacao da equipe Hotmobile.',
    },
    {
      name: 'Montagem de Agente de IA',
      url: 'https://hotmobile.com.br/hot360/monte-sua-ia/',
      desc: 'Crie um agente de IA para apoiar seu atendimento e operacao.',
    },
    {
      name: 'Documentacao da API para Integracao',
      url: 'https://dev.hotmobile.com.br/',
      desc: 'Guia tecnico da API para integracoes e desenvolvimento.',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="project-links-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          boxShadow: '0 28px 64px rgba(16, 33, 70, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        id="project-links-dialog-title"
        sx={{
          m: 0,
          p: 2.2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: 'linear-gradient(135deg, #f4f8ff 0%, #f5f9ff 65%, #fff8f2 100%)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
        }}
      >
        <BuildCircleOutlinedIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>
          Links de Projeto
        </Typography>

        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 10,
            top: 10,
            color: (muiTheme) => muiTheme.palette.grey[500],
            borderRadius: 2.5,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.2 }}>
        <Typography variant="body2" gutterBottom sx={{ mb: 2.2, color: 'text.secondary' }}>
          Se voce quiser contratar um servico de montagem (bot ou agente de IA), preencha este formulario antes para que nossa equipe conheca sua proposta.
        </Typography>

        <Stack spacing={1.4}>
          {links.map((link) => (
            <Paper
              key={link.name}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                overflow: 'hidden',
              }}
            >
              <Button
                fullWidth
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
                sx={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  px: 2,
                  py: 1.5,
                  textTransform: 'none',
                  color: 'text.primary',
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {link.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {link.desc}
                  </Typography>
                </Box>
              </Button>
            </Paper>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color="primary"
          sx={{
            width: '100%',
            borderRadius: 2.5,
            py: 1,
            fontWeight: 700,
            textTransform: 'none',
          }}
        >
          Entendi, vou preencher o formulario
        </Button>
      </DialogActions>
    </Dialog>
  );
}
