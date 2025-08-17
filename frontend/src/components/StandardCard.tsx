import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  CardMedia,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { UIStandards, ComponentStandards } from '../theme/uiStandards';

interface StandardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  media?: string;
  mediaHeight?: number | string;
  elevation?: number;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
  className?: string;
}

const StandardCard: React.FC<StandardCardProps> = ({
  children,
  title,
  subtitle,
  avatar,
  action,
  media,
  mediaHeight = 140,
  elevation = 1,
  hover = true,
  onClick,
  variant = 'default',
  size = 'medium',
  fullHeight = false,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: UIStandards.spacing.md,
          borderRadius: UIStandards.borderRadius.md,
        };
      case 'large':
        return {
          padding: UIStandards.spacing.xl,
          borderRadius: UIStandards.borderRadius.xl,
        };
      default: // medium
        return {
          padding: UIStandards.spacing.lg,
          borderRadius: UIStandards.borderRadius.lg,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
        };
      case 'elevated':
        return {
          boxShadow: UIStandards.shadows.lg,
        };
      default:
        return {
          boxShadow: UIStandards.shadows.md,
        };
    }
  };

  const cardStyles = {
    ...getSizeStyles(),
    ...getVariantStyles(),
    height: fullHeight ? '100%' : 'auto',
    cursor: onClick ? 'pointer' : 'default',
    transition: ComponentStandards.card.hover.transition,
    '&:hover': hover && onClick ? {
      transform: ComponentStandards.card.hover.transform,
      boxShadow: ComponentStandards.card.hover.boxShadow,
    } : {},
  };

  const headerStyles = {
    paddingBottom: size === 'small' ? UIStandards.spacing.sm : UIStandards.spacing.md,
  };

  const contentStyles = {
    paddingTop: title || subtitle ? 0 : undefined,
  };

  return (
    <Card
      className={className}
      sx={cardStyles}
      elevation={elevation}
      onClick={onClick}
    >
      {media && (
        <CardMedia
          component="img"
          height={mediaHeight}
          image={media}
          alt={title || 'Card media'}
          sx={{
            objectFit: 'cover',
            borderTopLeftRadius: getSizeStyles().borderRadius,
            borderTopRightRadius: getSizeStyles().borderRadius,
          }}
        />
      )}
      
      {(title || subtitle || avatar) && (
        <CardHeader
          avatar={avatar}
          title={
            title && (
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{
                  fontWeight: UIStandards.typography.h5.fontWeight,
                  color: 'text.primary',
                }}
              >
                {title}
              </Typography>
            )
          }
          subheader={
            subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                }}
              >
                {subtitle}
              </Typography>
            )
          }
          sx={headerStyles}
        />
      )}
      
      <CardContent sx={contentStyles}>
        {children}
      </CardContent>
      
      {action && (
        <CardActions
          sx={{
            padding: size === 'small' ? UIStandards.spacing.sm : UIStandards.spacing.md,
            paddingTop: 0,
          }}
        >
          {action}
        </CardActions>
      )}
    </Card>
  );
};

export default StandardCard;