import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fikirakademisi.app',
  appName: 'Fikir Akademisi',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
