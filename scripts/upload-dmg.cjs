const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Cargar .env manualmente
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const bucketName = 'djvip-c2cc9.appspot.com';

console.log('Bucket detectado:', bucketName);

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName
});

async function upload() {
  const filePath = path.join(__dirname, '../public/DJ Control Panel.dmg');
  console.log('Subiendo archivo:', filePath);

  if (!fs.existsSync(filePath)) {
    console.error('Error: El archivo DMG no existe en la ruta:', filePath);
    process.exit(1);
  }

  const bucket = admin.storage().bucket();
  
  console.log('Subiendo a Firebase Storage... (esto puede tardar unos minutos ya que pesa 276MB)');
  
  const [file] = await bucket.upload(filePath, {
    destination: 'releases/DJ_Control_Panel.dmg',
    public: true,
    metadata: {
      contentType: 'application/octet-stream',
      cacheControl: 'public, max-age=31536000'
    }
  });

  console.log('Archivo subido con éxito.');
  
  // Asegurar que sea público
  await file.makePublic();
  
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  console.log('========================================================');
  console.log('🔥 URL PÚBLICA DE DESCARGA GENERADA:');
  console.log(publicUrl);
  console.log('========================================================');

  // Actualizar public/version.json con la nueva URL pública!
  const versionPath = path.join(__dirname, '../public/version.json');
  if (fs.existsSync(versionPath)) {
    const versionContent = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    versionContent.dmgUrl = publicUrl;
    fs.writeFileSync(versionPath, JSON.stringify(versionContent, null, 2) + '\n', 'utf8');
    console.log('[version.json] Actualizado dmgUrl con la URL pública de Firebase Storage.');
  }

  process.exit(0);
}

upload().catch(err => {
  console.error('Error durante la subida:', err);
  process.exit(1);
});
