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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function HelpPortalModal() {
  const theme = useTheme();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  const portals = [
    {
      name: 'Ajuda Hotmobile',
      url: 'https://ajuda.hotmobile.com.br/',
      desc: 'Duvidas sobre o sistema de gestao',
    },
    {
      name: 'Ajuda Atendchat',
      url: 'https://ajudachat.hotmobile.com.br/',
      desc: 'Configuracoes de chat e WhatsApp',
    },
    {
      name: 'Ajuda Hotmenu',
      url: 'https://ajuda.hotmenu.com.br/',
      desc: 'Cardapio digital e pedidos',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="help-dialog-title"
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
        id="help-dialog-title"
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
        <HelpOutlineIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 800 }}>
          Centrais de Ajuda
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
          Antes de abrir um chamado, confira se sua duvida ja esta respondida na base de conhecimento.
        </Typography>

        <Stack spacing={1.4}>
          {portals.map((portal) => (
            <Paper
              key={portal.name}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                overflow: 'hidden',
              }}
            >
              <Button
                fullWidth
                href={portal.url}
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
                    {portal.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {portal.desc}
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
          Ja verifiquei, quero abrir um chamado
        </Button>
      </DialogActions>
    </Dialog>
  );
}
