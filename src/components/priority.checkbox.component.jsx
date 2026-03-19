import * as React from 'react';
import {
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  InputAdornment,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import { alpha, useTheme } from '@mui/material/styles';
import HelpPortalModal from './HelpPortalModal';

const names = ['Atendchat', 'Hotmobile', 'Hotmenu'];

export default function SingleSelectService({ value, onChange, sx }) {
  const theme = useTheme();

  return (
    <>
      <HelpPortalModal />
      <FormControl variant="outlined" fullWidth sx={{ mb: 1, ...sx }}>
        <InputLabel id="single-service-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Servico
        </InputLabel>
        <Select
          labelId="single-service-label"
          id="single-service"
          value={value}
          onChange={onChange}
          input={
            <OutlinedInput
              label="Servico"
              startAdornment={
                <InputAdornment position="start">
                  <AppsIcon fontSize="small" />
                </InputAdornment>
              }
            />
          }
          sx={{
            borderRadius: 3,
            backgroundColor: alpha('#ffffff', 0.98),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.26),
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.5),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: '1.5px',
            },
          }}
        >
          {names.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
