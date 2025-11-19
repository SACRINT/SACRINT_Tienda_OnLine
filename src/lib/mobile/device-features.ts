// Device Features Access

// Camera types
export interface CameraOptions {
  facing?: "user" | "environment";
  width?: number;
  height?: number;
}

export interface PhotoResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

// Check camera availability
export function isCameraAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Request camera access
export async function requestCameraAccess(
  options: CameraOptions = {},
): Promise<MediaStream | null> {
  if (!isCameraAvailable()) {
    console.log("Camera not available");
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: options.facing || "environment",
        width: options.width ? { ideal: options.width } : undefined,
        height: options.height ? { ideal: options.height } : undefined,
      },
    });

    return stream;
  } catch (error) {
    console.error("Camera access denied:", error);
    return null;
  }
}

// Capture photo from video stream
export function capturePhoto(
  video: HTMLVideoElement,
  quality: number = 0.9,
): PhotoResult {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  // Convert to blob
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  return {
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}

// Geolocation types
export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Check geolocation availability
export function isGeolocationAvailable(): boolean {
  return "geolocation" in navigator;
}

// Get current location
export async function getCurrentLocation(
  highAccuracy: boolean = false,
): Promise<LocationResult | null> {
  if (!isGeolocationAvailable()) {
    console.log("Geolocation not available");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        resolve(null);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  });
}

// Watch location changes
export function watchLocation(
  callback: (location: LocationResult | null) => void,
  highAccuracy: boolean = false,
): () => void {
  if (!isGeolocationAvailable()) {
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error("Geolocation watch error:", error);
      callback(null);
    },
    {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

// Share API
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// Check share availability
export function isShareAvailable(): boolean {
  return !!navigator.share;
}

// Share content
export async function share(data: ShareData): Promise<boolean> {
  if (!isShareAvailable()) {
    console.log("Share API not available");
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Share failed:", error);
    }
    return false;
  }
}

// Clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

// Read from clipboard
export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error("Clipboard read failed:", error);
    return null;
  }
}

// Fullscreen
export function isFullscreenAvailable(): boolean {
  return !!(
    document.fullscreenEnabled ||
    // @ts-ignore
    document.webkitFullscreenEnabled ||
    // @ts-ignore
    document.mozFullScreenEnabled ||
    // @ts-ignore
    document.msFullscreenEnabled
  );
}

export async function requestFullscreen(
  element?: HTMLElement,
): Promise<boolean> {
  const el = element || document.documentElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      // @ts-ignore
    } else if (el.webkitRequestFullscreen) {
      // @ts-ignore
      await el.webkitRequestFullscreen();
      // @ts-ignore
    } else if (el.mozRequestFullScreen) {
      // @ts-ignore
      await el.mozRequestFullScreen();
      // @ts-ignore
    } else if (el.msRequestFullscreen) {
      // @ts-ignore
      await el.msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error("Fullscreen request failed:", error);
    return false;
  }
}

export async function exitFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      // @ts-ignore
    } else if (document.webkitExitFullscreen) {
      // @ts-ignore
      await document.webkitExitFullscreen();
      // @ts-ignore
    } else if (document.mozCancelFullScreen) {
      // @ts-ignore
      await document.mozCancelFullScreen();
      // @ts-ignore
    } else if (document.msExitFullscreen) {
      // @ts-ignore
      await document.msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error("Exit fullscreen failed:", error);
    return false;
  }
}
