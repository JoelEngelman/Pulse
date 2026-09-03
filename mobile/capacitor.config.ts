import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.joelengelman.pulse',
  appName: 'Pulse',
  webDir: '../artifacts/chat-app/dist/public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
