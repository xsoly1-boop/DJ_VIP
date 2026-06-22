// Script de siembra para actualizar el autocompletado de canciones global en Firebase Real.
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";

const INITIAL_AUTOCOMPLETE = [
  { id: '1', title: 'Ella Baila Sola', artist: 'Eslabon Armado x Peso Pluma', genre: 'Regional Mexicano' },
  { id: '2', title: 'La Bebé (Remix)', artist: 'Yng Lvcas x Peso Pluma', genre: 'Reggaetón' },
  { id: '3', title: 'Gatita', artist: 'Bellakath', genre: 'Reggaetón' },
  { id: '4', title: 'Como La Flor', artist: 'Selena', genre: 'Cumbia' },
  { id: '5', title: 'Lamento Boliviano', artist: 'Enanitos Verdes', genre: 'Rock en Español' },
  { id: '6', title: 'La Chona', artist: 'Los Tucanes de Tijuana', genre: 'Regional Mexicano' },
  { id: '7', title: 'La Boda del Huitlacoche', artist: 'Carin León', genre: 'Regional Mexicano' },
  { id: '8', title: 'Adiós Amor', artist: 'Christian Nodal', genre: 'Regional Mexicano' },
  { id: '9', title: 'Amor Prohibido', artist: 'Selena', genre: 'Cumbia' },
  { id: '10', title: '17 Años', artist: 'Los Ángeles Azules', genre: 'Cumbia' },
  { id: '11', title: 'Rayando el Sol', artist: 'Maná', genre: 'Rock en Español' },
  { id: '12', title: 'Música Ligera', artist: 'Soda Stereo', genre: 'Rock en Español' },
  { id: '13', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', artist: 'Bizarrap x Quevedo', genre: 'Reggaetón' },
  { id: '14', title: 'Primera Cita', artist: 'Carin León', genre: 'Regional Mexicano' },
  { id: '15', title: 'Lady Gaga', artist: 'Peso Pluma x Gabito Ballesteros', genre: 'Regional Mexicano' },
  { id: '16', title: 'Tulum', artist: 'Peso Pluma x Grupo Frontera', genre: 'Regional Mexicano' },
  { id: '17', title: 'No Se Va', artist: 'Grupo Frontera', genre: 'Regional Mexicano' },
  { id: '18', title: 'Devuélveme a mi Chica', artist: 'Hombres G', genre: 'Rock en Español' },
  { id: '19', title: 'El Rey', artist: 'Vicente Fernández', genre: 'Mariachi / Regional' },
  { id: '20', title: 'Hermoso Cariño', artist: 'Vicente Fernández', genre: 'Mariachi / Regional' },
  { id: '21', title: 'Cien Años', artist: 'Pedro Infante', genre: 'Mariachi / Regional' },
  { id: '22', title: 'La Bikina', artist: 'Luis Miguel', genre: 'Pop Latino' },
  { id: '23', title: 'Ahora Te Puedes Marchar', artist: 'Luis Miguel', genre: 'Pop Latino' },
  { id: '24', title: 'Sálvame', artist: 'RBD', genre: 'Pop Latino' },
  { id: '25', title: 'El Listón de Tu Pelo', artist: 'Los Ángeles Azules', genre: 'Cumbia' },
  { id: '26', title: 'Que Vuelvas', artist: 'Carin León x Grupo Frontera', genre: 'Regional Mexicano' },
  { id: '27', title: 'Si No Te Hubieras Ido', artist: 'Marco Antonio Solís', genre: 'Pop Latino' },
  { id: '28', title: 'Mi Querido Viejo', artist: 'Alejandro Fernández', genre: 'Pop Latino' },
  { id: '29', title: 'Me Dediqué a Perderte', artist: 'Alejandro Fernández', genre: 'Regional Mexicano' },
  { id: '30', title: 'Oye Mi Amor', artist: 'Maná', genre: 'Rock en Español' },
  { id: '31', title: 'Gimme Tha Power', artist: 'Molotov', genre: 'Rock en Español' },
  { id: '32', title: 'Ingrata', artist: 'Café Tacvba', genre: 'Rock en Español' },
  { id: '33', title: 'Kumbala', artist: 'La Maldita Vecindad', genre: 'Rock en Español' },
  { id: '34', title: 'Afuera', artist: 'Caifanes', genre: 'Rock en Español' },
  { id: '35', title: 'La Flaca', artist: 'Jarabe de Palo', genre: 'Rock en Español' },
  { id: '36', title: 'El Tucanazo', artist: 'Los Tucanes de Tijuana', genre: 'Regional Mexicano' },
  { id: '37', title: 'La Mesa del Rincón', artist: 'Los Tigres del Norte', genre: 'Regional Mexicano' },
  { id: '38', title: 'Jefe de Jefes', artist: 'Los Tigres del Norte', genre: 'Regional Mexicano' },
  { id: '39', title: 'Mis Ojos Lloran Por Ti', artist: 'Big Boy', genre: 'Reggaetón / Clásico' },
  { id: '40', title: 'Danza Kuduro', artist: 'Don Omar', genre: 'Urbano' }
];

async function run() {
  console.log("=== Sembrando Catálogo Global de Autocompletado en Firebase Real ===");

  // Convertir array a objeto indexado por ID
  const songsObj = {};
  INITIAL_AUTOCOMPLETE.forEach(song => {
    songsObj[song.id] = {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      globalRequests: 1
    };
  });

  try {
    const res = await fetch(`${dbUrl}/autocomplete_songs.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(songsObj)
    });
    if (res.ok) {
      console.log("🎉 ¡Catálogo de 40 canciones sembrado con éxito en Firebase!");
    } else {
      console.error(`❌ Falló la escritura en la base de datos: ${res.status} - ${await res.text()}`);
    }
  } catch (err) {
    console.error("❌ Error de red:", err.message);
  }
}

run();
