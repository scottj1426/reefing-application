import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Ocean and reef color palettes
const colors = {
  ocean: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00ACBD', // Primary ocean blue
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },
  reef: {
    50: '#E0F7FF',
    100: '#B3EBFF',
    200: '#80DDFF',
    300: '#4DD0FF',
    400: '#26C6FF',
    500: '#00C2FF', // Accent reef cyan
    600: '#00B3F0',
    700: '#009FD4',
    800: '#008BB8',
    900: '#006A8F',
  },
};

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'ocean',
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: 'lg',
          boxShadow: 'md',
          transition: 'all 0.3s',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: 'lg',
          },
        },
      }),
    },
    Badge: {
      variants: {
        reef: {
          bg: 'reef.500',
          color: 'white',
        },
        saltwater: {
          bg: 'blue.500',
          color: 'white',
        },
        freshwater: {
          bg: 'green.500',
          color: 'white',
        },
      },
    },
  },
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  },
});

export default theme;
