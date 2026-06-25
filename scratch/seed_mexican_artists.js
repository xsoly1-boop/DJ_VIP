import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.VITE_FIREBASE_DATABASE_URL || "https://djvip-c2cc9-default-rtdb.firebaseio.com";

const songs = [
  // Jorge Negrete
  { title: "México Lindo y Querido", artist: "Jorge Negrete", genre: "Ranchera" },
  { title: "Ay Jalisco No Te Rajes", artist: "Jorge Negrete", genre: "Ranchera" },
  { title: "El Jinete", artist: "Jorge Negrete", genre: "Ranchera" },
  { title: "Cocula", artist: "Jorge Negrete", genre: "Ranchera" },
  { title: "La Feria de las Flores", artist: "Jorge Negrete", genre: "Ranchera" },
  { title: "Ella", artist: "Jorge Negrete", genre: "Ranchera" },

  // Pedro Infante
  { title: "Cien Años", artist: "Pedro Infante", genre: "Ranchera" },
  { title: "Amorcito Corazón", artist: "Pedro Infante", genre: "Ranchera" },
  { title: "La Que Se Fue", artist: "Pedro Infante", genre: "Ranchera" },
  { title: "Flor Sin Retoño", artist: "Pedro Infante", genre: "Ranchera" },
  { title: "Qué Te Ha Dado Esa Mujer", artist: "Pedro Infante", genre: "Ranchera" },
  { title: "Copa Tras Copa", artist: "Pedro Infante", genre: "Ranchera" },

  // José Alfredo Jiménez
  { title: "El Rey", artist: "José Alfredo Jiménez", genre: "Ranchera" },
  { title: "Si Nos Dejan", artist: "José Alfredo Jiménez", genre: "Ranchera" },
  { title: "En El Último Trago", artist: "José Alfredo Jiménez", genre: "Ranchera" },
  { title: "Ella", artist: "José Alfredo Jiménez", genre: "Ranchera" },
  { title: "La Media Vuelta", artist: "José Alfredo Jiménez", genre: "Ranchera" },
  { title: "Te Solté La Rienda", artist: "José Alfredo Jiménez", genre: "Ranchera" },

  // Javier Solís
  { title: "Sombras", artist: "Javier Solís", genre: "Bolero Ranchero" },
  { title: "Payaso", artist: "Javier Solís", genre: "Bolero Ranchero" },
  { title: "Esclavo y Amo", artist: "Javier Solís", genre: "Bolero Ranchero" },
  { title: "Renunciación", artist: "Javier Solís", genre: "Bolero Ranchero" },
  { title: "Entrega Total", artist: "Javier Solís", genre: "Bolero Ranchero" },
  { title: "Luz y Sombra", artist: "Javier Solís", genre: "Bolero Ranchero" },

  // Vicente Fernández
  { title: "Volver Volver", artist: "Vicente Fernández", genre: "Ranchera" },
  { title: "El Rey", artist: "Vicente Fernández", genre: "Ranchera" },
  { title: "Acá Entre Nos", artist: "Vicente Fernández", genre: "Ranchera" },
  { title: "Hermoso Cariño", artist: "Vicente Fernández", genre: "Ranchera" },
  { title: "Por Tu Maldito Amor", artist: "Vicente Fernández", genre: "Ranchera" },
  { title: "Mujeres Divinas", artist: "Vicente Fernández", genre: "Ranchera" },

  // Chavela Vargas
  { title: "La Llorona", artist: "Chavela Vargas", genre: "Ranchera" },
  { title: "Macorina", artist: "Chavela Vargas", genre: "Ranchera" },
  { title: "Paloma Negra", artist: "Chavela Vargas", genre: "Ranchera" },
  { title: "Un Mundo Raro", artist: "Chavela Vargas", genre: "Ranchera" },
  { title: "En El Último Trago", artist: "Chavela Vargas", genre: "Ranchera" },
  { title: "Piensa en Mí", artist: "Chavela Vargas", genre: "Ranchera" },

  // Lola Beltrán
  { title: "Cucurrucucú Paloma", artist: "Lola Beltrán", genre: "Ranchera" },
  { title: "Paloma Negra", artist: "Lola Beltrán", genre: "Ranchera" },
  { title: "Huapango Torero", artist: "Lola Beltrán", genre: "Ranchera" },
  { title: "Gorrioncillo Pecho Amarillo", artist: "Lola Beltrán", genre: "Ranchera" },
  { title: "La Cigarra", artist: "Lola Beltrán", genre: "Ranchera" },

  // Antonio Aguilar
  { title: "Un Puño de Tierra", artist: "Antonio Aguilar", genre: "Ranchera" },
  { title: "Albur de Amor", artist: "Antonio Aguilar", genre: "Ranchera" },
  { title: "Triste Recuerdo", artist: "Antonio Aguilar", genre: "Ranchera" },
  { title: "Gabino Barrera", artist: "Antonio Aguilar", genre: "Ranchera" },
  { title: "Caballo Prieto Afamado", artist: "Antonio Aguilar", genre: "Ranchera" },

  // Lucha Villa
  { title: "Resulta", artist: "Lucha Villa", genre: "Ranchera" },
  { title: "A Medias de la Noche", artist: "Lucha Villa", genre: "Ranchera" },
  { title: "No Discutamos", artist: "Lucha Villa", genre: "Ranchera" },
  { title: "La Cruz de Olvido", artist: "Lucha Villa", genre: "Ranchera" },
  { title: "Tú a Mí No Me Hundes", artist: "Lucha Villa", genre: "Ranchera" },

  // Aida Cuevas
  { title: "El Pastor", artist: "Aida Cuevas", genre: "Ranchera" },
  { title: "La Cigarra", artist: "Aida Cuevas", genre: "Ranchera" },
  { title: "Quizás Mañana", artist: "Aida Cuevas", genre: "Ranchera" },
  { title: "Te Doy Las Gracias", artist: "Aida Cuevas", genre: "Ranchera" },
  { title: "La Llorona", artist: "Aida Cuevas", genre: "Ranchera" },

  // Juan Gabriel
  { title: "Querida", artist: "Juan Gabriel", genre: "Pop" },
  { title: "Hasta Que Te Conocí", artist: "Juan Gabriel", genre: "Pop" },
  { title: "Amor Eterno", artist: "Juan Gabriel", genre: "Ranchera" },
  { title: "El Noa Noa", artist: "Juan Gabriel", genre: "Pop" },
  { title: "Así Fue", artist: "Juan Gabriel", genre: "Pop" },
  { title: "Abrázame Muy Fuerte", artist: "Juan Gabriel", genre: "Pop" },

  // Luis Miguel
  { title: "La Incondicional", artist: "Luis Miguel", genre: "Pop" },
  { title: "Ahora Te Puedes Marchar", artist: "Luis Miguel", genre: "Pop" },
  { title: "Hasta Que Me Olvides", artist: "Luis Miguel", genre: "Pop" },
  { title: "Culpable o No", artist: "Luis Miguel", genre: "Pop" },
  { title: "La Media Vuelta", artist: "Luis Miguel", genre: "Bolero" },
  { title: "Tengo Todo Excepto a Ti", artist: "Luis Miguel", genre: "Pop" },

  // José José
  { title: "El Triste", artist: "José José", genre: "Balada" },
  { title: "Almohada", artist: "José José", genre: "Balada" },
  { title: "Gavilán o Paloma", artist: "José José", genre: "Balada" },
  { title: "Lo Pasado Pasado", artist: "José José", genre: "Balada" },
  { title: "Amar y Querer", artist: "José José", genre: "Balada" },
  { title: "La Nave del Olvido", artist: "José José", genre: "Balada" },

  // Armando Manzanero
  { title: "Somos Novios", artist: "Armando Manzanero", genre: "Bolero" },
  { title: "Esta Tarde Vi Llover", artist: "Armando Manzanero", genre: "Bolero" },
  { title: "Contigo Aprendí", artist: "Armando Manzanero", genre: "Bolero" },
  { title: "Adoro", artist: "Armando Manzanero", genre: "Bolero" },
  { title: "Nada Personal", artist: "Armando Manzanero", genre: "Bolero" },
  { title: "No", artist: "Armando Manzanero", genre: "Bolero" },

  // Joan Sebastian
  { title: "Tatuajes", artist: "Joan Sebastian", genre: "Ranchera" },
  { title: "Se Secreto de Amor", artist: "Joan Sebastian", genre: "Pop" },
  { title: "Eso y Más", artist: "Joan Sebastian", genre: "Pop" },
  { title: "Rumores", artist: "Joan Sebastian", genre: "Ranchera" },
  { title: "Me Gustas", artist: "Joan Sebastian", genre: "Ranchera" },
  { title: "Sentimental", artist: "Joan Sebastian", genre: "Ranchera" },

  // Marco Antonio Solís
  { title: "Si No Te Hubieras Ido", artist: "Marco Antonio Solís", genre: "Balada" },
  { title: "Más Que Tu Amigo", artist: "Marco Antonio Solís", genre: "Pop" },
  { title: "Mi Eterno Amor Secreto", artist: "Marco Antonio Solís", genre: "Balada" },
  { title: "O Me Voy o Te Vas", artist: "Marco Antonio Solís", genre: "Balada" },
  { title: "Tu Cárcel", artist: "Los Bukis", genre: "Balada" },
  { title: "A Dónde Vamos a Parar", artist: "Marco Antonio Solís", genre: "Balada" },

  // Alejandro Fernández
  { title: "Me Dediqué a Perderte", artist: "Alejandro Fernández", genre: "Pop" },
  { title: "Como Quien Pierde Una Estrella", artist: "Alejandro Fernández", genre: "Ranchera" },
  { title: "Nube Viajera", artist: "Alejandro Fernández", genre: "Ranchera" },
  { title: "Caballero", artist: "Alejandro Fernández", genre: "Ranchera" },
  { title: "Mátalas", artist: "Alejandro Fernández", genre: "Ranchera" },
  { title: "Se Me Va La Voz", artist: "Alejandro Fernández", genre: "Pop" },

  // Yuri
  { title: "Maldita Primavera", artist: "Yuri", genre: "Pop" },
  { title: "Detrás de Mi Ventana", artist: "Yuri", genre: "Pop" },
  { title: "Amiga Mía", artist: "Yuri", genre: "Pop" },
  { title: "Es Ella Más Que Yo", artist: "Yuri", genre: "Pop" },
  { title: "Hombres al Borde de un Ataque de Celos", artist: "Yuri", genre: "Pop" },

  // Thalía
  { title: "Amor A La Mexicana", artist: "Thalía", genre: "Pop" },
  { title: "Piel Morena", artist: "Thalía", genre: "Pop" },
  { title: "Entre El Mar y Una Estrella", artist: "Thalía", genre: "Pop" },
  { title: "Arrasando", artist: "Thalía", genre: "Pop" },
  { title: "No Me Acuerdo", artist: "Thalía", genre: "Pop" },
  { title: "A Quién Le Importa", artist: "Thalía", genre: "Pop" },

  // Paulina Rubio
  { title: "Y Yo Sigo Aquí", artist: "Paulina Rubio", genre: "Pop" },
  { title: "Ni Una Sola Palabra", artist: "Paulina Rubio", genre: "Pop" },
  { title: "El Último Adiós", artist: "Paulina Rubio", genre: "Pop" },
  { title: "Mío", artist: "Paulina Rubio", genre: "Pop" },
  { title: "Don't Say Goodbye", artist: "Paulina Rubio", genre: "Pop" },

  // Cristian Castro
  { title: "Azul", artist: "Cristian Castro", genre: "Pop" },
  { title: "Por Amarte Así", artist: "Cristian Castro", genre: "Pop" },
  { title: "Lloviendo Estrellas", artist: "Cristian Castro", genre: "Pop" },
  { title: "No Podrás", artist: "Cristian Castro", genre: "Pop" },
  { title: "Es Mejor Así", artist: "Cristian Castro", genre: "Pop" },

  // Gloria Trevi
  { title: "Todos Me Miran", artist: "Gloria Trevi", genre: "Pop" },
  { title: "Pelo Suelto", artist: "Gloria Trevi", genre: "Pop" },
  { title: "Con los Ojos Cerrados", artist: "Gloria Trevi", genre: "Pop" },
  { title: "Cinco Minutos", artist: "Gloria Trevi", genre: "Pop" },
  { title: "Dr. Psiquiatra", artist: "Gloria Trevi", genre: "Pop" },
  { title: "El Recuento de los Daños", artist: "Gloria Trevi", genre: "Pop" },

  // Alejandra Guzmán
  { title: "Hacer El Amor Con Otro", artist: "Alejandra Guzmán", genre: "Rock" },
  { title: "Eternamente Bella", artist: "Alejandra Guzmán", genre: "Rock" },
  { title: "Volverte a Amar", artist: "Alejandra Guzmán", genre: "Rock" },
  { title: "Reina de Corazones", artist: "Alejandra Guzmán", genre: "Rock" },
  { title: "Mírala Míralo", artist: "Alejandra Guzmán", genre: "Rock" },
  { title: "Día de Suerte", artist: "Alejandra Guzmán", genre: "Pop" },

  // Caifanes / Jaguares
  { title: "La Célula Que Explota", artist: "Caifanes", genre: "Rock" },
  { title: "Afuera", artist: "Caifanes", genre: "Rock" },
  { title: "No Dejes Que...", artist: "Caifanes", genre: "Rock" },
  { title: "Viento", artist: "Caifanes", genre: "Rock" },
  { title: "Nubes", artist: "Caifanes", genre: "Rock" },
  { title: "Mátenme Porque Me Muero", artist: "Caifanes", genre: "Rock" },

  // Café Tacvba
  { title: "La Ingrata", artist: "Café Tacvba", genre: "Rock" },
  { title: "Eres", artist: "Café Tacvba", genre: "Rock" },
  { title: "El Baile y El Salón", artist: "Café Tacvba", genre: "Rock" },
  { title: "Chilanga Banda", artist: "Café Tacvba", genre: "Rock" },
  { title: "Las Flores", artist: "Café Tacvba", genre: "Rock" },
  { title: "María", artist: "Café Tacvba", genre: "Rock" },

  // Maná
  { title: "En El Muelle de San Blas", artist: "Maná", genre: "Rock Pop" },
  { title: "Oye Mi Amor", artist: "Maná", genre: "Rock Pop" },
  { title: "Rayando El Sol", artist: "Maná", genre: "Rock Pop" },
  { title: "Clavado En Un Bar", artist: "Maná", genre: "Rock Pop" },
  { title: "Mariposa Traicionera", artist: "Maná", genre: "Rock Pop" },
  { title: "Labios Compartidos", artist: "Maná", genre: "Rock Pop" },

  // Molotov
  { title: "Gimme Tha Power", artist: "Molotov", genre: "Rock" },
  { title: "Frijolero", artist: "Molotov", genre: "Rock" },
  { title: "Puto", artist: "Molotov", genre: "Rock" },
  { title: "Amateur", artist: "Molotov", genre: "Rock" },
  { title: "Here We Kum", artist: "Molotov", genre: "Rock" },

  // El Tri
  { title: "Las Piedras Rodantes", artist: "El Tri", genre: "Rock" },
  { title: "Triste Canción", artist: "El Tri", genre: "Rock" },
  { title: "A.D.O.", artist: "El Tri", genre: "Rock" },
  { title: "Pobre Soñador", artist: "El Tri", genre: "Rock" },
  { title: "Niño Sin Amor", artist: "El Tri", genre: "Rock" },

  // Maldita Vecindad
  { title: "Pachuco", artist: "Maldita Vecindad", genre: "Ska" },
  { title: "Kumbala", artist: "Maldita Vecindad", genre: "Ska" },
  { title: "Solín", artist: "Maldita Vecindad", genre: "Ska" },
  { title: "Don Palabras", artist: "Maldita Vecindad", genre: "Ska" },
  { title: "Gran Circo", artist: "Maldita Vecindad", genre: "Ska" },

  // Zoé
  { title: "Labios Rotos", artist: "Zoé", genre: "Rock" },
  { title: "Soñé", artist: "Zoé", genre: "Rock" },
  { title: "Luna", artist: "Zoé", genre: "Rock" },
  { title: "Vía Láctea", artist: "Zoé", genre: "Rock" },
  { title: "Poli", artist: "Zoé", genre: "Rock" },
  { title: "Azul", artist: "Zoé", genre: "Rock" },

  // Panteón Rococó
  { title: "La Carencia", artist: "Panteón Rococó", genre: "Ska" },
  { title: "La Dosis Perfecta", artist: "Panteón Rococó", genre: "Ska" },
  { title: "Vendedora de Caricias", artist: "Panteón Rococó", genre: "Ska" },
  { title: "Esta Noche", artist: "Panteón Rococó", genre: "Ska" },
  { title: "Arregla-corazones", artist: "Panteón Rococó", genre: "Ska" },

  // Natalia Lafourcade
  { title: "Hasta la Raíz", artist: "Natalia Lafourcade", genre: "Pop" },
  { title: "Nunca Es Suficiente", artist: "Natalia Lafourcade", genre: "Pop" },
  { title: "Tú Sí Sabes Quererme", artist: "Natalia Lafourcade", genre: "Pop" },
  { title: "Lo Que Construimos", artist: "Natalia Lafourcade", genre: "Pop" },
  { title: "En El 2000", artist: "Natalia Lafourcade", genre: "Pop" },

  // Julieta Venegas
  { title: "Me Voy", artist: "Julieta Venegas", genre: "Pop" },
  { title: "Limón y Sal", artist: "Julieta Venegas", genre: "Pop" },
  { title: "Lento", artist: "Julieta Venegas", genre: "Pop" },
  { title: "Andar Conmigo", artist: "Julieta Venegas", genre: "Pop" },
  { title: "Eres Para Mí", artist: "Julieta Venegas", genre: "Pop" },

  // Los Tigres del Norte
  { title: "Jefe de Jefes", artist: "Los Tigres del Norte", genre: "Norteño" },
  { title: "La Puerta Negra", artist: "Los Tigres del Norte", genre: "Norteño" },
  { title: "Golpes en el Corazón", artist: "Los Tigres del Norte", genre: "Norteño" },
  { title: "La Mesa del Rincón", artist: "Los Tigres del Norte", genre: "Norteño" },
  { title: "Contrabando y Traición", artist: "Los Tigres del Norte", genre: "Norteño" },
  { title: "Ni Parientes Somos", artist: "Los Tigres del Norte", genre: "Norteño" },

  // Los Ángeles Azules
  { title: "17 Años", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "El Listón de Tu Pelo", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Cómo Te Voy a Olvidar", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Mis Sentimientos", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Nunca Es Suficiente", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Amor A Primera Vista", artist: "Los Ángeles Azules", genre: "Cumbia" },

  // La Arrolladora Banda El Limón
  { title: "El Ruido de Tus Pasos", artist: "La Arrolladora Banda El Limón", genre: "Banda" },
  { title: "Llamada de Mi Ex", artist: "La Arrolladora Banda El Limón", genre: "Banda" },
  { title: "La Calabaza", artist: "La Arrolladora Banda El Limón", genre: "Banda" },
  { title: "El Final de Nuestra Historia", artist: "La Arrolladora Banda El Limón", genre: "Banda" },
  { title: "Sobre Mis Pies", artist: "La Arrolladora Banda El Limón", genre: "Banda" },

  // Banda MS
  { title: "El Color de Tus Ojos", artist: "Banda MS", genre: "Banda" },
  { title: "Mi Razón de Ser", artist: "Banda MS", genre: "Banda" },
  { title: "Hermosa Experiencia", artist: "Banda MS", genre: "Banda" },
  { title: "Háblame de Ti", artist: "Banda MS", genre: "Banda" },
  { title: "No Elegí Conocerte", artist: "Banda MS", genre: "Banda" },
  { title: "Me Vas a Extrañar", artist: "Banda MS", genre: "Banda" },

  // Ramón Ayala
  { title: "Tragos Amargos", artist: "Ramón Ayala", genre: "Norteño" },
  { title: "Un Rinconcito En El Cielo", artist: "Ramón Ayala", genre: "Norteño" },
  { title: "Bonita Finca de Adobe", artist: "Ramón Ayala", genre: "Norteño" },
  { title: "Mi Piquito de Oro", artist: "Ramón Ayala", genre: "Norteño" },
  { title: "Que Siga La Ensalada", artist: "Ramón Ayala", genre: "Norteño" },

  // Intocable
  { title: "Y Todo Para Qué", artist: "Intocable", genre: "Norteño" },
  { title: "Fuerte No Soy", artist: "Intocable", genre: "Norteño" },
  { title: "Sueña", artist: "Intocable", genre: "Norteño" },
  { title: "Coqueta", artist: "Intocable", genre: "Norteño" },
  { title: "Enséñame a Olvidarte", artist: "Intocable", genre: "Norteño" },
  { title: "Alguien Te Va a Hacer Llorar", artist: "Intocable", genre: "Norteño" },

  // Chalino Sánchez
  { title: "Alma Enamorada", artist: "Chalino Sánchez", genre: "Corrido" },
  { title: "Nieves de Enero", artist: "Chalino Sánchez", genre: "Corrido" },
  { title: "Baraja de Oro", artist: "Chalino Sánchez", genre: "Corrido" },
  { title: "Prenda Alma", artist: "Chalino Sánchez", genre: "Corrido" },
  { title: "Flor de Capomo", artist: "Chalino Sánchez", genre: "Corrido" },

  // Pepe Aguilar
  { title: "Por Mujeres Como Tú", artist: "Pepe Aguilar", genre: "Ranchera" },
  { title: "Directo al Corazón", artist: "Pepe Aguilar", genre: "Ranchera" },
  { title: "Me Vas a Extrañar", artist: "Pepe Aguilar", genre: "Ranchera" },
  { title: "Prometiste", artist: "Pepe Aguilar", genre: "Ranchera" },
  { title: "Mi Credo", artist: "Pepe Aguilar", genre: "Ranchera" },

  // Julión Álvarez
  { title: "Terrenal", artist: "Julión Álvarez", genre: "Norteño Banda" },
  { title: "Te Hubieras Ido Antes", artist: "Julión Álvarez", genre: "Norteño Banda" },
  { title: "Y Así Fue", artist: "Julión Álvarez", genre: "Norteño Banda" },
  { title: "El Amor De Su Vida", artist: "Julión Álvarez", genre: "Norteño Banda" },
  { title: "Afuera Está Lloviendo", artist: "Julión Álvarez", genre: "Norteño Banda" },
  { title: "La María", artist: "Julión Álvarez", genre: "Norteño Banda" },

  // Calibre 50
  { title: "A La Antigüita", artist: "Calibre 50", genre: "Norteño Banda" },
  { title: "Siempre Te Voy A Querer", artist: "Calibre 50", genre: "Norteño Banda" },
  { title: "Simplemente Gracias", artist: "Calibre 50", genre: "Norteño Banda" },
  { title: "Corrido de Juanito", artist: "Calibre 50", genre: "Corrido" },
  { title: "Contigo", artist: "Calibre 50", genre: "Norteño Banda" },

  // Christian Nodal
  { title: "Adiós Amor", artist: "Christian Nodal", genre: "Mariacheño" },
  { title: "De Los Besos Que Te Di", artist: "Christian Nodal", genre: "Mariacheño" },
  { title: "No Te Contaron Mal", artist: "Christian Nodal", genre: "Mariacheño" },
  { title: "Botella Tras Botella", artist: "Christian Nodal", genre: "Mariacheño" },
  { title: "Ya No Somos Ni Seremos", artist: "Christian Nodal", genre: "Mariacheño" },

  // Natanael Cano
  { title: "Amor Tumbado", artist: "Natanael Cano", genre: "Corrido Tumbado" },
  { title: "Pacas de a Kilo", artist: "Natanael Cano", genre: "Corrido Tumbado" },
  { title: "El Drip", artist: "Natanael Cano", genre: "Corrido Tumbado" },
  { title: "Mi Bello Ángel", artist: "Natanael Cano", genre: "Corrido Tumbado" },
  { title: "PRC", artist: "Peso Pluma x Natanael Cano", genre: "Corrido Tumbado" },

  // Peso Pluma
  { title: "Ella Baila Sola", artist: "Eslabón Armado x Peso Pluma", genre: "Corrido Tumbado" },
  { title: "PRC", artist: "Peso Pluma x Natanael Cano", genre: "Corrido Tumbado" },
  { title: "Lady Gaga", artist: "Peso Pluma x Gabito Ballesteros x Junior H", genre: "Corrido Tumbado" },
  { title: "La Bebé (Remix)", artist: "Yng Lvcas x Peso Pluma", genre: "Reggaeton" },
  { title: "Nueva Vida", artist: "Peso Pluma", genre: "Corrido Tumbado" },

  // Fuerza Regida
  { title: "Sabor Fresa", artist: "Fuerza Regida", genre: "Corrido Tumbado" },
  { title: "TQM", artist: "Fuerza Regida", genre: "Corrido Tumbado" },
  { title: "Harley Quinn", artist: "Fuerza Regida x Chino Pacas", genre: "Corrido Tumbado" },
  { title: "Qué Onda", artist: "Calle 24 x Chino Pacas x Fuerza Regida", genre: "Corrido Tumbado" },
  { title: "El Deportivo", artist: "Fuerza Regida", genre: "Corrido Tumbado" },

  // Grupo Frontera
  { title: "No Se Va", artist: "Grupo Frontera", genre: "Norteño" },
  { title: "un x100to", artist: "Grupo Frontera x Bad Bunny", genre: "Norteño" },
  { title: "Tulum", artist: "Peso Pluma x Grupo Frontera", genre: "Norteño" },
  { title: "El Amor de Su Vida", artist: "Grupo Frontera x Grupo Firme", genre: "Norteño" },
  { title: "Di Que Sí", artist: "Grupo Frontera x Marca Registrada", genre: "Norteño" },

  // Junior H
  { title: "Fin de Semana", artist: "Junior H x Oscar Maydon", genre: "Corrido Tumbado" },
  { title: "El Azul", artist: "Junior H x Peso Pluma", genre: "Corrido Tumbado" },
  { title: "Y Llora", artist: "Junior H", genre: "Corrido Tumbado" },
  { title: "Luna", artist: "Peso Pluma x Junior H", genre: "Corrido Tumbado" },
  { title: "Extassy Model", artist: "Junior H", genre: "Corrido Tumbado" },

  // Carín León
  { title: "Primera Cita", artist: "Carín León", genre: "Regional Mexicano" },
  { title: "La Boda del Huitlacoche", artist: "Carín León", genre: "Regional Mexicano" },
  { title: "Según Quién", artist: "Carín León x Maluma", genre: "Regional Mexicano" },
  { title: "Que Vuelvas", artist: "Carín León x Grupo Frontera", genre: "Regional Mexicano" },
  { title: "El Tóxico", artist: "Grupo Firme x Carín León", genre: "Regional Mexicano" }
];

async function run() {
  console.log(`=== Sembrando ${songs.length} canciones de artistas mexicanos populares ===`);
  console.log(`URL de la Base de Datos: ${dbUrl}`);

  // Preparar el payload del PATCH
  const patchPayload = {};
  songs.forEach((song, idx) => {
    // Generar un ID único predecible basado en el título y el artista
    const cleanArtist = song.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTitle = song.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = `seeded_mex_${cleanArtist}_${cleanTitle}_${idx}`;
    
    patchPayload[id] = {
      title: song.title.trim(),
      artist: song.artist.trim(),
      genre: song.genre.trim(),
      globalRequests: 1
    };
  });

  try {
    const res = await fetch(`${dbUrl}/autocomplete_songs.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchPayload)
    });

    if (res.ok) {
      console.log(`🎉 ¡Éxito! Se han sembrado/combinado ${songs.length} canciones exitosamente en la base de datos.`);
    } else {
      console.error(`❌ Error en la respuesta de Firebase: ${res.status} - ${await res.text()}`);
    }
  } catch (err) {
    console.error("❌ Error al realizar la petición PATCH:", err.message);
  }
}

run();
