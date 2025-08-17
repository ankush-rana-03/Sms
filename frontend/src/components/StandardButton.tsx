import React from 'react';
import { Button, ButtonProps } from '@mui/material';

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
  const renderIcon = () => {
    if (!icon) return null;
    return icon;
  };

  const renderContent = () => {
    if (icon && iconPosition === 'start') {
      return (
        <>
          {renderIcon()}
          <span style={{ marginLeft: 8 }}>{children}</span>
        </>
      );
    }
    
    if (icon && iconPosition === 'end') {
      return (
        <>
          <span style={{ marginRight: 8 }}>{children}</span>
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
      fullWidth={fullWidth}
      sx={{
        borderRadius: 8,
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
        ...sx,
      }}
      {...props}
    >
      {renderContent()}
    </Button>
  );
};

export default StandardButton;