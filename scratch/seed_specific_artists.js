// Script para agregar canciones top de grupos específicos solicitados por el usuario
import fs from "fs";
import path from "path";

const seed500Path = path.resolve("scratch/seed_500_songs.js");

const newSongs = [
  // Ángeles Azules
  { title: "El Listón de Tu Pelo (Remix)", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Amor de Mis Amores", artist: "Los Ángeles Azules x Kika Edgar", genre: "Cumbia" },
  { title: "Cumbia del Acordeón", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Mi Único Amor", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Amigos Nada Más", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Me Haces Falta Tú", artist: "Los Ángeles Azules", genre: "Cumbia" },

  // Sonora Dinamita
  { title: "El Negro José", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Carola", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Cumbia Nació en Barú", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Sorullo", artist: "La Sonora Dinamita", genre: "Cumbia" },

  // Viviz (K-Pop)
  { title: "BOP BOP!", artist: "VIVIZ", genre: "Kpop" },
  { title: "LOVEADE", artist: "VIVIZ", genre: "Kpop" },
  { title: "PULL UP", artist: "VIVIZ", genre: "Kpop" },
  { title: "MANIAC", artist: "VIVIZ", genre: "Kpop" },
  { title: "Untie", artist: "VIVIZ", genre: "Kpop" },

  // Le Sserafim (K-Pop)
  { title: "Blue Flame", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "No Celestial", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Sour Grapes", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Impurities", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Good Parts", artist: "LE SSERAFIM", genre: "Kpop" },

  // Banda Tierra Mojada (Regional Mexicano / Banda de Viento)
  { title: "Mi Hermoso Cariño", artist: "Banda Tierra Mojada", genre: "Regional Mexicano" },
  { title: "Flor de Piña", artist: "Banda Tierra Mojada", genre: "Regional Mexicano" },
  { title: "El Calentón", artist: "Banda Tierra Mojada", genre: "Regional Mexicano" },
  { title: "Tengo Ganas de Ti", artist: "Banda Tierra Mojada", genre: "Regional Mexicano" },
  { title: "Pueblo Viejo", artist: "Banda Tierra Mojada", genre: "Regional Mexicano" },

  // Los Rugar (Cumbia / Norteño-Saxo)
  { title: "El Pasadiscos", artist: "Los Rugar", genre: "Cumbia" },
  { title: "Cumbia de la Nena", artist: "Los Rugar", genre: "Cumbia" },
  { title: "La Del Moño Colorado", artist: "Los Rugar", genre: "Cumbia" },
  { title: "El Amigo Que Se Fue", artist: "Los Rugar", genre: "Cumbia" },
  { title: "Cumbia Rugar", artist: "Los Rugar", genre: "Cumbia" },

  // Mi Banda El Mexicano (Quebradita / Technocumbia)
  { title: "Ramito de Violetas", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "No Bailes de Caballito", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "Mambo Lupita", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "La Bota", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "Feliz Feliz", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "La Morena", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "Help! (Ayúdame)", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },
  { title: "Pelotero a la Bola", artist: "Mi Banda El Mexicano", genre: "Quebradita / Cumbia" },

  // Yiyo Sarante (Salsa Dominicana)
  { title: "Corazón de Acero", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Qué de Mí", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Probablemente", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Mi Todo", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Doble Servicio", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Sálvame", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Me Hubieras Dicho Antes", artist: "Yiyo Sarante", genre: "Salsa" },

  // Oscar D'León (Salsa)
  { title: "Llorarás", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Detalles", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Melao de Caña", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Mi Bajo y Yo", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Que Bueno Baila Usted", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Bajo la Tormenta", artist: "Oscar D'León", genre: "Salsa" },

  // Sonora Carruseles (Salsa / Boogaloo)
  { title: "Micaela", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },
  { title: "La Salsa La Traigo Yo", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },
  { title: "El Pito", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },
  { title: "Al Son de los Cueros", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },
  { title: "Ave María Lola", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },
  { title: "La Chica Gomela", artist: "Sonora Carruseles", genre: "Salsa / Boogaloo" },

  // Sonora Santanera (Tropical / Bolero / Afro-Antillano)
  { title: "El Mudo", artist: "La Sonora Santanera", genre: "Tropical / Bolero" },
  { title: "Pena Negra", artist: "La Sonora Santanera", genre: "Tropical / Bolero" },
  { title: "El Orangután", artist: "La Sonora Santanera", genre: "Tropical / Bolero" },
  { title: "Amor de Cabaret", artist: "La Sonora Santanera", genre: "Tropical / Bolero" },
  { title: "Bomboro Quiñá Quiñá", artist: "La Sonora Santanera x La Única Internacional", genre: "Tropical" },

  // Merenglass (Merengue)
  { title: "La Mujer del Pelotero", artist: "Merenglass", genre: "Merengue" },
  { title: "El Kulikitaka", artist: "Merenglass", genre: "Merengue" },
  { title: "Llegó el Afilador", artist: "Merenglass", genre: "Merengue" },
  { title: "La Cerveza", artist: "Merenglass", genre: "Merengue" },
  { title: "El Conejo", artist: "Merenglass", genre: "Merengue" },
  { title: "Chupando la Caña", artist: "Merenglass", genre: "Merengue" }
];

async function run() {
  console.log("=== Fusionando y agregando canciones de artistas solicitados ===");
  const seedContent = fs.readFileSync(seed500Path, "utf-8");
  const match = seedContent.match(/const songs = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error("❌ No se encontró el arreglo.");
    return;
  }

  const existingSongs = eval(match[1]);
  
  // Agregar ignorando duplicados exactos (mismo título y artista)
  const mergedSongs = [...existingSongs];
  
  newSongs.forEach(ns => {
    const isDuplicate = existingSongs.some(es => 
      es.title.toLowerCase().trim() === ns.title.toLowerCase().trim() &&
      es.artist.toLowerCase().trim() === ns.artist.toLowerCase().trim()
    );
    if (!isDuplicate) {
      mergedSongs.push(ns);
    }
  });

  // Escribir el nuevo arreglo de vuelta a seed_500_songs.js
  let newSeedContent = seedContent.replace(
    /const songs = (\[[\s\S]*?\]);/,
    `const songs = ${JSON.stringify(mergedSongs, null, 2)};`
  );
  
  fs.writeFileSync(seed500Path, newSeedContent, "utf-8");
  console.log(`✅ seed_500_songs.js actualizado. Total canciones: ${mergedSongs.length}`);
}

run();
