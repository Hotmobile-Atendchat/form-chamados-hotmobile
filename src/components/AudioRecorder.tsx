import React from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { IconButton, Box, Typography } from '@mui/material';
import { Mic, Stop, Delete, CheckCircle } from '@mui/icons-material';

type AudioRecorderProps = {
  onAudioReady: (file: File) => void;
  compact?: boolean;
};

export default function AudioRecorder({ onAudioReady, compact = false }: AudioRecorderProps) {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({
    audio: true,
    blobPropertyBag: { type: 'audio/webm' },
  });

  const handleSave = async () => {
    if (!mediaBlobUrl) return;

    try {
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      const fileName = `audio-gravado-${Date.now()}.webm`;
      const file = new File([blob], fileName, { type: 'audio/webm' });
      onAudioReady(file);
      clearBlobUrl();
    } catch (error) {
      console.error('Erro ao processar audio', error);
    }
  };

  const actionIconSx = compact
    ? {
        width: 34,
        height: 34,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'rgba(25,118,210,0.25)',
        bgcolor: 'background.paper',
      }
    : {};

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      sx={{
        border: compact ? 'none' : '1px dashed #ccc',
        borderRadius: compact ? 0 : 2,
        p: compact ? 0 : 1,
        width: 'fit-content',
      }}
    >
      {status !== 'recording' && !mediaBlobUrl && (
        <IconButton color="primary" onClick={startRecording} title="Gravar audio" sx={actionIconSx}>
          <Mic />
        </IconButton>
      )}

      {status === 'recording' && (
        <>
          <Typography variant="caption" sx={{ color: 'red', fontWeight: 'bold' }}>
            Gravando...
          </Typography>
          <IconButton color="error" onClick={stopRecording} sx={actionIconSx}>
            <Stop />
          </IconButton>
        </>
      )}

      {status === 'stopped' && mediaBlobUrl && (
        <>
          <audio src={mediaBlobUrl} controls style={{ height: 30, width: 200 }} />
          <IconButton color="success" onClick={handleSave} title="Confirmar audio" sx={actionIconSx}>
            <CheckCircle />
          </IconButton>
          <IconButton color="default" onClick={clearBlobUrl} title="Descartar" sx={actionIconSx}>
            <Delete />
          </IconButton>
        </>
      )}
    </Box>
  );
}
