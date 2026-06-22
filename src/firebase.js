import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignIn, 
  signOut as realSignOut, 
  onAuthStateChanged as realAuthChanged,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  getDatabase, 
  ref as realDbRef, 
  onValue as realOnValue, 
  push as realPush, 
  set as realSet, 
  update as realUpdate, 
  remove as realRemove,
  off as realOff,
  get as realGet
} from 'firebase/database';
import {
  getStorage,
  ref as realStorageRef,
  uploadBytes as realUploadBytes,
  getDownloadURL as realGetDownloadURL
} from 'firebase/storage';

// -------------------------------------------------------------
// 1. VERIFICACIÓN DE CONFIGURACIÓN Y MODO DUAL
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Si falta la API Key, entra en modo MOCK local
const isMockMode = !firebaseConfig.apiKey;

if (isMockMode) {
  console.warn("⚠️ Firebase credentials missing. Running in local MOCK mode (Multi-user, per-account isolation).");
}

let app, auth, database, storage;

if (!isMockMode) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
} else {
  app = {};
  auth = { currentUser: null };
  database = {};
  storage = {};
}

// Canal para sincronizar pestañas locales en tiempo real
const syncChannel = isMockMode ? new BroadcastChannel('firebase-rtdb-sync') : null;

export { auth, database, storage, isMockMode, firebaseConfig, syncChannel };

// -------------------------------------------------------------
// 2. MOCK FIREBASE — IMPLEMENTACIÓN CON LOCALSTORAGE Y BROADCASTCHANNEL
//    Arquitectura: users/{uid}/events/{eventId}/...
// -------------------------------------------------------------

// Cuentas de prueba disponibles en modo mock (cargadas dinámicamente)
const DEFAULT_MOCK_ACCOUNTS = [
  { email: 'dj@admin.com', password: 'admin123', uid: 'uid-admin-master', displayName: 'DJ Administrador Master', isAdmin: true },
  { email: 'dj1@dj.com',   password: 'dj123',    uid: 'uid-dj1',          displayName: 'DJ MasterMix', isAdmin: false },
  { email: 'dj2@dj.com',   password: 'dj456',    uid: 'uid-dj2',          displayName: 'DJ Neon Vibes', isAdmin: false },
  { email: 'demo@dj.com',  password: 'demo123',  uid: 'uid-demo',         displayName: 'DJ Demo', isAdmin: false }
];

const savedAccounts = localStorage.getItem('mock_accounts');
let finalMockAccounts = DEFAULT_MOCK_ACCOUNTS;
if (savedAccounts) {
  try {
    const parsed = JSON.parse(savedAccounts);
    const hasDemo = parsed.some(a => a.email === 'demo@dj.com');
    if (!hasDemo) {
      parsed.push({ email: 'demo@dj.com', password: 'demo123', uid: 'uid-demo', displayName: 'DJ Demo', isAdmin: false });
      localStorage.setItem('mock_accounts', JSON.stringify(parsed));
    }
    finalMockAccounts = parsed;
  } catch (e) {
    localStorage.setItem('mock_accounts', JSON.stringify(DEFAULT_MOCK_ACCOUNTS));
  }
} else {
  localStorage.setItem('mock_accounts', JSON.stringify(DEFAULT_MOCK_ACCOUNTS));
}

export const MOCK_ACCOUNTS = finalMockAccounts;

// Email del administrador master (sin importar si es real o mock)
export const MASTER_ADMIN_EMAIL = 'dj@admin.com';

// Semilla inicial de canciones para autocompletado
export const INITIAL_AUTOCOMPLETE = [
  { id: '1', title: "17 Años", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '2', title: "El Listón de Tu Pelo", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '3', title: "Cómo Te Voy a Olvidar", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '4', title: "Mis Sentimientos", artist: "Los Ángeles Azules x Ximena Sariñana", genre: "Cumbia" },
  { id: '5', title: "Mi Niña Mujer", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '6', title: "Entrega de Amor", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '7', title: "Las Maravillas de la Vida", artist: "Los Ángeles Azules x Lalo Ebratt", genre: "Cumbia" },
  { id: '8', title: "Nunca Es Suficiente", artist: "Los Ángeles Azules x Natalia Lafourcade", genre: "Cumbia" },
  { id: '9', title: "Amor A Primera Vista", artist: "Los Ángeles Azules x Belinda x Lalo Ebratt", genre: "Cumbia" },
  { id: '10', title: "El Pecado", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '11', title: "20 Rosas", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '12', title: "Cumbia del Infinito", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '13', title: "Acaríñame", artist: "Los Ángeles Azules x Julieta Venegas", genre: "Cumbia" },
  { id: '14', title: "Cumbia Para Cantar", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '15', title: "Hay Amor", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { id: '16', title: "Como La Flor", artist: "Selena", genre: "Cumbia" },
  { id: '17', title: "Amor Prohibido", artist: "Selena", genre: "Cumbia" },
  { id: '18', title: "Bidi Bidi Bom Bom", artist: "Selena", genre: "Cumbia" },
  { id: '19', title: "El Chico del Apartamento 512", artist: "Selena", genre: "Cumbia" },
  { id: '20', title: "Si Una Vez", artist: "Selena", genre: "Cumbia" },
  { id: '21', title: "No Me Queda Más", artist: "Selena", genre: "Cumbia" },
  { id: '22', title: "La Carcacha", artist: "Selena", genre: "Cumbia" },
  { id: '23', title: "Techno Cumbia", artist: "Selena", genre: "Cumbia" },
  { id: '24', title: "Baila Esta Cumbia", artist: "Selena", genre: "Cumbia" },
  { id: '25', title: "Fotos y Recuerdos", artist: "Selena", genre: "Cumbia" },
  { id: '26', title: "Que Nadie Sepa Mi Sufrir", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '27', title: "Mi Cucu", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '28', title: "Escándalo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '29', title: "Oye", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '30', title: "El Viejo del Sombrerón", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '31', title: "Se Me Perdió la Cadenita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '32', title: "La Parabólica", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '33', title: "La Cortina", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '34', title: "Maruja", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '35', title: "La Pollera Colorá", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '36', title: "Capullo y Sorullo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '37', title: "Mil Horas", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '38', title: "A Mover la Colita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '39', title: "El Africano", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '40', title: "La Suavecita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '41', title: "Mete y Saca", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '42', title: "Sola con mi Soledad", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '43', title: "Cumbia de la Cadenita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '44', title: "Amor de mis Amores", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { id: '45', title: "Tiene Espinas el Rosal", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '46', title: "No Te Voy a Perdonar", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '47', title: "Echarme al Olvido", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '48', title: "Hasta el Cielo Sentirás", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '49', title: "Pipiripau", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '50', title: "El Campanero", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '51', title: "Cinco Minutos", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '52', title: "Palacio de Amor", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '53', title: "La Ladrona", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '54', title: "Traición y Olvido", artist: "Grupo Cañaveral", genre: "Cumbia" },
  { id: '55', title: "Mi Dulce Niña", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '56', title: "Sabes a Chocolate", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '57', title: "Na Na Na (Dulce Niña)", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '58', title: "Fuego", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '59', title: "Te Quiero A Ti", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '60', title: "Shhh!", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '61', title: "Boom Boom", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '62', title: "Azúcar", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '63', title: "Pachuco", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '64', title: "Desde Que No Estás Aquí", artist: "Kumbia Kings", genre: "Cumbia" },
  { id: '65', title: "Que Bello", artist: "Margarita la Diosa de la Cumbia", genre: "Cumbia" },
  { id: '66', title: "Mi Bombón", artist: "Margarita la Diosa de la Cumbia", genre: "Cumbia" },
  { id: '67', title: "Colegiala", artist: "Margarita la Diosa de la Cumbia", genre: "Cumbia" },
  { id: '68', title: "Aunque No Sea Conmigo", artist: "Celso Piña x Café Tacvba", genre: "Cumbia" },
  { id: '69', title: "Cumbia Sobre el Río", artist: "Celso Piña x Control Machete", genre: "Cumbia" },
  { id: '70', title: "Los Caminos de la Vida", artist: "Celso Piña", genre: "Cumbia" },
  { id: '71', title: "Reina de Cumbias", artist: "Celso Piña", genre: "Cumbia" },
  { id: '72', title: "Juana La Cubana", artist: "Fito Olivares", genre: "Cumbia" },
  { id: '73', title: "El Colesterol", artist: "Fito Olivares", genre: "Cumbia" },
  { id: '74', title: "La Güera Salomé", artist: "Fito Olivares", genre: "Cumbia" },
  { id: '75', title: "Desvelado", artist: "Bobby Pulido", genre: "Cumbia / Tejano" },
  { id: '76', title: "Se Murió de Amor", artist: "Bobby Pulido", genre: "Cumbia / Tejano" },
  { id: '77', title: "Llegaste a Mi Vida", artist: "Bobby Pulido", genre: "Cumbia / Tejano" },
  { id: '78', title: "Muchachita Consentida", artist: "Rayito Colombiano", genre: "Cumbia" },
  { id: '79', title: "Besar Tu Piel", artist: "Rayito Colombiano", genre: "Cumbia" },
  { id: '80', title: "Al Despertar", artist: "Rayito Colombiano", genre: "Cumbia" },
  { id: '81', title: "¡Ay! El Amor", artist: "Los Askis", genre: "Cumbia" },
  { id: '82', title: "Cumbia Azteca", artist: "Los Askis", genre: "Cumbia" },
  { id: '83', title: "Amor Regresa", artist: "Los Askis", genre: "Cumbia" },
  { id: '84', title: "¿Quién Pompo?", artist: "Chico Che y La Crisis", genre: "Cumbia" },
  { id: '85', title: "De Quén Chon", artist: "Chico Che y La Crisis", genre: "Cumbia" },
  { id: '86', title: "Llorar y Llorar", artist: "Los Socios del Ritmo", genre: "Cumbia" },
  { id: '87', title: "Felicidad", artist: "Los Socios del Ritmo", genre: "Cumbia" },
  { id: '88', title: "El Año Viejo", artist: "Tony Camargo", genre: "Tropical / Cumbia" },
  { id: '89', title: "La Boa", artist: "La Sonora Santanera", genre: "Tropical / Cumbia" },
  { id: '90', title: "Perfume de Gardenias", artist: "La Sonora Santanera", genre: "Tropical / Cumbia" },
  { id: '91', title: "Luces de Nueva York", artist: "La Sonora Santanera", genre: "Tropical / Cumbia" },
  { id: '92', title: "El Ladrón", artist: "La Sonora Santanera", genre: "Tropical / Cumbia" },
  { id: '93', title: "Sergio el Bailador", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '94', title: "Que No Quede Huella", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '95', title: "Oro", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '96', title: "Con Zapatos de Tacón", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '97', title: "Adoro", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '98', title: "Dos Mujeres Un Camino", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '99', title: "Libros Tontos", artist: "Bronco", genre: "Regional Mexicano" },
  { id: '100', title: "La Chona", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '101', title: "El Tucanazo", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '102', title: "Espejeando", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '103', title: "Amor Platónico", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '104', title: "Me Gusta Vivir de Noche", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '105', title: "El Centenario", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { id: '106', title: "La Puerta Negra", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '107', title: "La Mesa del Rincón", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '108', title: "Jefe de Jefes", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '109', title: "Golpes en el Corazón", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '110', title: "Ni Parientes Somos", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '111', title: "Pedro y Pablo", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '112', title: "Directo al Corazón", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '113', title: "La Jaula de Oro", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '114', title: "La Manzanita", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { id: '115', title: "El Rey", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '116', title: "Hermoso Cariño", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '117', title: "Volver Volver", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '118', title: "Acá Entre Nos", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '119', title: "Mujeres Divinas", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '120', title: "Por Tu Maldito Amor", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '121', title: "Estos Celos", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { id: '122', title: "Me Dediqué a Perderte", artist: "Alejandro Fernández", genre: "Pop / Mariachi" },
  { id: '123', title: "Como Quien Pierde Una Estrella", artist: "Alejandro Fernández", genre: "Mariachi" },
  { id: '124', title: "Mátalas", artist: "Alejandro Fernández", genre: "Mariachi" },
  { id: '125', title: "Nube Viajera", artist: "Alejandro Fernández", genre: "Mariachi" },
  { id: '126', title: "Caballero", artist: "Alejandro Fernández", genre: "Mariachi" },
  { id: '127', title: "Adiós Amor", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { id: '128', title: "De Los Besos Que Te Di", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { id: '129', title: "No Te Contaron Mal", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { id: '130', title: "Probablemente", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { id: '131', title: "Botella Tras Botella", artist: "Gera MX x Christian Nodal", genre: "Regional Mexicano" },
  { id: '132', title: "La Boda del Huitlacoche", artist: "Carin León", genre: "Regional Mexicano" },
  { id: '133', title: "Primera Cita", artist: "Carin León", genre: "Regional Mexicano" },
  { id: '134', title: "Que Vuelvas", artist: "Carin León x Grupo Frontera", genre: "Regional Mexicano" },
  { id: '135', title: "Secuelas de Amor", artist: "Carin León", genre: "Regional Mexicano" },
  { id: '136', title: "El Tóxico", artist: "Grupo Firme x Carin León", genre: "Regional Mexicano" },
  { id: '137', title: "El Color de Tus Ojos", artist: "Banda MS", genre: "Regional Mexicano" },
  { id: '138', title: "Mi Mayor Anhelo", artist: "Banda MS", genre: "Regional Mexicano" },
  { id: '139', title: "Hermosa Experiencia", artist: "Banda MS", genre: "Regional Mexicano" },
  { id: '140', title: "Háblame de Ti", artist: "Banda MS", genre: "Regional Mexicano" },
  { id: '141', title: "Me Vas a Extrañar", artist: "Banda MS", genre: "Regional Mexicano" },
  { id: '142', title: "El Ruido de Tus Zapatos", artist: "La Arrolladora Banda El Limón", genre: "Regional Mexicano" },
  { id: '143', title: "Llamada de Mi Ex", artist: "La Arrolladora Banda El Limón", genre: "Regional Mexicano" },
  { id: '144', title: "La Calabaza", artist: "La Arrolladora Banda El Limón", genre: "Regional Mexicano" },
  { id: '145', title: "Sobre Mis Pies", artist: "La Arrolladora Banda El Limón", genre: "Regional Mexicano" },
  { id: '146', title: "Te Presumo", artist: "Banda El Recodo", genre: "Regional Mexicano" },
  { id: '147', title: "Y Llegaste Tú", artist: "Banda El Recodo", genre: "Regional Mexicano" },
  { id: '148', title: "La Mejor de Todas", artist: "Banda El Recodo", genre: "Regional Mexicano" },
  { id: '149', title: "Vas a Llorar por Mí", artist: "Banda El Recodo", genre: "Regional Mexicano" },
  { id: '150', title: "Terrenal", artist: "Julión Álvarez y su Norteño Banda", genre: "Regional Mexicano" },
  { id: '151', title: "Te Hubieras Ido Antes", artist: "Julión Álvarez", genre: "Regional Mexicano" },
  { id: '152', title: "Y Fue Así", artist: "Julión Álvarez", genre: "Regional Mexicano" },
  { id: '153', title: "Afuera Está Lloviendo", artist: "Julión Álvarez", genre: "Regional Mexicano" },
  { id: '154', title: "Márchate", artist: "Julión Álvarez", genre: "Regional Mexicano" },
  { id: '155', title: "No Se Va", artist: "Grupo Frontera", genre: "Regional Mexicano" },
  { id: '156', title: "un x100to", artist: "Grupo Frontera x Bad Bunny", genre: "Regional / Urbano" },
  { id: '157', title: "Tulum", artist: "Peso Pluma x Grupo Frontera", genre: "Regional Mexicano" },
  { id: '158', title: "Ya Superame", artist: "Grupo Firme", genre: "Regional Mexicano" },
  { id: '159', title: "Cada Quien", artist: "Grupo Firme x Maluma", genre: "Regional Mexicano" },
  { id: '160', title: "El Amor No Fue Pa Mí", artist: "Grupo Firme", genre: "Regional Mexicano" },
  { id: '161', title: "Ella Baila Sola", artist: "Eslabon Armado x Peso Pluma", genre: "Regional Mexicano" },
  { id: '162', title: "Lady Gaga", artist: "Peso Pluma x Gabito Ballesteros", genre: "Regional Mexicano" },
  { id: '163', title: "PRC", artist: "Peso Pluma x Natanael Cano", genre: "Corridos Tumbados" },
  { id: '164', title: "AMG", artist: "Natanael Cano x Peso Pluma x Gabito Ballesteros", genre: "Corridos Tumbados" },
  { id: '165', title: "Tatuajes", artist: "Joan Sebastian", genre: "Regional / Balada" },
  { id: '166', title: "Secreto de Amor", artist: "Joan Sebastian", genre: "Regional / Balada" },
  { id: '167', title: "Sentimental", artist: "Joan Sebastian", genre: "Regional / Balada" },
  { id: '168', title: "Rumores", artist: "Joan Sebastian", genre: "Regional / Balada" },
  { id: '169', title: "Eso y Más", artist: "Joan Sebastian", genre: "Regional / Balada" },
  { id: '170', title: "Si No Te Hubieras Ido", artist: "Marco Antonio Solís", genre: "Pop / Balada" },
  { id: '171', title: "Más Que Tu Amigo", artist: "Marco Antonio Solís", genre: "Regional / Cumbia" },
  { id: '172', title: "Mi Fantasía", artist: "Los Bukis", genre: "Regional / Balada" },
  { id: '173', title: "Tu Cárcel", artist: "Los Bukis", genre: "Regional / Balada" },
  { id: '174', title: "Y Todo Para Qué", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '175', title: "Fuerte No Soy", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '176', title: "Sueña", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '177', title: "Coqueta", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '178', title: "Eres Mi Droga", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '179', title: "Alguien Te Va a Hacer Llorar", artist: "Intocable", genre: "Norteño / Tejano" },
  { id: '180', title: "La Chacalosa", artist: "Jenni Rivera", genre: "Regional Mexicano" },
  { id: '181', title: "Inolvidable", artist: "Jenni Rivera", genre: "Regional Mexicano" },
  { id: '182', title: "Basta Ya", artist: "Jenni Rivera", genre: "Regional Mexicano" },
  { id: '183', title: "Mi Olvido", artist: "Banda El Limón", genre: "Regional Mexicano" },
  { id: '184', title: "Alineando Cabritos", artist: "Los Cardenales de Nuevo León", genre: "Regional Mexicano" },
  { id: '185', title: "Mi Cómplice", artist: "Los Cardenales de Nuevo León", genre: "Regional Mexicano" },
  { id: '186', title: "Belleza de Cantina", artist: "Los Cardenales de Nuevo León", genre: "Regional Mexicano" },
  { id: '187', title: "Las Mañanitas", artist: "Mariachi Vargas", genre: "Mariachi / Cumpleaños" },
  { id: '188', title: "La Bikina", artist: "Luis Miguel x Mariachi", genre: "Mariachi / Pop" },
  { id: '189', title: "Sabes Una Cosa", artist: "Luis Miguel x Mariachi", genre: "Mariachi" },
  { id: '190', title: "Lamento Boliviano", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { id: '191', title: "La Muralla Verde", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { id: '192', title: "Guerras de Amor", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { id: '193', title: "Tus Viejas Cartas", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { id: '194', title: "Te Vi En Un Tren", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { id: '195', title: "Rayando el Sol", artist: "Maná", genre: "Rock en Español" },
  { id: '196', title: "Oye Mi Amor", artist: "Maná", genre: "Rock en Español" },
  { id: '197', title: "Clavado En Un Bar", artist: "Maná", genre: "Rock en Español" },
  { id: '198', title: "En El Muelle de San Blas", artist: "Maná", genre: "Rock en Español" },
  { id: '199', title: "Labios Compartidos", artist: "Maná", genre: "Rock en Español" },
  { id: '200', title: "Mariposa Traicionera", artist: "Maná", genre: "Rock en Español" },
  { id: '201', title: "Afuera", artist: "Caifanes", genre: "Rock en Español" },
  { id: '202', title: "La Célula Que Explota", artist: "Caifanes", genre: "Rock en Español" },
  { id: '203', title: "Viento", artist: "Caifanes", genre: "Rock en Español" },
  { id: '204', title: "Nubes", artist: "Caifanes", genre: "Rock en Español" },
  { id: '205', title: "No Dejes Que...", artist: "Caifanes", genre: "Rock en Español" },
  { id: '206', title: "La Negra Tomasa", artist: "Caifanes", genre: "Rock / Cumbia" },
  { id: '207', title: "Música Ligera", artist: "Soda Stereo", genre: "Rock en Español" },
  { id: '208', title: "Persiana Americana", artist: "Soda Stereo", genre: "Rock en Español" },
  { id: '209', title: "Nada Personal", artist: "Soda Stereo", genre: "Rock en Español" },
  { id: '210', title: "Cuando Pase el Temblor", artist: "Soda Stereo", genre: "Rock en Español" },
  { id: '211', title: "Devuélveme a mi Chica", artist: "Hombres G", genre: "Rock en Español" },
  { id: '212', title: "El Ataque de las Chicas Cocodrilo", artist: "Hombres G", genre: "Rock en Español" },
  { id: '213', title: "Venezia", artist: "Hombres G", genre: "Rock en Español" },
  { id: '214', title: "Te Quiero", artist: "Hombres G", genre: "Rock en Español" },
  { id: '215', title: "Ingrata", artist: "Café Tacvba", genre: "Rock en Español" },
  { id: '216', title: "Las Flores", artist: "Café Tacvba", genre: "Rock en Español" },
  { id: '217', title: "El Baile y el Salón", artist: "Café Tacvba", genre: "Rock en Español" },
  { id: '218', title: "Chilanga Banda", artist: "Café Tacvba", genre: "Rock en Español" },
  { id: '219', title: "Eres", artist: "Café Tacvba", genre: "Rock en Español" },
  { id: '220', title: "La Dosis Perfecta", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { id: '221', title: "La Carencia", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { id: '222', title: "Vendedora de Caricias", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { id: '223', title: "Acábame de Matar", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { id: '224', title: "Amargo Adiós", artist: "Inspector", genre: "Ska" },
  { id: '225', title: "Amnesia", artist: "Inspector", genre: "Ska" },
  { id: '226', title: "Y Qué", artist: "Inspector", genre: "Ska" },
  { id: '227', title: "Chuntaro Style", artist: "El Gran Silencio", genre: "Ska / Cumbia" },
  { id: '228', title: "Dormir Soñando", artist: "El Gran Silencio", genre: "Ska" },
  { id: '229', title: "Matador", artist: "Los Fabulosos Cadillacs", genre: "Rock / Ska" },
  { id: '230', title: "Vasos Vacíos", artist: "Los Fabulosos Cadillacs x Celia Cruz", genre: "Rock / Ska" },
  { id: '231', title: "Siguiendo la Luna", artist: "Los Fabulosos Cadillacs", genre: "Rock / Ska" },
  { id: '232', title: "Mal Bicho", artist: "Los Fabulosos Cadillacs", genre: "Rock / Ska" },
  { id: '233', title: "El Loco", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" },
  { id: '234', title: "La Guitarra", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" },
  { id: '235', title: "Loco (Tu Forma de Ser)", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" },
  { id: '236', title: "Corazón", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" },
  { id: '237', title: "Osito de Peluche de Taiwán", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" },
  { id: '238', title: "Gimme Tha Power", artist: "Molotov", genre: "Rock en Español" },
  { id: '239', title: "Frijolero", artist: "Molotov", genre: "Rock en Español" },
  { id: '240', title: "Rastamandita", artist: "Molotov", genre: "Rock en Español" },
  { id: '241', title: "Amateur", artist: "Molotov", genre: "Rock en Español" },
  { id: '242', title: "Kumbala", artist: "La Maldita Vecindad", genre: "Rock / Ska" },
  { id: '243', title: "Pachuco", artist: "La Maldita Vecindad", genre: "Rock / Ska" },
  { id: '244', title: "Solín", artist: "La Maldita Vecindad", genre: "Rock / Ska" },
  { id: '245', title: "Microbito", artist: "Fobia", genre: "Rock en Español" },
  { id: '246', title: "Veneno Vil", artist: "Fobia", genre: "Rock en Español" },
  { id: '247', title: "El Diablo", artist: "Fobia", genre: "Rock en Español" },
  { id: '248', title: "Es Tan Fácil Romper un Corazón", artist: "Miguel Mateos", genre: "Rock en Español" },
  { id: '249', title: "Cuando Seas Grande", artist: "Miguel Mateos", genre: "Rock en Español" },
  { id: '250', title: "Lobo Hombre en París", artist: "La Unión", genre: "Rock en Español" },
  { id: '251', title: "En Algún Lugar", artist: "Duncan Dhu", genre: "Rock en Español" },
  { id: '252', title: "La Flaca", artist: "Jarabe de Palo", genre: "Rock en Español" },
  { id: '253', title: "Depende", artist: "Jarabe de Palo", genre: "Rock en Español" },
  { id: '254', title: "Bonito", artist: "Jarabe de Palo", genre: "Rock en Español" },
  { id: '255', title: "Afueras de la Ciudad", artist: "Zoe", genre: "Rock en Español" },
  { id: '256', title: "Labios Rotos", artist: "Zoe", genre: "Rock en Español" },
  { id: '257', title: "Soñé", artist: "Zoe", genre: "Rock en Español" },
  { id: '258', title: "Ahora Te Puedes Marchar", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '259', title: "La Chica del Bikini Azul", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '260', title: "Cuando Calienta el Sol", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '261', title: "Suave", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '262', title: "Será Que No Me Amas", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '263', title: "Isabel", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '264', title: "Culpable o No", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '265', title: "Fría Como el Viento", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '266', title: "La Incondicional", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '267', title: "Entrégate", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '268', title: "Tengo Todo Excepto a Ti", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '269', title: "Hasta Que Me Olvides", artist: "Luis Miguel", genre: "Pop / Balada" },
  { id: '270', title: "Un Hombre Busca Una Mujer", artist: "Luis Miguel", genre: "Pop Latino" },
  { id: '271', title: "No Sé Tú", artist: "Luis Miguel", genre: "Pop / Bolero" },
  { id: '272', title: "El Noa Noa", artist: "Juan Gabriel", genre: "Pop Latino" },
  { id: '273', title: "Querida", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { id: '274', title: "Caray", artist: "Juan Gabriel", genre: "Pop / Regional" },
  { id: '275', title: "Me Nace del Corazón", artist: "Juan Gabriel", genre: "Mariachi / Regional" },
  { id: '276', title: "Pero Qué Necesidad", artist: "Juan Gabriel", genre: "Pop Latino" },
  { id: '277', title: "Te Lo Pido Por Favor", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { id: '278', title: "Abrázame Muy Fuerte", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { id: '279', title: "Hasta Que Te Conocí", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { id: '280', title: "Así Fue", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { id: '281', title: "Torero", artist: "Chayanne", genre: "Pop Latino" },
  { id: '282', title: "Provócame", artist: "Chayanne", genre: "Pop Latino" },
  { id: '283', title: "Salomé", artist: "Chayanne", genre: "Pop Latino" },
  { id: '284', title: "Dejaría Todo", artist: "Chayanne", genre: "Pop / Balada" },
  { id: '285', title: "Un Siglo Sin Ti", artist: "Chayanne", genre: "Pop / Balada" },
  { id: '286', title: "Azul", artist: "Cristian Castro", genre: "Pop Latino" },
  { id: '287', title: "No Podrás", artist: "Cristian Castro", genre: "Pop Latino" },
  { id: '288', title: "Lloviendo Estrellas", artist: "Cristian Castro", genre: "Pop Latino" },
  { id: '289', title: "Es Mejor Así", artist: "Cristian Castro", genre: "Pop Latino" },
  { id: '290', title: "Gallito Feliz", artist: "Cristian Castro", genre: "Pop Latino" },
  { id: '291', title: "La Chica de Humo", artist: "Emmanuel", genre: "Pop Latino" },
  { id: '292', title: "Toda La Vida", artist: "Emmanuel", genre: "Pop Latino" },
  { id: '293', title: "Bella Señora", artist: "Emmanuel", genre: "Pop Latino" },
  { id: '294', title: "Soldado del Amor", artist: "Mijares", genre: "Pop Latino" },
  { id: '295', title: "Para Amarnos Más", artist: "Mijares", genre: "Pop / Balada" },
  { id: '296', title: "El Privilegio de Amar", artist: "Mijares x Lucero", genre: "Pop / Balada" },
  { id: '297', title: "Baño de Mujeres", artist: "Mijares", genre: "Pop Latino" },
  { id: '298', title: "Maldita Primavera", artist: "Yuri", genre: "Pop Latino" },
  { id: '299', title: "El Apagón", artist: "Yuri", genre: "Pop Latino" },
  { id: '300', title: "Detrás de Mi Ventana", artist: "Yuri", genre: "Pop / Balada" },
  { id: '301', title: "Hombres al Borde de un Ataque de Celos", artist: "Yuri", genre: "Pop Latino" },
  { id: '302', title: "Con Todos Menos Conmigo", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '303', title: "Tú y Yo Somos Uno Mismo", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '304', title: "Correr Tras el Viento", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '305', title: "Princesa Tibetana", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '306', title: "Besos de Ceniza", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '307', title: "No Sé Si Es Amor", artist: "Timbiriche", genre: "Pop Latino" },
  { id: '308', title: "Bazar", artist: "Flans", genre: "Pop Latino" },
  { id: '309', title: "No Controles", artist: "Flans", genre: "Pop Latino" },
  { id: '310', title: "Las Mil y Una Noches", artist: "Flans", genre: "Pop Latino" },
  { id: '311', title: "Cómo Te Va Mi Amor", artist: "Pandora", genre: "Pop Latino" },
  { id: '312', title: "La Calle de las Sirenas", artist: "Kabah", genre: "Pop Latino" },
  { id: '313', title: "Al Pasito", artist: "Kabah", genre: "Pop Latino" },
  { id: '314', title: "Mai Mai", artist: "Kabah", genre: "Pop Latino" },
  { id: '315', title: "Shabadabada", artist: "OV7", genre: "Pop Latino" },
  { id: '316', title: "Enloquéceme", artist: "OV7", genre: "Pop Latino" },
  { id: '317', title: "Te Quiero Tanto, Tanto", artist: "OV7", genre: "Pop Latino" },
  { id: '318', title: "Mírame a los Ojos", artist: "OV7", genre: "Pop Latino" },
  { id: '319', title: "Vuela Vuela", artist: "Magneto", genre: "Pop Latino" },
  { id: '320', title: "Azúcar Amargo", artist: "Fey", genre: "Pop Latino" },
  { id: '321', title: "Media Naranja", artist: "Fey", genre: "Pop Latino" },
  { id: '322', title: "Muévelo", artist: "Fey", genre: "Pop Latino" },
  { id: '323', title: "Hips Don't Lie", artist: "Shakira x Wyclef Jean", genre: "Pop Latino / Urbano" },
  { id: '324', title: "Antología", artist: "Shakira", genre: "Pop / Balada" },
  { id: '325', title: "Ciega, Sordomuda", artist: "Shakira", genre: "Pop Latino" },
  { id: '326', title: "Suerte (Whenever, Wherever)", artist: "Shakira", genre: "Pop Latino" },
  { id: '327', title: "Inevitable", artist: "Shakira", genre: "Pop Latino" },
  { id: '328', title: "Ojos Así", artist: "Shakira", genre: "Pop Latino" },
  { id: '329', title: "Waka Waka (This Time for Africa)", artist: "Shakira", genre: "Pop / Dance" },
  { id: '330', title: "Las de la Intuición", artist: "Shakira", genre: "Pop Latino" },
  { id: '331', title: "Shakira: Bzrp Music Sessions, Vol. 53", artist: "Bizarrap x Shakira", genre: "Pop / Urbano" },
  { id: '332', title: "Y Yo Sigo Aquí", artist: "Paulina Rubio", genre: "Pop Latino" },
  { id: '333', title: "El Último Adiós", artist: "Paulina Rubio", genre: "Pop Latino" },
  { id: '334', title: "Ni Una Sola Palabra", artist: "Paulina Rubio", genre: "Pop Latino" },
  { id: '335', title: "Amor a la Mexicana", artist: "Thalía", genre: "Pop Latino" },
  { id: '336', title: "Piel Morena", artist: "Thalía", genre: "Pop Latino" },
  { id: '337', title: "Arrasando", artist: "Thalía", genre: "Pop Latino" },
  { id: '338', title: "Sálvame", artist: "RBD", genre: "Pop Latino" },
  { id: '339', title: "Rebelde", artist: "RBD", genre: "Pop Latino" },
  { id: '340', title: "Solo Quédate En Silencio", artist: "RBD", genre: "Pop Latino" },
  { id: '341', title: "Tras De Mí", artist: "RBD", genre: "Pop Latino" },
  { id: '342', title: "Nuestro Amor", artist: "RBD", genre: "Pop Latino" },
  { id: '343', title: "Livin' la Vida Loca", artist: "Ricky Martin", genre: "Pop Latino" },
  { id: '344', title: "La Copa de la Vida", artist: "Ricky Martin", genre: "Pop Latino" },
  { id: '345', title: "Pégate", artist: "Ricky Martin", genre: "Pop Latino" },
  { id: '346', title: "María", artist: "Ricky Martin", genre: "Pop Latino" },
  { id: '347', title: "Dr. Psiquiatra", artist: "Gloria Trevi", genre: "Pop Latino" },
  { id: '348', title: "Todos Me Miran", artist: "Gloria Trevi", genre: "Pop Latino" },
  { id: '349', title: "Con los Ojos Cerrados", artist: "Gloria Trevi", genre: "Pop / Balada" },
  { id: '350', title: "Cinco Minutos", artist: "Gloria Trevi", genre: "Pop Latino" },
  { id: '351', title: "Gasolina", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '352', title: "Pelo Suelto", artist: "Gloria Trevi", genre: "Pop Latino" },
  { id: '353', title: "Gasolina", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '354', title: "Lo Que Pasó, Pasó", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '355', title: "Rompe", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '356', title: "Llamado de Emergencia", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '357', title: "Limbo", artist: "Daddy Yankee", genre: "Reggaetón / Pop" },
  { id: '358', title: "Danza Kuduro", artist: "Don Omar x Lucenzo", genre: "Urbano / Dance" },
  { id: '359', title: "Dile", artist: "Don Omar", genre: "Reggaetón" },
  { id: '360', title: "Pobre Diabla", artist: "Don Omar", genre: "Reggaetón" },
  { id: '361', title: "Salió El Sol", artist: "Don Omar", genre: "Reggaetón" },
  { id: '362', title: "Virtual Diva", artist: "Don Omar", genre: "Reggaetón" },
  { id: '363', title: "Rakata", artist: "Wisin & Yandel", genre: "Reggaetón" },
  { id: '364', title: "Pam Pam", artist: "Wisin & Yandel", genre: "Reggaetón" },
  { id: '365', title: "Sexy Movimiento", artist: "Wisin & Yandel", genre: "Reggaetón" },
  { id: '366', title: "Abusadora", artist: "Wisin & Yandel", genre: "Reggaetón" },
  { id: '367', title: "Algo Me Gusta De Ti", artist: "Wisin & Yandel x Chris Brown", genre: "Reggaetón / Pop" },
  { id: '368', title: "Noche de Entierro", artist: "Wisin & Yandel x Daddy Yankee", genre: "Reggaetón" },
  { id: '369', title: "Mayor Que Yo", artist: "Wisin & Yandel x Daddy Yankee x Baby Ranks", genre: "Reggaetón" },
  { id: '370', title: "Me Porto Bonito", artist: "Bad Bunny x Chencho Corleone", genre: "Reggaetón" },
  { id: '371', title: "Tití Me Preguntó", artist: "Bad Bunny", genre: "Reggaetón" },
  { id: '372', title: "Callaita", artist: "Bad Bunny", genre: "Reggaetón" },
  { id: '373', title: "Dakiti", artist: "Bad Bunny x Jhay Cortez", genre: "Reggaetón / Synth" },
  { id: '374', title: "Safaera", artist: "Bad Bunny x Jowell & Randy", genre: "Reggaetón" },
  { id: '375', title: "Yo Perreo Sola", artist: "Bad Bunny", genre: "Reggaetón" },
  { id: '376', title: "La Canción", artist: "J Balvin x Bad Bunny", genre: "Reggaetón" },
  { id: '377', title: "Ojitos Lindos", artist: "Bad Bunny x Bomba Estéreo", genre: "Reggaetón / Pop" },
  { id: '378', title: "Tusa", artist: "Karol G x Nicki Minaj", genre: "Reggaetón" },
  { id: '379', title: "Bichota", artist: "Karol G", genre: "Reggaetón" },
  { id: '380', title: "Provenza", artist: "Karol G", genre: "Reggaetón" },
  { id: '381', title: "TQG", artist: "Karol G x Shakira", genre: "Reggaetón" },
  { id: '382', title: "Mi Gente", artist: "J Balvin x Willy William", genre: "Urbano" },
  { id: '383', title: "Ginza", artist: "J Balvin", genre: "Reggaetón" },
  { id: '384', title: "Safari", artist: "J Balvin x Pharrell Williams", genre: "Reggaetón" },
  { id: '385', title: "Felices los 4", artist: "Maluma", genre: "Reggaetón / Salsa" },
  { id: '386', title: "Hawái", artist: "Maluma", genre: "Reggaetón" },
  { id: '387', title: "Corazón", artist: "Maluma x Nego do Borel", genre: "Reggaetón" },
  { id: '388', title: "Gatita", artist: "Bellakath", genre: "Reggaetón" },
  { id: '389', title: "Reggaetón Champagne", artist: "Bellakath x Dani Flow", genre: "Reggaetón" },
  { id: '390', title: "La Bebé", artist: "Yng Lvcas", genre: "Reggaetón" },
  { id: '391', title: "La Bebé (Remix)", artist: "Yng Lvcas x Peso Pluma", genre: "Reggaetón" },
  { id: '392', title: "Quevedo: Bzrp Music Sessions, Vol. 52", artist: "Bizarrap x Quevedo", genre: "Reggaetón" },
  { id: '393', title: "Pepas", artist: "Farruko", genre: "Latin Urban / Guaracha" },
  { id: '394', title: "Danza Kuduro", artist: "Don Omar", genre: "Reggaetón / Dance" },
  { id: '395', title: "El Taxi", artist: "Pitbull x Osmani Garcia", genre: "Urbano" },
  { id: '396', title: "La Gasolina", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '397', title: "Dura", artist: "Daddy Yankee", genre: "Reggaetón" },
  { id: '398', title: "Despacito", artist: "Luis Fonsi x Daddy Yankee", genre: "Pop / Urbano" },
  { id: '399', title: "Bailando", artist: "Enrique Iglesias x Gente de Zona", genre: "Pop / Tropical" },
  { id: '400', title: "Mi Gente", artist: "J Balvin", genre: "Reggaetón" },
  { id: '401', title: "Vivir Mi Vida", artist: "Marc Anthony", genre: "Salsa" },
  { id: '402', title: "Valió la Pena", artist: "Marc Anthony", genre: "Salsa" },
  { id: '403', title: "Ahora Quien", artist: "Marc Anthony", genre: "Salsa" },
  { id: '404', title: "Tu Amor Me Hace Bien", artist: "Marc Anthony", genre: "Salsa" },
  { id: '405', title: "Flor Pálida", artist: "Marc Anthony", genre: "Salsa" },
  { id: '406', title: "Que Alguien Me Diga", artist: "Gilberto Santa Rosa", genre: "Salsa" },
  { id: '407', title: "Conciencia", artist: "Gilberto Santa Rosa", genre: "Salsa" },
  { id: '408', title: "La Agarradera", artist: "Gilberto Santa Rosa", genre: "Salsa" },
  { id: '409', title: "La Vida Es Un Carnaval", artist: "Celia Cruz", genre: "Salsa" },
  { id: '410', title: "La Negra Tiene Tumbao", artist: "Celia Cruz", genre: "Salsa" },
  { id: '411', title: "Quimbara", artist: "Celia Cruz x Johnny Pacheco", genre: "Salsa" },
  { id: '412', title: "Una Aventura", artist: "Grupo Niche", genre: "Salsa" },
  { id: '413', title: "Cali Pachanguero", artist: "Grupo Niche", genre: "Salsa" },
  { id: '414', title: "Gotas de Lluvia", artist: "Grupo Niche", genre: "Salsa" },
  { id: '415', title: "Rebelión", artist: "Joe Arroyo", genre: "Salsa" },
  { id: '416', title: "En Barranquilla Me Quedo", artist: "Joe Arroyo", genre: "Salsa" },
  { id: '417', title: "Llorarás", artist: "Oscar D'León", genre: "Salsa" },
  { id: '418', title: "Suavemente", artist: "Elvis Crespo", genre: "Merengue" },
  { id: '419', title: "Pintame", artist: "Elvis Crespo", genre: "Merengue" },
  { id: '420', title: "Tu Sonrisa", artist: "Elvis Crespo", genre: "Merengue" },
  { id: '421', title: "Es Mentiroso", artist: "Olga Tañón", genre: "Merengue" },
  { id: '422', title: "Muchacho Malo", artist: "Olga Tañón", genre: "Merengue" },
  { id: '423', title: "La Bilirrubina", artist: "Juan Luis Guerra", genre: "Merengue" },
  { id: '424', title: "Ojalá Que Llueva Café", artist: "Juan Luis Guerra", genre: "Merengue / Bachata" },
  { id: '425', title: "El Niágara en Bicicleta", artist: "Juan Luis Guerra", genre: "Merengue" },
  { id: '426', title: "Las Avispas", artist: "Juan Luis Guerra", genre: "Merengue" },
  { id: '427', title: "El Costo de la Vida", artist: "Juan Luis Guerra", genre: "Merengue" },
  { id: '428', title: "Obsesión", artist: "Aventura", genre: "Bachata" },
  { id: '429', title: "Dile al Amor", artist: "Aventura", genre: "Bachata" },
  { id: '430', title: "Propuesta Indecente", artist: "Romeo Santos", genre: "Bachata" },
  { id: '431', title: "Eres Mía", artist: "Romeo Santos", genre: "Bachata" },
  { id: '432', title: "Darte un Beso", artist: "Prince Royce", genre: "Bachata" },
  { id: '433', title: "Corazón Sin Cara", artist: "Prince Royce", genre: "Bachata" },
  { id: '434', title: "Deja Vu", artist: "Prince Royce x Shakira", genre: "Bachata" },
  { id: '435', title: "Monotonía", artist: "Shakira x Ozuna", genre: "Bachata / Urbano" },
  { id: '436', title: "El Tiburón", artist: "Proyecto Uno", genre: "Merengue / Dance" },
  { id: '437', title: "Está Pegao", artist: "Proyecto Uno", genre: "Merengue / Dance" },
  { id: '438', title: "25 Horas al Día", artist: "Proyecto Uno", genre: "Merengue" },
  { id: '439', title: "La Dueña del Swing", artist: "Los Hermanos Rosario", genre: "Merengue" },
  { id: '440', title: "El Venao", artist: "Los Cantantes", genre: "Merengue" },
  { id: '441', title: "Kulikitaka", artist: "Toño Rosario", genre: "Merengue" },
  { id: '442', title: "Dancing Queen", artist: "ABBA", genre: "Disco / Pop" },
  { id: '443', title: "Mamma Mia", artist: "ABBA", genre: "Disco / Pop" },
  { id: '444', title: "Gimme! Gimme! Gimme!", artist: "ABBA", genre: "Disco / Pop" },
  { id: '445', title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock" },
  { id: '446', title: "Don't Stop Me Now", artist: "Queen", genre: "Rock / Pop" },
  { id: '447', title: "I Want to Break Free", artist: "Queen", genre: "Rock" },
  { id: '448', title: "Stayin' Alive", artist: "Bee Gees", genre: "Disco" },
  { id: '449', title: "Night Fever", artist: "Bee Gees", genre: "Disco" },
  { id: '450', title: "You Should Be Dancing", artist: "Bee Gees", genre: "Disco" },
  { id: '451', title: "Billie Jean", artist: "Michael Jackson", genre: "Pop / Dance" },
  { id: '452', title: "Beat It", artist: "Michael Jackson", genre: "Pop" },
  { id: '453', title: "Thriller", artist: "Michael Jackson", genre: "Pop / Dance" },
  { id: '454', title: "Don't Stop 'Til You Get Enough", artist: "Michael Jackson", genre: "Disco" },
  { id: '455', title: "September", artist: "Earth, Wind & Fire", genre: "Disco / Funk" },
  { id: '456', title: "Let's Groove", artist: "Earth, Wind & Fire", genre: "Disco / Funk" },
  { id: '457', title: "Y.M.C.A.", artist: "Village People", genre: "Disco" },
  { id: '458', title: "Macho Man", artist: "Village People", genre: "Disco" },
  { id: '459', title: "Celebration", artist: "Kool & The Gang", genre: "Disco / Funk" },
  { id: '460', title: "Get Down On It", artist: "Kool & The Gang", genre: "Disco / Funk" },
  { id: '461', title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco" },
  { id: '462', title: "Can't Take My Eyes Off You", artist: "Gloria Gaynor", genre: "Disco" },
  { id: '463', title: "Uptown Funk", artist: "Mark Ronson x Bruno Mars", genre: "Funk / Pop" },
  { id: '464', title: "Treasure", artist: "Bruno Mars", genre: "Pop / Funk" },
  { id: '465', title: "Locked Out of Heaven", artist: "Bruno Mars", genre: "Pop" },
  { id: '466', title: "24K Magic", artist: "Bruno Mars", genre: "Pop / Funk" },
  { id: '467', title: "Get Lucky", artist: "Daft Punk x Pharrell Williams", genre: "Dance / Funk" },
  { id: '468', title: "One More Time", artist: "Daft Punk", genre: "Electronic" },
  { id: '469', title: "Don't Start Now", artist: "Dua Lipa", genre: "Pop / Disco" },
  { id: '470', title: "Levitating", artist: "Dua Lipa", genre: "Pop / Disco" },
  { id: '471', title: "Fireball", artist: "Pitbull", genre: "Dance / Pop" },
  { id: '472', title: "Timber", artist: "Pitbull x Ke$ha", genre: "Dance / Pop" },
  { id: '473', title: "Give Me Everything", artist: "Pitbull x Ne-Yo", genre: "Dance / Pop" },
  { id: '474', title: "Feel So Close", artist: "Calvin Harris", genre: "EDM" },
  { id: '475', title: "Titanium", artist: "David Guetta x Sia", genre: "EDM" },
  { id: '476', title: "Wake Me Up", artist: "Avicii", genre: "EDM" },
  { id: '477', title: "Levels", artist: "Avicii", genre: "EDM" },
  { id: '478', title: "Ángel", artist: "Belinda", genre: "Pop Latino" },
  { id: '479', title: "Bella Traición", artist: "Belinda", genre: "Pop Latino" },
  { id: '480', title: "Luz Sin Gravedad", artist: "Belinda", genre: "Pop Latino" },
  { id: '481', title: "Duele el Amor", artist: "Aleks Syntek x Ana Torroja", genre: "Pop Latino" },
  { id: '482', title: "Sexo, Pudor y Lágrimas", artist: "Aleks Syntek", genre: "Pop Latino" },
  { id: '483', title: "Esa Hembra Es Mala", artist: "Gloria Trevi", genre: "Pop / Balada" },
  { id: '484', title: "La Tortura", artist: "Shakira x Alejandro Sanz", genre: "Pop Latino / Urbano" },
  { id: '485', title: "Te Felicito", artist: "Shakira x Rauw Alejandro", genre: "Pop / Urbano" },
  { id: '486', title: "Loco", artist: "Alejandro Fernández", genre: "Mariachi / Regional" },
  { id: '487', title: "Por Mujeres Como Tú", artist: "Pepe Aguilar", genre: "Mariachi / Regional" },
  { id: '488', title: "Prometiste", artist: "Pepe Aguilar", genre: "Mariachi / Regional" },
  { id: '489', title: "Yo No Fui", artist: "Pedro Fernández", genre: "Mariachi / Regional" },
  { id: '490', title: "El Aventurero", artist: "Pedro Fernández", genre: "Mariachi / Regional" },
  { id: '491', title: "Amarte a la Antigua", artist: "Pedro Fernández", genre: "Mariachi / Regional" },
  { id: '492', title: "Marta Tiene un Marcapasos", artist: "Hombres G", genre: "Rock en Español" },
  { id: '493', title: "Lo Noto", artist: "Hombres G", genre: "Rock en Español" },
  { id: '494', title: "Arrégname el Alma", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { id: '495', title: "El Baile del Perrito", artist: "Wilfrido Vargas", genre: "Merengue" },
  { id: '496', title: "El Jardinero", artist: "Wilfrido Vargas", genre: "Merengue" },
  { id: '497', title: "Burbujas de Amor", artist: "Juan Luis Guerra", genre: "Bachata / Pop" },
  { id: '498', title: "Boogie Wonderland", artist: "Earth, Wind & Fire", genre: "Disco / Funk" },
  { id: '499', title: "Last Dance", artist: "Donna Summer", genre: "Disco" },
  { id: '500', title: "Hot Stuff", artist: "Donna Summer", genre: "Disco" },
  { id: '501', title: "Funkytown", artist: "Lipps Inc.", genre: "Disco" },
  { id: '502', title: "Baracunatana", artist: "Aterciopelados", genre: "Rock en Español" },
  { id: '503', title: "Bolero Falaz", artist: "Aterciopelados", genre: "Rock en Español" },
  { id: '504', title: "Triste Canción", artist: "El Tri", genre: "Rock en Español" },
  { id: '505', title: "Las Piedras Rodantes", artist: "El Tri", genre: "Rock en Español" },
  { id: '506', title: "El Son del Dolor", artist: "La Cuca", genre: "Rock en Español" },
  { id: '507', title: "La Balada", artist: "La Cuca", genre: "Rock en Español" },
  { id: '508', title: "El Esqueleto", artist: "Víctimas del Doctor Cerebro", genre: "Rock / Ska" },
  { id: '509', title: "Párate y Mira", artist: "Los Pericos", genre: "Reggae / Rock" },
  { id: '510', title: "Pupilas Lejanas", artist: "Los Pericos", genre: "Reggae / Rock" },
  { id: '511', title: "Runaway", artist: "Los Pericos", genre: "Reggae / Rock" },
  { id: '512', title: "El Murguero", artist: "Los Auténticos Decadentes", genre: "Rock / Ska" }
];

// Construir datos iniciales para un usuario DJ dado
const buildInitialUserData = (uid) => {
  const now = Date.now();
  const isDemoUser = uid === 'uid-demo';
  
  const settings = isDemoUser ? {
    title: 'Mega Show en Vivo de DJ Demo',
    logoUrl: '',
    themeColor: '#7c3aed',
    themeColorSecondary: '#06b6d4',
    djName: 'DJ Demo',
    dedicationsEnabled: true,
    tipsEnabled: true,
    paypalUsername: 'djdemo',
    mercadopagoLink: 'https://link.mercadopago.com.mx/djdemo',
    bankClabe: '123456789012345678',
    promoEnabled: true,
    promoWhatsapp: '5215512345678',
    promoWebsite: 'https://djdemo.com',
    promoInstagram: 'djdemo_oficial',
    promoTiktok: 'djdemo_oficial'
  } : {
    title: 'Mi Gran Evento VIP',
    logoUrl: '',
    themeColor: '#7c3aed',
    themeColorSecondary: '#06b6d4',
    djName: 'DJ MasterMix',
    dedicationsEnabled: false
  };

  const requests = isDemoUser ? {
    "req_demo_1": {
      id: "req_demo_1",
      title: "Ella Baila Sola",
      artist: "Eslabon Armado x Peso Pluma",
      genre: "Regional Mexicano",
      dedication: "Para Lupita con todo mi amor de parte de Carlos",
      timestamp: now - 7200000,
      status: 'playing',
      votes: 14,
      voters: { "sess_v1": true, "sess_v2": true, "sess_v3": true }
    },
    "req_demo_2": {
      id: "req_demo_2",
      title: "Música Ligera",
      artist: "Soda Stereo",
      genre: "Rock en Español",
      dedication: "¡Para cantar todos juntos esta noche en la cabina!",
      timestamp: now - 3600000,
      status: 'accepted',
      votes: 11,
      voters: { "sess_v4": true, "sess_v5": true }
    },
    "req_demo_3": {
      id: "req_demo_3",
      title: "Gatita",
      artist: "Bellakath",
      genre: "Reggaetón",
      dedication: "Dedicado a las chicas de la mesa 5",
      timestamp: now - 2400000,
      status: 'accepted',
      votes: 18,
      voters: { "sess_v6": true, "sess_v7": true, "sess_v8": true }
    },
    "req_demo_4": {
      id: "req_demo_4",
      title: "Lamento Boliviano",
      artist: "Enanitos Verdes",
      genre: "Rock en Español",
      dedication: "¡Un clásico infaltable!",
      timestamp: now - 1800000,
      status: 'pending',
      votes: 7,
      voters: { "sess_v9": true }
    },
    "req_demo_5": {
      id: "req_demo_5",
      title: "Como La Flor",
      artist: "Selena",
      genre: "Cumbia",
      dedication: "Para mi esposa en nuestro aniversario",
      timestamp: now - 1500000,
      status: 'pending',
      votes: 9,
      voters: { "sess_v10": true }
    },
    "req_demo_6": {
      id: "req_demo_6",
      title: "Quevedo: Bzrp Music Sessions, Vol. 52",
      artist: "Bizarrap x Quevedo",
      genre: "Urban/Electro",
      dedication: "¡A bailar toda la noche!",
      timestamp: now - 1200000,
      status: 'pending',
      votes: 12,
      voters: { "sess_v11": true, "sess_v12": true }
    },
    "req_demo_7": {
      id: "req_demo_7",
      title: "Dynamite",
      artist: "BTS",
      genre: "Kpop",
      dedication: "Para el grupo de K-pop de la fiesta",
      timestamp: now - 900000,
      status: 'pending',
      votes: 4,
      voters: { "sess_v13": true }
    },
    "req_demo_8": {
      id: "req_demo_8",
      title: "Gasolina",
      artist: "Daddy Yankee",
      genre: "Reggaetón",
      dedication: "¡Ponle play para prender la pista!",
      timestamp: now - 600000,
      status: 'pending',
      votes: 15,
      voters: { "sess_v14": true, "sess_v15": true }
    },
    "req_demo_9": {
      id: "req_demo_9",
      title: "Save Your Tears",
      artist: "The Weeknd",
      genre: "Pop / Synthwave",
      dedication: "",
      timestamp: now - 300000,
      status: 'pending',
      votes: 3,
      voters: { "sess_v16": true }
    },
    "req_demo_10": {
      id: "req_demo_10",
      title: "Tusa",
      artist: "Karol G x Nicki Minaj",
      genre: "Reggaetón",
      dedication: "Para cantar a todo pulmón con las amigas",
      timestamp: now - 60000,
      status: 'pending',
      votes: 6,
      voters: { "sess_v17": true }
    }
  } : {};

  return {
    events_index: {
      'default-event': {
        id: 'default-event',
        title: settings.title,
        djName: settings.djName,
        date: isDemoUser ? '2026-06-21' : '2026-06-20',
        archived: false,
        createdAt: now
      }
    },
    events: {
      'default-event': {
        settings,
        requests
      }
    },
    autocomplete_songs: INITIAL_AUTOCOMPLETE.reduce((acc, s) => { acc[s.id] = s; return acc; }, {})
  };
};

// Helper para leer la base de datos mock global
const getLocalData = () => {
  const raw = localStorage.getItem('mock_rtdb_v2');
  if (!raw) {
    return initFreshMockDB();
  }
  const parsed = JSON.parse(raw);
  // Si no tiene events_registry es una versión antigua → reinicializar
  if (!parsed.events_registry) {
    return initFreshMockDB();
  }

  let updated = false;
  if (!parsed.users) {
    parsed.users = {};
    updated = true;
  }

  // Asegurarnos que todos los mock accounts (incluido uid-demo) tengan su estructura inicial en la BD
  MOCK_ACCOUNTS.forEach(a => {
    if (!parsed.users[a.uid]) {
      parsed.users[a.uid] = buildInitialUserData(a.uid);
      const isDemo = a.uid === 'uid-demo';
      parsed.events_registry['default-event-' + a.uid] = {
        ownerUid: a.uid,
        title: isDemo ? 'Mega Show en Vivo de DJ Demo' : 'Mi Gran Evento VIP',
        djName: a.displayName
      };
      updated = true;
    }
  });

  if (!parsed.autocomplete_songs) {
    parsed.autocomplete_songs = INITIAL_AUTOCOMPLETE.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
    updated = true;
  }
  if (updated) {
    localStorage.setItem('mock_rtdb_v2', JSON.stringify(parsed));
  }
  return parsed;
};

const initFreshMockDB = () => {
  const db = { users: {}, events_registry: {}, autocomplete_songs: {} };
  MOCK_ACCOUNTS.forEach(a => {
    db.users[a.uid] = buildInitialUserData(a.uid);
    const isDemo = a.uid === 'uid-demo';
    // Registrar el evento demo de cada DJ en el registry público
    db.events_registry['default-event-' + a.uid] = {
      ownerUid: a.uid,
      title: isDemo ? 'Mega Show en Vivo de DJ Demo' : 'Mi Gran Evento VIP',
      djName: a.displayName
    };
  });
  // También registrar 'default-event' apuntando al primer DJ (para compatibilidad)
  db.events_registry['default-event'] = {
    ownerUid: MOCK_ACCOUNTS[1]?.uid || MOCK_ACCOUNTS[0].uid,
    title: 'Mi Gran Evento VIP',
    djName: 'DJ MasterMix'
  };
  db.autocomplete_songs = INITIAL_AUTOCOMPLETE.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  localStorage.setItem('mock_rtdb_v2', JSON.stringify(db));
  return db;
};



const setLocalData = (data) => {
  localStorage.setItem('mock_rtdb_v2', JSON.stringify(data));
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DB_UPDATE' });
  }
};

// Restaurar sesión de Auth simulada
// Valida que el uid guardado corresponda a una cuenta conocida (evita sesiones viejas con uid obsoleto)
if (isMockMode) {
  const savedUser = localStorage.getItem('mock_auth_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const isKnownAccount = MOCK_ACCOUNTS.some(a => a.uid === parsed.uid);
      if (isKnownAccount) {
        auth.currentUser = parsed;
      } else {
        // Uid obsoleto (de versión anterior del código) → limpiar sesión
        console.warn('⚠️ Sesión mock con uid obsoleto detectada. Limpiando...');
        localStorage.removeItem('mock_auth_user');
        localStorage.removeItem('mock_auth_password');
      }
    } catch (e) {
      localStorage.removeItem('mock_auth_user');
      localStorage.removeItem('mock_auth_password');
    }
  }
}

// -------------------------------------------------------------
// 3. EXPORTACIÓN DE MÉTODOS COMPATIBLES (REAL / MOCK)
// -------------------------------------------------------------

// --- AUTHENTICATION ---

export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  if (!isMockMode) {
    return realSignIn(authInstance, email, password);
  }

  const account = MOCK_ACCOUNTS.find(a => a.email === email && a.password === password);
  if (!account) {
    throw new Error('auth/invalid-credential: Credenciales incorrectas.');
  }

  const mockUser = {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    isAdmin: account.isAdmin || false
  };
  auth.currentUser = mockUser;
  // Guardar también la contraseña cifrada para re-auth
  localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
  localStorage.setItem('mock_auth_password', password);
  window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: mockUser }));
  return { user: mockUser };
};

export const signOut = async (authInstance) => {
  if (!isMockMode) {
    return realSignOut(authInstance);
  }
  auth.currentUser = null;
  localStorage.removeItem('mock_auth_user');
  localStorage.removeItem('mock_auth_password');
  window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: null }));
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (!isMockMode) {
    return realAuthChanged(authInstance, callback);
  }

  callback(auth.currentUser);

  const handleAuthChange = (e) => { callback(e.detail); };
  window.addEventListener('mock-auth-change', handleAuthChange);
  return () => { window.removeEventListener('mock-auth-change', handleAuthChange); };
};

// Re-autenticación: verifica la contraseña del usuario actual
// En Firebase real usa EmailAuthProvider; en mock compara con la guardada en localStorage
export const reauthenticateUser = async (password) => {
  if (!isMockMode) {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    return reauthenticateWithCredential(auth.currentUser, credential);
  }

  // Mock: comparar con la contraseña con la que se inició sesión
  const savedPassword = localStorage.getItem('mock_auth_password');
  if (!savedPassword || password !== savedPassword) {
    throw new Error('auth/wrong-password: Contraseña incorrecta.');
  }
  return true;
};

// --- REALTIME DATABASE ---
const activeListeners = new Map();

if (isMockMode && syncChannel) {
  syncChannel.onmessage = (e) => {
    if (e.data.type === 'DB_UPDATE') {
      activeListeners.forEach(({ callback, path }) => {
        const dbData = getLocalData();
        const value = getValueFromPath(dbData, path);
        callback(new MockSnapshot(path, value));
      });
    }
  };
}

class MockSnapshot {
  constructor(path, data) {
    this._data = data;
    this.key = path.split('/').pop();
  }
  val() { return this._data; }
  exists() { return this._data !== null && this._data !== undefined; }
  forEach(callback) {
    if (this._data && typeof this._data === 'object') {
      Object.keys(this._data).forEach((key, index) => {
        callback(new MockSnapshot(key, this._data[key]), index);
      });
    }
  }
}

const getValueFromPath = (obj, path) => {
  if (!path || path === '/') return obj;
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
};

const setValueAtPath = (obj, path, value) => {
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (value === null) {
    delete current[lastPart];
  } else {
    current[lastPart] = value;
  }
};

export const ref = (dbInstance, path = '') => {
  if (!isMockMode) {
    return realDbRef(dbInstance, path);
  }
  return { path, isMockRef: true };
};

export const onValue = (dbRef, callback) => {
  if (!dbRef.isMockRef) {
    return realOnValue(dbRef, callback);
  }

  const path = dbRef.path;
  const listenerId = Math.random().toString(36).substr(2, 9);
  activeListeners.set(listenerId, { callback, path });

  const dbData = getLocalData();
  const val = getValueFromPath(dbData, path);
  callback(new MockSnapshot(path, val));

  return () => { activeListeners.delete(listenerId); };
};

export const off = (dbRef) => {
  if (!dbRef.isMockRef) {
    return realOff(dbRef);
  }
  activeListeners.forEach((val, key) => {
    if (val.path === dbRef.path) activeListeners.delete(key);
  });
};

export const push = (dbRef, value) => {
  if (!dbRef.isMockRef) {
    return realPush(dbRef, value);
  }

  const path = dbRef.path;
  const newKey = 'req_' + Date.now() + Math.random().toString(36).substr(2, 5);
  const dbData = getLocalData();

  let targetNode = getValueFromPath(dbData, path) || {};
  targetNode[newKey] = value;
  setValueAtPath(dbData, path, targetNode);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (listener.path === path || path.startsWith(listener.path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });

  return { key: newKey, ref: { path: `${path}/${newKey}`, isMockRef: true } };
};

export const set = async (dbRef, value) => {
  if (!dbRef.isMockRef) {
    return realSet(dbRef, value);
  }

  const path = dbRef.path;
  const dbData = getLocalData();
  setValueAtPath(dbData, path, value);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (path.startsWith(listener.path) || listener.path.startsWith(path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });
};

export const update = async (dbRef, values) => {
  if (!dbRef.isMockRef) {
    return realUpdate(dbRef, values);
  }

  const path = dbRef.path;
  const dbData = getLocalData();
  let currentVal = getValueFromPath(dbData, path) || {};
  const updated = { ...currentVal, ...values };
  setValueAtPath(dbData, path, updated);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (path.startsWith(listener.path) || listener.path.startsWith(path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });
};

export const remove = async (dbRef) => {
  if (!dbRef.isMockRef) {
    return realRemove(dbRef);
  }
  return set(dbRef, null);
};

export const get = async (dbRef) => {
  if (!dbRef.isMockRef) {
    return realGet(dbRef);
  }
  const path = dbRef.path;
  const dbData = getLocalData();
  const val = getValueFromPath(dbData, path);
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val
  };
};

// --- STORAGE ---
export const uploadBytes = async (storageRefInstance, file) => {
  if (!isMockMode) {
    return realUploadBytes(storageRefInstance, file);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem('mock_uploaded_logo', reader.result);
      resolve({ ref: storageRefInstance, metadata: { contentType: file.type } });
    };
    reader.readAsDataURL(file);
  });
};

export const getDownloadURL = async (storageRefInstance) => {
  if (!isMockMode) {
    return realGetDownloadURL(storageRefInstance);
  }
  return localStorage.getItem('mock_uploaded_logo') || '';
};

export const storageRef = (storageInstance, path) => {
  if (!isMockMode) {
    return realStorageRef(storageInstance, path);
  }
  return { path, isMockStorageRef: true };
};
