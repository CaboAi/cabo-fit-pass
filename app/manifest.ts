import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cabo Fit Pass',
    short_name: 'Cabo Fit Pass',
    description: 'Your fitness marketplace in Los Cabos',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0d',
    theme_color: '#0b0b0d',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}