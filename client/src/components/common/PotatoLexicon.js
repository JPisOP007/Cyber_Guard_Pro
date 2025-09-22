import React from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import {
  DeleteForever as CompostIcon,
  ReportProblem as BruiseIcon,
  LocalFireDepartment as BakedIcon,
  Spa as FreshIcon,
} from '@mui/icons-material';

// Mapping of security concepts to potato-themed vocabulary
export const potatoSeverity = {
  critical: { label: 'Rotten Potato', Icon: CompostIcon, color: 'error' },
  high: { label: 'Bruised Potato', Icon: BruiseIcon, color: 'warning' },
  medium: { label: 'Baked Potato', Icon: BakedIcon, color: 'info' },
  low: { label: 'Peel Scratch', Icon: BruiseIcon, color: 'success' },
  safe: { label: 'Fresh Potato', Icon: FreshIcon, color: 'success' },
};

export const PotatoChip = ({ level = 'safe', size = 'small', sx }) => {
  const entry = potatoSeverity[level] || potatoSeverity.safe;
  const { label, Icon, color } = entry;
  return (
    <Chip icon={<Icon />} label={label} size={size} color={color} variant="outlined" sx={sx} />
  );
};

export const PotatoLegend = ({ compact = false, sx }) => {
  return (
    <Stack direction={compact ? 'row' : 'column'} spacing={compact ? 1 : 0.5} sx={sx}>
      {!compact && (
        <Typography variant="caption" color="text.secondary">
          Potato Legend
        </Typography>
      )}
      <PotatoChip level="critical" size={compact ? 'small' : 'small'} />
      <PotatoChip level="high" size={compact ? 'small' : 'small'} />
      <PotatoChip level="medium" size={compact ? 'small' : 'small'} />
      <PotatoChip level="low" size={compact ? 'small' : 'small'} />
      <PotatoChip level="safe" size={compact ? 'small' : 'small'} />
    </Stack>
  );
};

export default PotatoChip;
