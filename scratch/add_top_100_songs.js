// Scripts de siembra: Agrega un top 100 de música popular en fiestas que no esté registrada aún
const DB_URL = "https://djvip-c2cc9-default-rtdb.firebaseio.com";

const CANDIDATES = [
  { title: "Danza Kuduro", artist: "Don Omar", genre: "Urbano" },
  { title: "Pepas", artist: "Farruko", genre: "Urbano / Electro" },
  { title: "La Bicicleta", artist: "Carlos Vives & Shakira", genre: "Pop Latino" },
  { title: "Despacito", artist: "Luis Fonsi x Daddy Yankee", genre: "Pop Latino" },
  { title: "La Gozadera", artist: "Gente de Zona x Marc Anthony", genre: "Salsa / Pop" },
  { title: "La Vida Es Un Carnaval", artist: "Celia Cruz", genre: "Salsa" },
  { title: "Vivir Mi Vida", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Suavemente", artist: "Elvis Crespo", genre: "Merengue" },
  { title: "La Bilirrubina", artist: "Juan Luis Guerra", genre: "Merengue" },
  { title: "Sopa de Caracol", artist: "Banda Blanca", genre: "Punta" },
  { title: "Macarena", artist: "Los Del Río", genre: "Pop / Clásico" },
  { title: "Aserejé", artist: "Las Ketchup", genre: "Pop / Clásico" },
  { title: "La Bomba", artist: "Azul Azul", genre: "Pop Latino" },
  { title: "Mayonesa", artist: "Chocolate", genre: "Cumbia Pop" },
  { title: "1, 2, 3", artist: "El Símbolo", genre: "Pop / Dance" },
  { title: "Levantando las Manos", artist: "El Símbolo", genre: "Pop / Dance" },
  { title: "No Rompas Más", artist: "Caballo Dorado", genre: "Country" },
  { title: "Payaso de Rodeo", artist: "Caballo Dorado", genre: "Country" },
  { title: "La Chona", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { title: "El Tucanazo", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { title: "La Boda del Huitlacoche", artist: "Carin León", genre: "Regional Mexicano" },
  { title: "17 Años", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "El Listón de Tu Pelo", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Como La Flor", artist: "Selena", genre: "Cumbia / Tex-Mex" },
  { title: "Amor Prohibido", artist: "Selena", genre: "Cumbia / Tex-Mex" },
  { title: "Bidi Bidi Bom Bom", artist: "Selena", genre: "Cumbia / Tex-Mex" },
  { title: "Lamento Boliviano", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { title: "Música Ligera", artist: "Soda Stereo", genre: "Rock en Español" },
  { title: "Rayando el Sol", artist: "Maná", genre: "Rock en Español" },
  { title: "Oye Mi Amor", artist: "Maná", genre: "Rock en Español" },
  { title: "Devuélveme a mi Chica", artist: "Hombres G", genre: "Rock en Español" },
  { title: "El Rey", artist: "Vicente Fernández", genre: "Mariachi" },
  { title: "Ahora Te Puedes Marchar", artist: "Luis Miguel", genre: "Pop Latino" },
  { title: "La Incondicional", artist: "Luis Miguel", genre: "Pop / Balada" },
  { title: "Sálvame", artist: "RBD", genre: "Pop Latino" },
  { title: "Rebelde", artist: "RBD", genre: "Pop Latino" },
  { title: "Gasolina", artist: "Daddy Yankee", genre: "Reggaetón" },
  { title: "Lo Que Pasó, Pasó", artist: "Daddy Yankee", genre: "Reggaetón" },
  { title: "Con Calma", artist: "Daddy Yankee x Snow", genre: "Reggaetón / Pop" },
  { title: "Limbo", artist: "Daddy Yankee", genre: "Reggaetón / Urbano" },
  { title: "Ella Baila Sola", artist: "Eslabon Armado x Peso Pluma", genre: "Corridos Tumbados" },
  { title: "PRC", artist: "Peso Pluma x Natanael Cano", genre: "Corridos Tumbados" },
  { title: "AMG", artist: "Natanael Cano x Peso Pluma x Gabito Ballesteros", genre: "Corridos Tumbados" },
  { title: "Lady Gaga", artist: "Peso Pluma x Gabito Ballesteros x Junior H", genre: "Corridos Tumbados" },
  { title: "Tulum", artist: "Peso Pluma x Grupo Frontera", genre: "Regional Mexicano" },
  { title: "No Se Va", artist: "Grupo Frontera", genre: "Regional Mexicano" },
  { title: "un x100to", artist: "Grupo Frontera x Bad Bunny", genre: "Regional Mexicano" },
  { title: "Que Vuelvas", artist: "Carin León x Grupo Frontera", genre: "Regional Mexicano" },
  { title: "Si No Te Hubieras Ido", artist: "Marco Antonio Solís", genre: "Pop Latino" },
  { title: "Me Dediqué a Perderte", artist: "Alejandro Fernández", genre: "Regional Mexicano" },
  { title: "Gimme Tha Power", artist: "Molotov", genre: "Rock en Español" },
  { title: "Ingrata", artist: "Café Tacvba", genre: "Rock en Español" },
  { title: "Kumbala", artist: "La Maldita Vecindad", genre: "Rock en Español" },
  { title: "Afuera", artist: "Caifanes", genre: "Rock en Español" },
  { title: "La Flaca", artist: "Jarabe de Palo", genre: "Rock en Español" },
  { title: "Mi Gente", artist: "J Balvin x Willy William", genre: "Reggaetón" },
  { title: "Hips Don't Lie", artist: "Shakira x Wyclef Jean", genre: "Pop Latino" },
  { title: "Waka Waka (Esto es África)", artist: "Shakira", genre: "Pop Latino" },
  { title: "La Tortura", artist: "Shakira x Alejandro Sanz", genre: "Pop Latino" },
  { title: "Dákiti", artist: "Bad Bunny x Jhay Cortez", genre: "Reggaetón" },
  { title: "Tití Me Preguntó", artist: "Bad Bunny", genre: "Reggaetón" },
  { title: "Me Porto Bonito", artist: "Bad Bunny x Chencho Corleone", genre: "Reggaetón" },
  { title: "Tusa", artist: "Karol G x Nicki Minaj", genre: "Reggaetón" },
  { title: "Bichota", artist: "Karol G", genre: "Reggaetón" },
  { title: "TQG", artist: "Karol G x Shakira", genre: "Reggaetón" },
  { title: "Provenza", artist: "Karol G", genre: "Reggaetón / Pop" },
  { title: "Hawái", artist: "Maluma", genre: "Reggaetón" },
  { title: "Felices los 4", artist: "Maluma", genre: "Reggaetón" },
  { title: "Despechá", artist: "Rosalía", genre: "Pop Latino" },
  { title: "Con Altura", artist: "Rosalía x J Balvin", genre: "Urbano" },
  { title: "Bzrp Music Sessions, Vol. 53", artist: "Bizarrap x Shakira", genre: "Electro Pop" },
  { title: "Provócame", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Torero", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Salomé", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Madre Tierra (Oye)", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Livin' la Vida Loca", artist: "Ricky Martin", genre: "Pop Latino" },
  { title: "La Copa de la Vida", artist: "Ricky Martin", genre: "Pop Latino" },
  { title: "La Mordidita", artist: "Ricky Martin x Yotuel", genre: "Pop Latino" },
  { title: "Llorarás", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Idilio", artist: "Willie Colón", genre: "Salsa" },
  { title: "Valió la Pena", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Flor Pálida", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Tu Amor Me Hace Bien", artist: "Marc Anthony", genre: "Salsa" },
  { title: "La Camisa Negra", artist: "Juanes", genre: "Pop Rock" },
  { title: "A Dios le Pido", artist: "Juanes", genre: "Pop Rock" },
  { title: "Color Esperanza", artist: "Diego Torres", genre: "Pop Latino" },
  { title: "Calma (Remix)", artist: "Pedro Capó x Farruko", genre: "Pop Latino / Reggae" },
  { title: "Vida de Rico", artist: "Camilo", genre: "Pop Latino" },
  { title: "Favorito", artist: "Camilo", genre: "Pop Latino" },
  { title: "I Gotta Feeling", artist: "Black Eyed Peas", genre: "Dance Pop" },
  { title: "Party Rock Anthem", artist: "LMFAO", genre: "Electro Pop" },
  { title: "Timber", artist: "Pitbull x Ke$ha", genre: "Dance Pop" },
  { title: "Uptown Funk", artist: "Mark Ronson x Bruno Mars", genre: "Funk Pop" },
  { title: "Single Ladies (Put a Ring on It)", artist: "Beyoncé", genre: "R&B / Pop" },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", genre: "Pop" },
  { title: "Happy", artist: "Pharrell Williams", genre: "Pop" },
  { title: "Billie Jean", artist: "Michael Jackson", genre: "Pop" },
  { title: "Thriller", artist: "Michael Jackson", genre: "Pop" },
  { title: "Dancing Queen", artist: "ABBA", genre: "Disco" },
  { title: "Mamma Mia", artist: "ABBA", genre: "Disco" },
  { title: "Stayin' Alive", artist: "Bee Gees", genre: "Disco" },
  { title: "Y.M.C.A.", artist: "Village People", genre: "Disco" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", genre: "80s Pop" },
  { title: "Wannabe", artist: "Spice Girls", genre: "90s Pop" },
  { title: "...Baby One More Time", artist: "Britney Spears", genre: "Pop" },
  { title: "Toxic", artist: "Britney Spears", genre: "Pop" },
  { title: "Mr. Brightside", artist: "The Killers", genre: "Indie Rock" },
  { title: "Shut Up and Dance", artist: "Walk the Moon", genre: "Pop Rock" },
  { title: "Wake Me Up", artist: "Avicii", genre: "EDM / Country" },
  { title: "Titanium", artist: "David Guetta x Sia", genre: "EDM / Pop" },
  { title: "Don't You Worry Child", artist: "Swedish House Mafia", genre: "EDM" },
  { title: "Lean On", artist: "Major Lazer x DJ Snake", genre: "EDM" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", genre: "Classic Rock" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", genre: "Classic Rock" },
  { title: "Don't Stop Believin'", artist: "Journey", genre: "Classic Rock" },
  { title: "One More Time", artist: "Daft Punk", genre: "House / Electro" },
  { title: "Hey Ya!", artist: "Outkast", genre: "Pop / R&B" },
  { title: "Yeah!", artist: "Usher x Lil Jon x Ludacris", genre: "Hip Hop / R&B" },
  { title: "La Rebelión", artist: "Joe Arroyo", genre: "Salsa" },
  { title: "El Santo del Amor", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Escándalo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Mi Cucu", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Que Nadie Sepa Mi Sufrir", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Yerberito Moderno", artist: "Celia Cruz", genre: "Salsa" },
  { title: "Save Your Tears", artist: "The Weeknd", genre: "Synth Pop" },
  { title: "Blinding Lights", artist: "The Weeknd", genre: "Synth Pop" },
  { title: "As It Was", artist: "Harry Styles", genre: "Indie Pop" },
  { title: "About Damn Time", artist: "Lizzo", genre: "Funk Pop" },
  { title: "Cold Heart (PNAU Remix)", artist: "Elton John x Dua Lipa", genre: "Dance Pop" },
  { title: "Levitating", artist: "Dua Lipa", genre: "Dance Pop" },
  { title: "Don't Start Now", artist: "Dua Lipa", genre: "Dance Pop" },
  { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
  { title: "Cruel Summer", artist: "Taylor Swift", genre: "Pop" },
  { title: "Shake It Off", artist: "Taylor Swift", genre: "Pop" },
  { title: "Bad Romance", artist: "Lady Gaga", genre: "Dance Pop" },
  { title: "Poker Face", artist: "Lady Gaga", genre: "Dance Pop" },
  { title: "DJ Got Us Fallin' In Love", artist: "Usher x Pitbull", genre: "Dance Pop" },
  { title: "Give Me Everything", artist: "Pitbull x Ne-Yo x Afrojack x Nayer", genre: "Dance Pop" },
  { title: "On The Floor", artist: "Jennifer Lopez x Pitbull", genre: "Dance Pop" },
  { title: "Fireball", artist: "Pitbull x John Ryan", genre: "Dance Pop" },
  { title: "Hotel Room Service", artist: "Pitbull", genre: "Hip House" },
  { title: "Rain Over Me", artist: "Pitbull x Marc Anthony", genre: "Dance Pop" },
  { title: "Feel So Close", artist: "Calvin Harris", genre: "EDM" },
  { title: "Summer", artist: "Calvin Harris", genre: "EDM" },
  { title: "This Is What You Came For", artist: "Calvin Harris x Rihanna", genre: "EDM" },
  { title: "We Found Love", artist: "Rihanna x Calvin Harris", genre: "EDM / Pop" },
  { title: "Don't Stop The Music", artist: "Rihanna", genre: "Dance Pop" },
  { title: "Only Girl (In the World)", artist: "Rihanna", genre: "Dance Pop" },
  
  // NUEVOS CANDIDATOS ADICIONALES PARA LLEGAR A UN TOP 100 REAL DE NUEVAS CANCIONES
  { title: "Mr. Saxobeat", artist: "Alexandra Stan", genre: "Dance Pop / House" },
  { title: "Stereo Love", artist: "Edward Maya x Vika Jigulina", genre: "House" },
  { title: "Barbra Streisand", artist: "Duck Sauce", genre: "Disco House" },
  { title: "We No Speak Americano", artist: "Yolanda Be Cool x DCUP", genre: "Electro Swing" },
  { title: "Animals", artist: "Martin Garrix", genre: "EDM / Electro" },
  { title: "Levels", artist: "Avicii", genre: "EDM" },
  { title: "Sandstorm", artist: "Darude", genre: "Trance" },
  { title: "Sweet Dreams (Are Made of This)", artist: "Eurythmics", genre: "Synth Pop" },
  { title: "Blue (Da Ba Dee)", artist: "Eiffel 65", genre: "Eurodance" },
  { title: "Be My Lover", artist: "La Bouche", genre: "Eurodance" },
  { title: "Rhythm is a Dancer", artist: "Snap!", genre: "Eurodance" },
  { title: "What is Love", artist: "Haddaway", genre: "Eurodance" },
  { title: "Pump Up the Jam", artist: "Technotronic", genre: "Eurodance" },
  { title: "Cotton Eye Joe", artist: "Rednex", genre: "Eurodance / Country" },
  { title: "Conga", artist: "Gloria Estefan x Miami Sound Machine", genre: "Latin Pop" },
  { title: "Oye!", artist: "Gloria Estefan", genre: "Latin Pop" },
  { title: "Papi Chulo... Te Traigo El Mmmm", artist: "Lorna", genre: "Reggaetón Clásico" },
  { title: "El Tiburón", artist: "Proyecto Uno", genre: "Merengue House" },
  { title: "Está Pegao", artist: "Proyecto Uno", genre: "Merengue House" },
  { title: "Another Night", artist: "Real McCoy", genre: "Eurodance" },
  { title: "Scatman (Basic-Loop)", artist: "Scatman John", genre: "Eurodance" },
  { title: "The Rhythm of the Night", artist: "Corona", genre: "Eurodance" },
  { title: "Pump It", artist: "Black Eyed Peas", genre: "Hip Hop" },
  { title: "Let's Get It Started", artist: "Black Eyed Peas", genre: "Hip Hop" },
  { title: "Boom Boom Pow", artist: "Black Eyed Peas", genre: "Dance Pop" },
  { title: "Where Is The Love?", artist: "Black Eyed Peas", genre: "Pop / R&B" },
  { title: "Sugar", artist: "Maroon 5", genre: "Pop" },
  { title: "Moves Like Jagger", artist: "Maroon 5 x Christina Aguilera", genre: "Pop" },
  { title: "Locked Out of Heaven", artist: "Bruno Mars", genre: "Pop / Funk" },
  { title: "24K Magic", artist: "Bruno Mars", genre: "Funk / R&B" },
  { title: "Treasure", artist: "Bruno Mars", genre: "Disco / Funk" },
  { title: "Get Lucky", artist: "Daft Punk x Pharrell Williams", genre: "Disco / Funk" },
  { title: "Lose Yourself to Dance", artist: "Daft Punk x Pharrell Williams", genre: "Disco / Funk" },
  { title: "Safe and Sound", artist: "Capital Cities", genre: "Synth Pop" },
  { title: "Feel It Still", artist: "Portugal. The Man", genre: "Indie Pop" },
  { title: "Rather Be", artist: "Clean Bandit x Jess Glynne", genre: "Dance Pop" },
  { title: "Wake Me Up Before You Go-Go", artist: "Wham!", genre: "80s Pop" },
  { title: "Karma Chameleon", artist: "Culture Club", genre: "80s Pop" },
  { title: "Footloose", artist: "Kenny Loggins", genre: "80s Rock / Pop" },
  { title: "Celebration", artist: "Kool & The Gang", genre: "Disco / Funk" },
  { title: "Get Down On It", artist: "Kool & The Gang", genre: "Disco / Funk" },
  { title: "Boogie Wonderland", artist: "Earth, Wind & Fire", genre: "Disco" },
  { title: "Le Freak", artist: "Chic", genre: "Disco" },
  { title: "Good Times", artist: "Chic", genre: "Disco" },
  { title: "We Are Family", artist: "Sister Sledge", genre: "Disco" },
  { title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco" },
  { title: "Born to Be Alive", artist: "Patrick Hernandez", genre: "Disco" },
  { title: "Disco Inferno", artist: "The Trammps", genre: "Disco" },
  { title: "Funkytown", artist: "Lipps Inc.", genre: "Disco" },
  { title: "Hot Stuff", artist: "Donna Summer", genre: "Disco" },
  { title: "Last Dance", artist: "Donna Summer", genre: "Disco" },
  { title: "Bad Girls", artist: "Donna Summer", genre: "Disco" },
  { title: "Ring My Bell", artist: "Anita Ward", genre: "Disco" },
  { title: "Super Freak", artist: "Rick James", genre: "Funk" },
  { title: "Give It To Me Baby", artist: "Rick James", genre: "Funk" },
  { title: "Play That Funky Music", artist: "Wild Cherry", genre: "Funk / Rock" },
  { title: "Brick House", artist: "Commodores", genre: "Funk" }
];

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .trim();
};

async function main() {
  console.log("📥 Consultando catálogo actual de autocompletado en Firebase...");
  const res = await fetch(`${DB_URL}/autocomplete_songs.json`);
  if (!res.ok) {
    throw new Error(`Error de red al consultar canciones: ${res.status}`);
  }
  const currentCatalog = await res.json() || {};
  const currentCount = Object.keys(currentCatalog).length;
  console.log(`📊 Total de canciones registradas actualmente: ${currentCount}`);

  // Normalizar canciones registradas
  const registeredSet = new Set();
  Object.values(currentCatalog).forEach(song => {
    if (song && song.title) {
      const key = `${normalizeString(song.title)}|${normalizeString(song.artist)}`;
      registeredSet.add(key);
    }
  });

  // Filtrar candidatos
  const toAdd = [];
  let needed = 100;
  for (const candidate of CANDIDATES) {
    const key = `${normalizeString(candidate.title)}|${normalizeString(candidate.artist)}`;
    if (!registeredSet.has(key)) {
      toAdd.push(candidate);
    }
    if (toAdd.length === needed) {
      break;
    }
  }

  console.log(`✨ Candidatos únicos no registrados encontrados: ${toAdd.length}`);
  if (toAdd.length < needed) {
    console.warn(`⚠️ Solo se encontraron ${toAdd.length} canciones únicas no registradas de la lista de candidatos.`);
  }

  if (toAdd.length === 0) {
    console.log("✅ Todas las canciones ya están registradas.");
    return;
  }

  // Generar IDs e insertar en un solo parche
  console.log(`🚀 Agregando canciones al catálogo global de autocompletado...`);
  const patchBody = {};
  for (let i = 0; i < toAdd.length; i++) {
    const song = toAdd[i];
    const fakePushId = `-Ovn_party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    patchBody[fakePushId] = {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      globalRequests: 1
    };
  }

  const patchRes = await fetch(`${DB_URL}/autocomplete_songs.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchBody)
  });

  if (patchRes.ok) {
    console.log(`\n🎉 ¡Se agregaron con éxito ${toAdd.length} canciones al catálogo de autocompletado!`);
    const newTotalRes = await fetch(`${DB_URL}/autocomplete_songs.json`);
    const newCatalog = await newTotalRes.json() || {};
    console.log(`📊 Nuevo total de canciones en base de datos: ${Object.keys(newCatalog).length}`);
  } else {
    throw new Error(`Error al insertar canciones: ${patchRes.status} - ${await patchRes.text()}`);
  }
}

main().catch(err => {
  console.error("❌ Error en la ejecución:", err);
  process.exit(1);
});
