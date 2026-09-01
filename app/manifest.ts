import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saathika — Premium Indian Dating App',
    short_name: 'Saathika',
    description: 'Find genuine connections and meaningful relationships on Saathika.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070B18',
    theme_color: '#EC4899',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
