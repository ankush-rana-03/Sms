import React from 'react';
import {
  Button,
  ButtonProps,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { UIStandards, ComponentStandards } from '../theme/uiStandards';

interface StandardButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

const StandardButton: React.FC<StandardButtonProps> = ({
  children,
  size = 'medium',
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'start',
  disabled,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: `${UIStandards.spacing.sm}px ${UIStandards.spacing.md}px`,
          fontSize: '0.75rem',
          minHeight: '32px',
        };
      case 'large':
        return {
          padding: `${UIStandards.spacing.md}px ${UIStandards.spacing.xl}px`,
          fontSize: '1rem',
          minHeight: '48px',
        };
      default: // medium
        return {
          padding: `${UIStandards.spacing.sm}px ${UIStandards.spacing.lg}px`,
          fontSize: '0.875rem',
          minHeight: '40px',
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: UIStandards.borderRadius.md,
      fontWeight: UIStandards.typography.button.fontWeight,
      textTransform: UIStandards.typography.button.textTransform,
      transition: ComponentStandards.button.hover.transition,
      '&:hover': {
        transform: ComponentStandards.button.hover.transform,
        boxShadow: ComponentStandards.button.hover.boxShadow,
      },
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          borderWidth: '2px',
          '&:hover': {
            ...baseStyles['&:hover'],
            borderWidth: '2px',
          },
        };
      case 'text':
        return {
          ...baseStyles,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: 'action.hover',
          },
        };
      default: // contained
        return {
          ...baseStyles,
          '&:hover': {
            ...baseStyles['&:hover'],
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          },
        };
    }
  };

  const getColorStyles = () => {
    if (variant === 'text' || variant === 'outlined') {
      return {
        color: `${color}.main`,
        borderColor: `${color}.main`,
        '&:hover': {
          backgroundColor: `${color}.main`,
          color: `${color}.contrastText`,
        },
      };
    }
    return {};
  };

  const buttonStyles = {
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...getColorStyles(),
    width: fullWidth ? '100%' : 'auto',
    ...sx,
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconElement = React.cloneElement(icon as React.ReactElement, {
      fontSize: size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium',
    });

    return iconElement;
  };

  const renderContent = () => {
    if (icon && iconPosition === 'start') {
      return (
        <>
          {renderIcon()}
          <span style={{ marginLeft: UIStandards.spacing.sm }}>{children}</span>
        </>
      );
    }
    
    if (icon && iconPosition === 'end') {
      return (
        <>
          <span style={{ marginRight: UIStandards.spacing.sm }}>{children}</span>
          {renderIcon()}
        </>
      );
    }
    
    return children;
  };

  return (
    <Button
      variant={variant}
      color={color}
      disabled={disabled || loading}
      sx={buttonStyles}
      {...props}
    >
      {renderContent()}
    </Button>
  );
};

export default StandardButton;