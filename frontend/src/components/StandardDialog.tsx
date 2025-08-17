import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { UIStandards, ComponentStandards } from '../theme/uiStandards';

interface StandardDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  dividers?: boolean;
  className?: string;
}

const StandardDialog: React.FC<StandardDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  size = 'medium',
  showCloseButton = true,
  dividers = false,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: UIStandards.spacing.md,
          minWidth: '400px',
        };
      case 'large':
        return {
          padding: UIStandards.spacing.xl,
          minWidth: '800px',
        };
      default: // medium
        return {
          padding: UIStandards.spacing.lg,
          minWidth: '600px',
        };
    }
  };

  const dialogStyles = {
    '& .MuiDialog-paper': {
      borderRadius: ComponentStandards.dialog.borderRadius,
      maxWidth: isMobile ? '95vw' : getSizeStyles().minWidth,
      width: isMobile ? '95vw' : '100%',
      margin: isMobile ? '16px' : '32px',
      maxHeight: isMobile ? '90vh' : '80vh',
    },
  };

  const titleStyles = {
    padding: `${UIStandards.spacing.lg}px ${getSizeStyles().padding}px ${UIStandards.spacing.md}px`,
    borderBottom: dividers ? `1px solid ${theme.palette.divider}` : 'none',
    position: 'relative',
  };

  const contentStyles = {
    padding: `${UIStandards.spacing.md}px ${getSizeStyles().padding}px`,
    overflowY: 'auto',
  };

  const actionsStyles = {
    padding: `${UIStandards.spacing.md}px ${getSizeStyles().padding}px`,
    borderTop: dividers ? `1px solid ${theme.palette.divider}` : 'none',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: UIStandards.spacing.sm,
    flexWrap: 'wrap',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={dialogStyles}
      className={className}
      TransitionProps={{
        enter: {
          duration: 300,
          easing: 'ease-out',
        },
        exit: {
          duration: 200,
          easing: 'ease-in',
        },
      }}
    >
      {(title || subtitle) && (
        <DialogTitle sx={titleStyles}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              {title && (
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{
                    fontWeight: UIStandards.typography.h5.fontWeight,
                    color: 'text.primary',
                    mb: subtitle ? 1 : 0,
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <DialogContentText
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </DialogContentText>
              )}
            </Box>
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: UIStandards.spacing.md,
                  top: UIStandards.spacing.md,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      <DialogContent sx={contentStyles}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions sx={actionsStyles}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default StandardDialog;