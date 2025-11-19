// PWA Install Prompt Handler

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: InstallPromptEvent | null = null;

// Initialize install prompt listener
export function initInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;

    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent("pwa-install-available"));
  });

  // Track successful installation
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa-installed"));
    console.log("PWA installed successfully");
  });
}

// Check if install prompt is available
export function isInstallAvailable(): boolean {
  return deferredPrompt !== null;
}

// Check if app is already installed
export function isAppInstalled(): boolean {
  // Check display-mode
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // iOS Safari
  // @ts-ignore
  if (window.navigator.standalone === true) {
    return true;
  }

  return false;
}

// Show install prompt
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log("Install prompt not available");
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log("Install prompt outcome:", outcome);

    if (outcome === "accepted") {
      deferredPrompt = null;
      return true;
    }

    return false;
  } catch (error) {
    console.error("Install prompt error:", error);
    return false;
  }
}

// Subscribe to install availability changes
export function onInstallAvailable(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("pwa-install-available", handler);
  return () => window.removeEventListener("pwa-install-available", handler);
}

// Subscribe to successful installation
export function onInstalled(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("pwa-installed", handler);
  return () => window.removeEventListener("pwa-installed", handler);
}

// Get install instructions for manual installation
export function getInstallInstructions(): {
  platform: string;
  instructions: string[];
} {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return {
      platform: "iOS",
      instructions: [
        "Toca el botón de compartir en Safari",
        'Selecciona "Añadir a pantalla de inicio"',
        "Confirma el nombre y toca Añadir",
      ],
    };
  }

  if (/android/.test(userAgent)) {
    return {
      platform: "Android",
      instructions: [
        "Toca el menú del navegador (⋮)",
        'Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"',
        "Confirma la instalación",
      ],
    };
  }

  return {
    platform: "Desktop",
    instructions: [
      "Busca el ícono de instalación en la barra de direcciones",
      "Haz clic en él y confirma la instalación",
    ],
  };
}
