/**
 * deviceFingerprint.js
 * Genera un ID único y estable para el dispositivo/navegador actual.
 * Usado para asociar sesiones a dispositivos sin requerir permisos extra.
 */

/**
 * Genera o recupera un Device ID persistente basado en localStorage.
 * En la app Android el bridge puede proveer un ID más robusto.
 * @returns {string} deviceId
 */
export function getDeviceId() {
  // En contexto Android nativo con JS bridge disponible
  if (typeof window !== 'undefined' && window.AndroidApp) {
    const uid = window.AndroidApp.getUserUID?.();
    if (uid) return `android_${uid}`;
  }

  // Recuperar ID guardado
  const stored = localStorage.getItem('djvip_device_id');
  if (stored) return stored;

  // Generar nuevo ID basado en características del navegador + aleatorio
  const components = [
    navigator.userAgent || '',
    navigator.language || '',
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2, 10)
  ];

  const raw = components.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  const deviceId = `dev_${Math.abs(hash).toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem('djvip_device_id', deviceId);
  return deviceId;
}
