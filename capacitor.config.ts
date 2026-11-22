import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.tunv87.familygame',
  appName: 'Trò chơi gia đình',
  // `npm run build:native` writes a relative-path build here
  webDir: 'dist',
  backgroundColor: '#fff8e7',
  ios: {
    contentInset: 'never',
    // keep game screens from bouncing/scrolling like a web page
    scrollEnabled: false,
  },
  android: {
    // no "Open in browser"-style overscroll glow on game screens
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false, // hidden from JS once the first screen has rendered
      backgroundColor: '#ffb703',
      showSpinner: false,
    },
  },
};

export default config;
