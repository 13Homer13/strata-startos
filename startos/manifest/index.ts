import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'strata',
  title: 'Strata',
  license: 'MIT',
  packageRepo: 'https://github.com/13Homer13/strata-startos',
  upstreamRepo: 'https://github.com/Niko1221/Strata',
  marketingUrl: 'https://github.com/Niko1221/Strata',
  donationUrl: 'https://buymeacoffee.com/strataengine',
  description: { short, long },
  volumes: ['main', 'public'],
  images: {
    strata: {
      source: { dockerTag: 'ghcr.io/niko1221/strata:0.2.7-cuda13' },
      arch: ['x86_64'],
      emulateMissing: false,
      nvidiaContainer: true,
    },
    nginx: {
      source: { dockerTag: 'nginx:1.28.0-alpine' },
      arch: ['x86_64'],
      emulateMissing: false,
    },
  },
  hardwareAcceleration: true,
  hardwareRequirements: {
    device: [
      {
        class: 'display',
        product: null,
        vendor: null,
        driver: 'nvidia',
        description: 'An NVIDIA GPU (RTX 20 series or newer)',
      },
    ],
    // Upstream's floor is 32 GB; a 32 GB machine reports slightly less.
    ram: 30 * 1024 ** 3,
  },
})
