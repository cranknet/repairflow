import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.repairshop.app',
  appName: 'RepairShop',
  webDir: 'public', // Use public folder as webDir (will be empty, server URL handles content)
  server: {
    androidScheme: 'https',
    // IMPORTANT: Configure based on your environment
    // 
    // DEVELOPMENT OPTIONS:
    // - Android Emulator: 'http://10.0.2.2:3000'
    // - Physical Device: 'http://YOUR_COMPUTER_IP:3000' (find IP with ipconfig/ifconfig)
    // 
    // PRODUCTION:
    // - Deployed Server: 'https://your-server.com'
    //
    // Uncomment the appropriate line below:
    url: 'http://10.0.2.2:3000', // Android emulator - CHANGE THIS TO YOUR SERVER URL
    // url: 'http://192.168.1.100:3000', // Physical device (replace with your IP)
    // url: 'https://your-server.com', // Production
    
    // Required for HTTP (not HTTPS) in development
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;

