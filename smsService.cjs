// smsService.cjs – Servicio de notificaciones por SMS usando Twilio y fallback de logging local
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scratch/sms_logs.txt');

// Asegurar que el directorio scratch existe
try {
  const scratchDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
} catch (e) {}

/**
 * Envía un mensaje SMS al administrador master.
 * Utiliza Twilio si las credenciales están en las variables de entorno,
 * de lo contrario, registra el mensaje en el archivo local de logs.
 * 
 * @param {string} body - Contenido del mensaje.
 */
async function sendAdminSMS(body, config = {}) {
  const accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = config.fromNumber || process.env.TWILIO_FROM_NUMBER;
  const toNumber = config.toNumber || process.env.ADMIN_MOBILE_NUMBER || process.env.TWILIO_TO_NUMBER;

  const logMessage = `[${new Date().toISOString()}] SMS para ${toNumber || 'ADMIN'} -> ${body}\n`;

  // Fallback: registrar en archivo local y consola
  try {
    fs.appendFileSync(LOG_FILE, logMessage, 'utf8');
  } catch (err) {
    console.error('Error writing to SMS log file:', err);
  }
  console.log(`📱 [SMS NOTIFICATION]: ${body}`);

  // Si no hay credenciales de Twilio, terminar aquí de forma exitosa (modo fallback)
  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return { success: true, mode: 'local_log' };
  }

  // Twilio HTTP request
  return new Promise((resolve, reject) => {
    const postData = `To=${encodeURIComponent(toNumber)}&From=${encodeURIComponent(fromNumber)}&Body=${encodeURIComponent(body)}`;
    
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, mode: 'twilio', data: JSON.parse(data) });
        } else {
          console.error(`Twilio API returned error code ${res.statusCode}:`, data);
          resolve({ success: false, error: `Status ${res.statusCode}`, mode: 'twilio_error' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Twilio request error:', e);
      resolve({ success: false, error: e.message, mode: 'twilio_error' });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  sendAdminSMS,
  LOG_FILE
};
