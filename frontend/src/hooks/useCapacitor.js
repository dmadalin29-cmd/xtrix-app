import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const useCapacitor = () => {
  const [platform, setPlatform] = useState('web');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    
    setPlatform(platform);
    setIsNative(isNative);

    // Native-only configurations
    if (isNative) {
      // Set status bar to dark theme
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
      
      // Hide splash screen after app loads
      SplashScreen.hide().catch(() => {});
    }
  }, []);

  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
};
