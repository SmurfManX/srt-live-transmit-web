import { createTheme, ThemeOptions } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') => {
  const colors = {
    primary: {
      main: mode === 'dark' ? '#5DB36A' : '#4A8B57',
      light: mode === 'dark' ? '#7AC287' : '#5DB36A',
      dark: mode === 'dark' ? '#4A8B57' : '#3A6F46',
      contrastText: '#FAFAF8',
    },
    secondary: {
      main: mode === 'dark' ? '#D4A574' : '#B8935E',
      light: mode === 'dark' ? '#E6C099' : '#D4A574',
      dark: mode === 'dark' ? '#B8935E' : '#9A7A4D',
      contrastText: mode === 'dark' ? '#3D3026' : '#FAFAF8',
    },
    background: {
      default: mode === 'dark' ? '#1F1A17' : '#F8F6F4',
      paper: mode === 'dark' ? '#2B2520' : '#FFFFFF',
      elevated: mode === 'dark' ? '#3A3228' : '#F5F3F1',
    },
    text: {
      primary: mode === 'dark' ? '#F2EBE3' : '#3D3026',
      secondary: mode === 'dark' ? '#B8AFA3' : '#736B5E',
      disabled: mode === 'dark' ? '#8A7F70' : '#A89F92',
    },
    border: {
      main: mode === 'dark' ? 'rgba(184, 175, 163, 0.15)' : 'rgba(61, 48, 38, 0.12)',
      light: mode === 'dark' ? 'rgba(184, 175, 163, 0.08)' : 'rgba(61, 48, 38, 0.06)',
    },
  }

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      text: colors.text,
      error: {
        main: mode === 'dark' ? '#ef4444' : '#dc2626',
        light: '#f87171',
        dark: '#b91c1c',
      },
      success: {
        main: mode === 'dark' ? '#10b981' : '#059669',
        light: '#34d399',
        dark: '#047857',
      },
      warning: {
        main: mode === 'dark' ? '#f59e0b' : '#d97706',
        light: '#fbbf24',
        dark: '#b45309',
      },
      info: {
        main: colors.primary.main,
      },
      divider: colors.border.main,
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '3.5rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '2.5rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.015em',
        lineHeight: 1.35,
      },
      h4: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      button: {
        fontSize: '0.9375rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: mode === 'dark' ? [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      '0 4px 8px 0 rgba(0, 0, 0, 0.3)',
      '0 6px 12px 0 rgba(0, 0, 0, 0.35)',
      '0 8px 16px 0 rgba(0, 0, 0, 0.35)',
      '0 12px 24px 0 rgba(0, 0, 0, 0.4)',
      '0 16px 32px 0 rgba(0, 0, 0, 0.4)',
      '0 20px 40px 0 rgba(0, 0, 0, 0.45)',
      '0 24px 48px 0 rgba(0, 0, 0, 0.45)',
      '0 28px 56px 0 rgba(0, 0, 0, 0.5)',
      '0 32px 64px 0 rgba(0, 0, 0, 0.5)',
      '0 36px 72px 0 rgba(0, 0, 0, 0.55)',
      '0 40px 80px 0 rgba(0, 0, 0, 0.55)',
      '0 44px 88px 0 rgba(0, 0, 0, 0.6)',
      '0 48px 96px 0 rgba(0, 0, 0, 0.6)',
      '0 52px 104px 0 rgba(0, 0, 0, 0.65)',
      '0 56px 112px 0 rgba(0, 0, 0, 0.65)',
      '0 60px 120px 0 rgba(0, 0, 0, 0.7)',
      '0 64px 128px 0 rgba(0, 0, 0, 0.7)',
      '0 68px 136px 0 rgba(0, 0, 0, 0.75)',
      '0 72px 144px 0 rgba(0, 0, 0, 0.75)',
      '0 76px 152px 0 rgba(0, 0, 0, 0.8)',
      '0 80px 160px 0 rgba(0, 0, 0, 0.8)',
      '0 84px 168px 0 rgba(0, 0, 0, 0.85)',
    ] : [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      '0 3px 6px 0 rgba(0, 0, 0, 0.1)',
      '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
      '0 6px 12px 0 rgba(0, 0, 0, 0.1)',
      '0 8px 16px 0 rgba(0, 0, 0, 0.1)',
      '0 10px 20px 0 rgba(0, 0, 0, 0.1)',
      '0 12px 24px 0 rgba(0, 0, 0, 0.1)',
      '0 14px 28px 0 rgba(0, 0, 0, 0.1)',
      '0 16px 32px 0 rgba(0, 0, 0, 0.12)',
      '0 18px 36px 0 rgba(0, 0, 0, 0.12)',
      '0 20px 40px 0 rgba(0, 0, 0, 0.12)',
      '0 22px 44px 0 rgba(0, 0, 0, 0.12)',
      '0 24px 48px 0 rgba(0, 0, 0, 0.12)',
      '0 26px 52px 0 rgba(0, 0, 0, 0.14)',
      '0 28px 56px 0 rgba(0, 0, 0, 0.14)',
      '0 30px 60px 0 rgba(0, 0, 0, 0.14)',
      '0 32px 64px 0 rgba(0, 0, 0, 0.14)',
      '0 34px 68px 0 rgba(0, 0, 0, 0.14)',
      '0 36px 72px 0 rgba(0, 0, 0, 0.16)',
      '0 38px 76px 0 rgba(0, 0, 0, 0.16)',
      '0 40px 80px 0 rgba(0, 0, 0, 0.16)',
      '0 42px 84px 0 rgba(0, 0, 0, 0.16)',
    ],
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            minHeight: '44px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 8px 20px -4px rgba(99, 102, 241, 0.4)'
                : '0 4px 16px -2px rgba(79, 70, 229, 0.3)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            background: mode === 'dark'
              ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`
              : colors.primary.main,
            '&:hover': {
              background: mode === 'dark'
                ? `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`
                : colors.primary.dark,
            },
          },
          outlined: {
            borderColor: colors.border.main,
            borderWidth: '1.5px',
            '&:hover': {
              borderColor: colors.primary.main,
              borderWidth: '1.5px',
              backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.04)',
            },
          },
          sizeLarge: {
            padding: '12px 28px',
            fontSize: '1rem',
            minHeight: '48px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: `1px solid ${colors.border.main}`,
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1) inset'
              : '0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(79, 70, 229, 0.05) inset',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(26, 26, 36, 0.95) 0%, rgba(20, 20, 27, 0.95) 100%)'
              : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'dark'
                ? '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.3) inset'
                : '0 12px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(79, 70, 229, 0.2) inset',
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.3)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.75rem',
            height: '28px',
          },
          filled: {
            border: `1px solid ${colors.border.light}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: colors.border.main,
                transition: 'all 0.2s ease',
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
              '&.Mui-focused': {
                backgroundColor: mode === 'dark' ? 'rgba(59, 130, 246, 0.04)' : 'rgba(0, 102, 255, 0.02)',
                '& fieldset': {
                  borderColor: colors.primary.main,
                  borderWidth: '2px',
                },
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: '12px',
          },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 2px 8px -1px rgba(0, 0, 0, 0.3)'
              : '0 1px 4px 0 rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${colors.border.main}`,
            backdropFilter: 'blur(12px)',
            backgroundColor: mode === 'dark'
              ? 'rgba(10, 10, 15, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 8,
            borderRadius: 4,
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          },
          bar: {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${colors.primary.main}, ${colors.secondary.main})`,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 102, 255, 0.08)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'dark' ? '#1a1a24' : '#ffffff',
            color: colors.text.primary,
            border: `1px solid ${colors.border.main}`,
            borderRadius: '8px',
            boxShadow: mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontSize: '0.8125rem',
            padding: '8px 12px',
          },
          arrow: {
            color: mode === 'dark' ? '#1a1a24' : '#ffffff',
            '&::before': {
              border: `1px solid ${colors.border.main}`,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: colors.border.main,
          },
        },
      },
    },
  }

  return createTheme(themeOptions)
}
