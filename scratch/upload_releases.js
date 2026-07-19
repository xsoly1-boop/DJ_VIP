import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPO || 'xsoly1-boop/DJ_VIP';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const pkgVersion = pkg.version;
const version = 'v' + pkgVersion.replace('-', '.');
const versionFolder = pkgVersion;

if (!token) {
  console.error('❌ Error: GITHUB_TOKEN no configurado en .env');
  process.exit(1);
}

async function fetchGitHub(url, options = {}) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'node-fetch',
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub API Error: ${response.status} ${response.statusText}\n${errText}`);
  }
  return response.json();
}

async function run() {
  try {
    console.log(`📡 Buscando o creando release para la versión ${version}...`);
    
    let release;
    try {
      // 1. Intentar obtener el release si ya existe
      release = await fetchGitHub(`https://api.github.com/repos/${repo}/releases/tags/${version}`);
      console.log(`ℹ️ Release ${version} ya existe (ID: ${release.id}). Subiendo/actualizando assets...`);
    } catch (e) {
      // 2. Crear release nuevo si no existe
      console.log(`➕ Creando nuevo GitHub Release para ${version}...`);
      release = await fetchGitHub(`https://api.github.com/repos/${repo}/releases`, {
        method: 'POST',
        body: JSON.stringify({
          tag_name: version,
          name: `DJ Panel Pro ${version}`,
          body: 'Instaladores compilados multiplataforma (Android, macOS y Windows) con mejoras de seguridad en el formulario de registro (bloqueo de bots, verificación de correo y reCAPTCHA).',
          draft: false,
          prerelease: false
        })
      });
      console.log(`✅ Release creado exitosamente (ID: ${release.id})`);
    }

    const releaseId = release.id;
    const uploadUrlBase = release.upload_url.split('{')[0]; // URL para subir assets

    // 3. Listar archivos a subir
    const releasesDir = path.join(__dirname, '../releases', versionFolder);
    if (!fs.existsSync(releasesDir)) {
      console.error(`❌ Carpeta de compilaciones no encontrada: ${releasesDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(releasesDir).filter(file => {
      return file.endsWith('.apk') || file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.blockmap');
    });

    console.log(`📦 Encontrados ${files.length} archivos para subir.`);

    // 4. Subir cada archivo
    for (const file of files) {
      const filePath = path.join(releasesDir, file);
      const stats = fs.statSync(filePath);
      
      console.log(`📤 Subiendo ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
      
      // Eliminar el asset si ya existe para evitar errores de duplicado
      const existingAsset = release.assets.find(a => a.name === file);
      if (existingAsset) {
        console.log(`🗑️ Eliminando asset duplicado previo: ${file}...`);
        await fetchGitHub(`https://api.github.com/repos/${repo}/releases/assets/${existingAsset.id}`, {
          method: 'DELETE'
        });
      }

      // Subir archivo binario
      const fileBuffer = fs.readFileSync(filePath);
      const uploadUrl = `${uploadUrlBase}?name=${encodeURIComponent(file)}`;
      
      await fetchGitHub(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': stats.size.toString()
        },
        body: fileBuffer
      });
      
      console.log(`  ✅ ${file} subido con éxito.`);
    }

    console.log('\n🎉 ¡Todos los ejecutables fueron subidos exitosamente a GitHub Releases!');
    console.log(`👉 Enlace: https://github.com/${repo}/releases/tag/${version}`);
  } catch (err) {
    console.error('❌ Error durante la subida:', err.message);
    process.exit(1);
  }
}

run();
