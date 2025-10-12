import { useState, useEffect } from 'react';

/**
 * Componente para mostrar banner de instalación PWA
 * Solo aparece en navegadores compatibles que no tengan la app instalada
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar si ya está instalada (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone || // iOS Safari
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Si ya está instalada, no mostrar nada
    if (standalone) return;

    // Para iOS, mostrar instrucciones manuales
    if (iOS) {
      // Verificar si el usuario ya rechazó el banner
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
      return;
    }

    // Para otros navegadores (Android Chrome, etc.), usar beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir mostrar el mini-infobar por defecto
      e.preventDefault();
      // Guardar el evento para usarlo después
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (isIOS) {
      // Recordar que el usuario rechazó el banner en iOS
      localStorage.setItem('pwa-ios-dismissed', 'true');
    }
  };

  // No mostrar nada si ya está instalada
  if (isStandalone) {
    return null;
  }

  // No mostrar si el banner está oculto
  if (!showInstallBanner) {
    return null;
  }

  // Banner para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="pr-8">
            <h3 className="font-bold text-lg mb-2">📱 Instalar ElizabethAI</h3>
            <p className="text-sm mb-3 text-white/90">
              Agregá esta app a tu pantalla de inicio para acceso rápido y mejor experiencia.
            </p>

            <div className="bg-white/10 rounded-xl p-3 text-sm space-y-2">
              <p className="font-semibold">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-white/90">
                <li>Tocá el botón <span className="inline-block">📤</span> Compartir (abajo)</li>
                <li>Seleccioná "Agregar a pantalla de inicio"</li>
                <li>Tocá "Agregar"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <div className="text-4xl">📱</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">Instalar ElizabethAI</h3>
          <p className="text-sm text-white/90">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors whitespace-nowrap"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/80 hover:text-white text-sm"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
