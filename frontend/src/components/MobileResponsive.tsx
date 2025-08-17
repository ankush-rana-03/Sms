import React from 'react';
import { useTheme, useMediaQuery, Box, BoxProps } from '@mui/material';

interface MobileResponsiveProps extends BoxProps {
  children: React.ReactNode;
  mobileProps?: BoxProps;
  tabletProps?: BoxProps;
  desktopProps?: BoxProps;
}

export const MobileResponsive: React.FC<MobileResponsiveProps> = ({
  children,
  mobileProps = {},
  tabletProps = {},
  desktopProps = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const getResponsiveProps = () => {
    if (isMobile) return { ...props, ...mobileProps };
    if (isTablet) return { ...props, ...tabletProps };
    return { ...props, ...desktopProps };
  };

  return <Box {...getResponsiveProps()}>{children}</Box>;
};

export const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isSmallScreen: isMobile || isTablet,
  };
};

export default MobileResponsive;