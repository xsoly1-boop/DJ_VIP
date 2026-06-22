import fs from "fs";
import path from "path";

const firebaseJsPath = path.resolve("src/firebase.js");
const seed500Path = path.resolve("scratch/seed_500_songs.js");

async function run() {
  console.log("=== Parcheando src/firebase.js con las 512 canciones ===");
  const seedContent = fs.readFileSync(seed500Path, "utf-8");
  const match = seedContent.match(/const songs = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error("❌ No se encontró el arreglo.");
    return;
  }
  
  // Evaluar de forma segura el array en JS
  const songs = eval(match[1]);
  
  // Generar la cadena formateada de INITIAL_AUTOCOMPLETE
  let arrayStr = "export const INITIAL_AUTOCOMPLETE = [\n";
  songs.forEach((s, idx) => {
    arrayStr += `  { id: '${idx + 1}', title: ${JSON.stringify(s.title)}, artist: ${JSON.stringify(s.artist)}, genre: ${JSON.stringify(s.genre)} }${idx < songs.length - 1 ? "," : ""}\n`;
  });
  arrayStr += "];";
  
  // Reemplazar en src/firebase.js
  let firebaseContent = fs.readFileSync(firebaseJsPath, "utf-8");
  const replaceRegex = /\/\/ Semilla inicial de canciones para autocompletado\s*export const INITIAL_AUTOCOMPLETE = \[\s*[\s\S]*?\];/;
  
  if (!replaceRegex.test(firebaseContent)) {
    console.error("❌ No se encontró la marca de reemplazo en src/firebase.js");
    return;
  }
  
  firebaseContent = firebaseContent.replace(replaceRegex, `// Semilla inicial de canciones para autocompletado\n${arrayStr}`);
  fs.writeFileSync(firebaseJsPath, firebaseContent, "utf-8");
  console.log("✅ src/firebase.js parcheado correctamente.");
}
run();
