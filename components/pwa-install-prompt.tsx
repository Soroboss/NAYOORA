"use client";
import { useEffect, useState } from "react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.error('SW registration failed', err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      
      // Do not show on desktop (width > 768px)
      if (window.matchMedia('(min-width: 768px)').matches) {
        return;
      }

      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
      }

      // Check if dismissed within the last 48 hours
      const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < 48 * 60 * 60 * 1000) {
          return;
        }
      }

      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString()); // prevent reappearing immediately
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleIgnore = () => {
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '20px', right: '20px',
      background: 'var(--foreground, #000)', color: 'var(--background, #fff)',
      padding: '16px', borderRadius: '12px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', zIndex: 9999,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    }}>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Installer NAYOORA</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
          Ajoutez l'application à votre écran d'accueil pour un accès rapide.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleIgnore} 
          style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', opacity: 0.6 }}
        >
          Ignorer
        </button>
        <button 
          onClick={handleInstall}
          style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          Installer
        </button>
      </div>
    </div>
  );
}
