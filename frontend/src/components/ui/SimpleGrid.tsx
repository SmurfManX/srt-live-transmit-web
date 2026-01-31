import { Box, BoxProps } from '@mui/material'
import { ReactNode } from 'react'

interface SimpleGridProps extends Omit<BoxProps, 'display'> {
  container?: boolean
  item?: boolean
  xs?: number
  sm?: number
  md?: number
  lg?: number
  spacing?: number
  children?: ReactNode
}

export default function SimpleGrid({
  container,
  item,
  xs = 12,
  sm,
  md,
  lg,
  spacing = 0,
  children,
  sx = {},
  ...rest
}: SimpleGridProps) {
  if (container) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(12, 1fr)',
            sm: 'repeat(12, 1fr)',
            md: 'repeat(12, 1fr)',
            lg: 'repeat(12, 1fr)',
          },
          gap: spacing * 0.5,
          ...sx,
        }}
        {...rest}
      >
        {children}
      </Box>
    )
  }

  if (item) {
    return (
      <Box
        sx={{
          gridColumn: {
            xs: `span ${xs}`,
            sm: sm ? `span ${sm}` : `span ${xs}`,
            md: md ? `span ${md}` : sm ? `span ${sm}` : `span ${xs}`,
            lg: lg ? `span ${lg}` : md ? `span ${md}` : sm ? `span ${sm}` : `span ${xs}`,
          },
          ...sx,
        }}
        {...rest}
      >
        {children}
      </Box>
    )
  }

  return (
    <Box sx={sx} {...rest}>
      {children}
    </Box>
  )
}
