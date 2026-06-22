// Script de siembra masiva de 500+ canciones populares en eventos sociales en México
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";

const songs = [
  {
    "title": "17 Años",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "El Listón de Tu Pelo",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Cómo Te Voy a Olvidar",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Mis Sentimientos",
    "artist": "Los Ángeles Azules x Ximena Sariñana",
    "genre": "Cumbia"
  },
  {
    "title": "Mi Niña Mujer",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Entrega de Amor",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Las Maravillas de la Vida",
    "artist": "Los Ángeles Azules x Lalo Ebratt",
    "genre": "Cumbia"
  },
  {
    "title": "Nunca Es Suficiente",
    "artist": "Los Ángeles Azules x Natalia Lafourcade",
    "genre": "Cumbia"
  },
  {
    "title": "Amor A Primera Vista",
    "artist": "Los Ángeles Azules x Belinda x Lalo Ebratt",
    "genre": "Cumbia"
  },
  {
    "title": "El Pecado",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "20 Rosas",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia del Infinito",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Acaríñame",
    "artist": "Los Ángeles Azules x Julieta Venegas",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia Para Cantar",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Hay Amor",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Como La Flor",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Amor Prohibido",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Bidi Bidi Bom Bom",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "El Chico del Apartamento 512",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Si Una Vez",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "No Me Queda Más",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "La Carcacha",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Techno Cumbia",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Baila Esta Cumbia",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Fotos y Recuerdos",
    "artist": "Selena",
    "genre": "Cumbia"
  },
  {
    "title": "Que Nadie Sepa Mi Sufrir",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Mi Cucu",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Escándalo",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Oye",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "El Viejo del Sombrerón",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Se Me Perdió la Cadenita",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "La Parabólica",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "La Cortina",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Maruja",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "La Pollera Colorá",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Capullo y Sorullo",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Mil Horas",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "A Mover la Colita",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "El Africano",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "La Suavecita",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Mete y Saca",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Sola con mi Soledad",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia de la Cadenita",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Amor de mis Amores",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Tiene Espinas el Rosal",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "No Te Voy a Perdonar",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Echarme al Olvido",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Hasta el Cielo Sentirás",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Pipiripau",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "El Campanero",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Cinco Minutos",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Palacio de Amor",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "La Ladrona",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Traición y Olvido",
    "artist": "Grupo Cañaveral",
    "genre": "Cumbia"
  },
  {
    "title": "Mi Dulce Niña",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Sabes a Chocolate",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Na Na Na (Dulce Niña)",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Fuego",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Te Quiero A Ti",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Shhh!",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Boom Boom",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Azúcar",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Pachuco",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Desde Que No Estás Aquí",
    "artist": "Kumbia Kings",
    "genre": "Cumbia"
  },
  {
    "title": "Que Bello",
    "artist": "Margarita la Diosa de la Cumbia",
    "genre": "Cumbia"
  },
  {
    "title": "Mi Bombón",
    "artist": "Margarita la Diosa de la Cumbia",
    "genre": "Cumbia"
  },
  {
    "title": "Colegiala",
    "artist": "Margarita la Diosa de la Cumbia",
    "genre": "Cumbia"
  },
  {
    "title": "Aunque No Sea Conmigo",
    "artist": "Celso Piña x Café Tacvba",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia Sobre el Río",
    "artist": "Celso Piña x Control Machete",
    "genre": "Cumbia"
  },
  {
    "title": "Los Caminos de la Vida",
    "artist": "Celso Piña",
    "genre": "Cumbia"
  },
  {
    "title": "Reina de Cumbias",
    "artist": "Celso Piña",
    "genre": "Cumbia"
  },
  {
    "title": "Juana La Cubana",
    "artist": "Fito Olivares",
    "genre": "Cumbia"
  },
  {
    "title": "El Colesterol",
    "artist": "Fito Olivares",
    "genre": "Cumbia"
  },
  {
    "title": "La Güera Salomé",
    "artist": "Fito Olivares",
    "genre": "Cumbia"
  },
  {
    "title": "Desvelado",
    "artist": "Bobby Pulido",
    "genre": "Cumbia / Tejano"
  },
  {
    "title": "Se Murió de Amor",
    "artist": "Bobby Pulido",
    "genre": "Cumbia / Tejano"
  },
  {
    "title": "Llegaste a Mi Vida",
    "artist": "Bobby Pulido",
    "genre": "Cumbia / Tejano"
  },
  {
    "title": "Muchachita Consentida",
    "artist": "Rayito Colombiano",
    "genre": "Cumbia"
  },
  {
    "title": "Besar Tu Piel",
    "artist": "Rayito Colombiano",
    "genre": "Cumbia"
  },
  {
    "title": "Al Despertar",
    "artist": "Rayito Colombiano",
    "genre": "Cumbia"
  },
  {
    "title": "¡Ay! El Amor",
    "artist": "Los Askis",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia Azteca",
    "artist": "Los Askis",
    "genre": "Cumbia"
  },
  {
    "title": "Amor Regresa",
    "artist": "Los Askis",
    "genre": "Cumbia"
  },
  {
    "title": "¿Quién Pompo?",
    "artist": "Chico Che y La Crisis",
    "genre": "Cumbia"
  },
  {
    "title": "De Quén Chon",
    "artist": "Chico Che y La Crisis",
    "genre": "Cumbia"
  },
  {
    "title": "Llorar y Llorar",
    "artist": "Los Socios del Ritmo",
    "genre": "Cumbia"
  },
  {
    "title": "Felicidad",
    "artist": "Los Socios del Ritmo",
    "genre": "Cumbia"
  },
  {
    "title": "El Año Viejo",
    "artist": "Tony Camargo",
    "genre": "Tropical / Cumbia"
  },
  {
    "title": "La Boa",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Cumbia"
  },
  {
    "title": "Perfume de Gardenias",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Cumbia"
  },
  {
    "title": "Luces de Nueva York",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Cumbia"
  },
  {
    "title": "El Ladrón",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Cumbia"
  },
  {
    "title": "Sergio el Bailador",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Que No Quede Huella",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Oro",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Con Zapatos de Tacón",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Adoro",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Dos Mujeres Un Camino",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Libros Tontos",
    "artist": "Bronco",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Chona",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Tucanazo",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Espejeando",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Amor Platónico",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Me Gusta Vivir de Noche",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Centenario",
    "artist": "Los Tucanes de Tijuana",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Puerta Negra",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Mesa del Rincón",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Jefe de Jefes",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Golpes en el Corazón",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Ni Parientes Somos",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Pedro y Pablo",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Directo al Corazón",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Jaula de Oro",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Manzanita",
    "artist": "Los Tigres del Norte",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Rey",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Hermoso Cariño",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Volver Volver",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Acá Entre Nos",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Mujeres Divinas",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Por Tu Maldito Amor",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Estos Celos",
    "artist": "Vicente Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Me Dediqué a Perderte",
    "artist": "Alejandro Fernández",
    "genre": "Pop / Mariachi"
  },
  {
    "title": "Como Quien Pierde Una Estrella",
    "artist": "Alejandro Fernández",
    "genre": "Mariachi"
  },
  {
    "title": "Mátalas",
    "artist": "Alejandro Fernández",
    "genre": "Mariachi"
  },
  {
    "title": "Nube Viajera",
    "artist": "Alejandro Fernández",
    "genre": "Mariachi"
  },
  {
    "title": "Caballero",
    "artist": "Alejandro Fernández",
    "genre": "Mariachi"
  },
  {
    "title": "Adiós Amor",
    "artist": "Christian Nodal",
    "genre": "Regional Mexicano"
  },
  {
    "title": "De Los Besos Que Te Di",
    "artist": "Christian Nodal",
    "genre": "Regional Mexicano"
  },
  {
    "title": "No Te Contaron Mal",
    "artist": "Christian Nodal",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Probablemente",
    "artist": "Christian Nodal",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Botella Tras Botella",
    "artist": "Gera MX x Christian Nodal",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Boda del Huitlacoche",
    "artist": "Carin León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Primera Cita",
    "artist": "Carin León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Que Vuelvas",
    "artist": "Carin León x Grupo Frontera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Secuelas de Amor",
    "artist": "Carin León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Tóxico",
    "artist": "Grupo Firme x Carin León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Color de Tus Ojos",
    "artist": "Banda MS",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Mi Mayor Anhelo",
    "artist": "Banda MS",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Hermosa Experiencia",
    "artist": "Banda MS",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Háblame de Ti",
    "artist": "Banda MS",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Me Vas a Extrañar",
    "artist": "Banda MS",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Ruido de Tus Zapatos",
    "artist": "La Arrolladora Banda El Limón",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Llamada de Mi Ex",
    "artist": "La Arrolladora Banda El Limón",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Calabaza",
    "artist": "La Arrolladora Banda El Limón",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Sobre Mis Pies",
    "artist": "La Arrolladora Banda El Limón",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Te Presumo",
    "artist": "Banda El Recodo",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Y Llegaste Tú",
    "artist": "Banda El Recodo",
    "genre": "Regional Mexicano"
  },
  {
    "title": "La Mejor de Todas",
    "artist": "Banda El Recodo",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Vas a Llorar por Mí",
    "artist": "Banda El Recodo",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Terrenal",
    "artist": "Julión Álvarez y su Norteño Banda",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Te Hubieras Ido Antes",
    "artist": "Julión Álvarez",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Y Fue Así",
    "artist": "Julión Álvarez",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Afuera Está Lloviendo",
    "artist": "Julión Álvarez",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Márchate",
    "artist": "Julión Álvarez",
    "genre": "Regional Mexicano"
  },
  {
    "title": "No Se Va",
    "artist": "Grupo Frontera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "un x100to",
    "artist": "Grupo Frontera x Bad Bunny",
    "genre": "Regional / Urbano"
  },
  {
    "title": "Tulum",
    "artist": "Peso Pluma x Grupo Frontera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Ya Superame",
    "artist": "Grupo Firme",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Cada Quien",
    "artist": "Grupo Firme x Maluma",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Amor No Fue Pa Mí",
    "artist": "Grupo Firme",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Ella Baila Sola",
    "artist": "Eslabon Armado x Peso Pluma",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Lady Gaga",
    "artist": "Peso Pluma x Gabito Ballesteros",
    "genre": "Regional Mexicano"
  },
  {
    "title": "PRC",
    "artist": "Peso Pluma x Natanael Cano",
    "genre": "Corridos Tumbados"
  },
  {
    "title": "AMG",
    "artist": "Natanael Cano x Peso Pluma x Gabito Ballesteros",
    "genre": "Corridos Tumbados"
  },
  {
    "title": "Tatuajes",
    "artist": "Joan Sebastian",
    "genre": "Regional / Balada"
  },
  {
    "title": "Secreto de Amor",
    "artist": "Joan Sebastian",
    "genre": "Regional / Balada"
  },
  {
    "title": "Sentimental",
    "artist": "Joan Sebastian",
    "genre": "Regional / Balada"
  },
  {
    "title": "Rumores",
    "artist": "Joan Sebastian",
    "genre": "Regional / Balada"
  },
  {
    "title": "Eso y Más",
    "artist": "Joan Sebastian",
    "genre": "Regional / Balada"
  },
  {
    "title": "Si No Te Hubieras Ido",
    "artist": "Marco Antonio Solís",
    "genre": "Pop / Balada"
  },
  {
    "title": "Más Que Tu Amigo",
    "artist": "Marco Antonio Solís",
    "genre": "Regional / Cumbia"
  },
  {
    "title": "Mi Fantasía",
    "artist": "Los Bukis",
    "genre": "Regional / Balada"
  },
  {
    "title": "Tu Cárcel",
    "artist": "Los Bukis",
    "genre": "Regional / Balada"
  },
  {
    "title": "Y Todo Para Qué",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "Fuerte No Soy",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "Sueña",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "Coqueta",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "Eres Mi Droga",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "Alguien Te Va a Hacer Llorar",
    "artist": "Intocable",
    "genre": "Norteño / Tejano"
  },
  {
    "title": "La Chacalosa",
    "artist": "Jenni Rivera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Inolvidable",
    "artist": "Jenni Rivera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Basta Ya",
    "artist": "Jenni Rivera",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Mi Olvido",
    "artist": "Banda El Limón",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Alineando Cabritos",
    "artist": "Los Cardenales de Nuevo León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Mi Cómplice",
    "artist": "Los Cardenales de Nuevo León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Belleza de Cantina",
    "artist": "Los Cardenales de Nuevo León",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Las Mañanitas",
    "artist": "Mariachi Vargas",
    "genre": "Mariachi / Cumpleaños"
  },
  {
    "title": "La Bikina",
    "artist": "Luis Miguel x Mariachi",
    "genre": "Mariachi / Pop"
  },
  {
    "title": "Sabes Una Cosa",
    "artist": "Luis Miguel x Mariachi",
    "genre": "Mariachi"
  },
  {
    "title": "Lamento Boliviano",
    "artist": "Enanitos Verdes",
    "genre": "Rock en Español"
  },
  {
    "title": "La Muralla Verde",
    "artist": "Enanitos Verdes",
    "genre": "Rock en Español"
  },
  {
    "title": "Guerras de Amor",
    "artist": "Enanitos Verdes",
    "genre": "Rock en Español"
  },
  {
    "title": "Tus Viejas Cartas",
    "artist": "Enanitos Verdes",
    "genre": "Rock en Español"
  },
  {
    "title": "Te Vi En Un Tren",
    "artist": "Enanitos Verdes",
    "genre": "Rock en Español"
  },
  {
    "title": "Rayando el Sol",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "Oye Mi Amor",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "Clavado En Un Bar",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "En El Muelle de San Blas",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "Labios Compartidos",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "Mariposa Traicionera",
    "artist": "Maná",
    "genre": "Rock en Español"
  },
  {
    "title": "Afuera",
    "artist": "Caifanes",
    "genre": "Rock en Español"
  },
  {
    "title": "La Célula Que Explota",
    "artist": "Caifanes",
    "genre": "Rock en Español"
  },
  {
    "title": "Viento",
    "artist": "Caifanes",
    "genre": "Rock en Español"
  },
  {
    "title": "Nubes",
    "artist": "Caifanes",
    "genre": "Rock en Español"
  },
  {
    "title": "No Dejes Que...",
    "artist": "Caifanes",
    "genre": "Rock en Español"
  },
  {
    "title": "La Negra Tomasa",
    "artist": "Caifanes",
    "genre": "Rock / Cumbia"
  },
  {
    "title": "Música Ligera",
    "artist": "Soda Stereo",
    "genre": "Rock en Español"
  },
  {
    "title": "Persiana Americana",
    "artist": "Soda Stereo",
    "genre": "Rock en Español"
  },
  {
    "title": "Nada Personal",
    "artist": "Soda Stereo",
    "genre": "Rock en Español"
  },
  {
    "title": "Cuando Pase el Temblor",
    "artist": "Soda Stereo",
    "genre": "Rock en Español"
  },
  {
    "title": "Devuélveme a mi Chica",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "El Ataque de las Chicas Cocodrilo",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "Venezia",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "Te Quiero",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "Ingrata",
    "artist": "Café Tacvba",
    "genre": "Rock en Español"
  },
  {
    "title": "Las Flores",
    "artist": "Café Tacvba",
    "genre": "Rock en Español"
  },
  {
    "title": "El Baile y el Salón",
    "artist": "Café Tacvba",
    "genre": "Rock en Español"
  },
  {
    "title": "Chilanga Banda",
    "artist": "Café Tacvba",
    "genre": "Rock en Español"
  },
  {
    "title": "Eres",
    "artist": "Café Tacvba",
    "genre": "Rock en Español"
  },
  {
    "title": "La Dosis Perfecta",
    "artist": "Panteón Rococó",
    "genre": "Ska / Rock"
  },
  {
    "title": "La Carencia",
    "artist": "Panteón Rococó",
    "genre": "Ska / Rock"
  },
  {
    "title": "Vendedora de Caricias",
    "artist": "Panteón Rococó",
    "genre": "Ska / Rock"
  },
  {
    "title": "Acábame de Matar",
    "artist": "Panteón Rococó",
    "genre": "Ska / Rock"
  },
  {
    "title": "Amargo Adiós",
    "artist": "Inspector",
    "genre": "Ska"
  },
  {
    "title": "Amnesia",
    "artist": "Inspector",
    "genre": "Ska"
  },
  {
    "title": "Y Qué",
    "artist": "Inspector",
    "genre": "Ska"
  },
  {
    "title": "Chuntaro Style",
    "artist": "El Gran Silencio",
    "genre": "Ska / Cumbia"
  },
  {
    "title": "Dormir Soñando",
    "artist": "El Gran Silencio",
    "genre": "Ska"
  },
  {
    "title": "Matador",
    "artist": "Los Fabulosos Cadillacs",
    "genre": "Rock / Ska"
  },
  {
    "title": "Vasos Vacíos",
    "artist": "Los Fabulosos Cadillacs x Celia Cruz",
    "genre": "Rock / Ska"
  },
  {
    "title": "Siguiendo la Luna",
    "artist": "Los Fabulosos Cadillacs",
    "genre": "Rock / Ska"
  },
  {
    "title": "Mal Bicho",
    "artist": "Los Fabulosos Cadillacs",
    "genre": "Rock / Ska"
  },
  {
    "title": "El Loco",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "La Guitarra",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "Loco (Tu Forma de Ser)",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "Corazón",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "Osito de Peluche de Taiwán",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "Gimme Tha Power",
    "artist": "Molotov",
    "genre": "Rock en Español"
  },
  {
    "title": "Frijolero",
    "artist": "Molotov",
    "genre": "Rock en Español"
  },
  {
    "title": "Rastamandita",
    "artist": "Molotov",
    "genre": "Rock en Español"
  },
  {
    "title": "Amateur",
    "artist": "Molotov",
    "genre": "Rock en Español"
  },
  {
    "title": "Kumbala",
    "artist": "La Maldita Vecindad",
    "genre": "Rock / Ska"
  },
  {
    "title": "Pachuco",
    "artist": "La Maldita Vecindad",
    "genre": "Rock / Ska"
  },
  {
    "title": "Solín",
    "artist": "La Maldita Vecindad",
    "genre": "Rock / Ska"
  },
  {
    "title": "Microbito",
    "artist": "Fobia",
    "genre": "Rock en Español"
  },
  {
    "title": "Veneno Vil",
    "artist": "Fobia",
    "genre": "Rock en Español"
  },
  {
    "title": "El Diablo",
    "artist": "Fobia",
    "genre": "Rock en Español"
  },
  {
    "title": "Es Tan Fácil Romper un Corazón",
    "artist": "Miguel Mateos",
    "genre": "Rock en Español"
  },
  {
    "title": "Cuando Seas Grande",
    "artist": "Miguel Mateos",
    "genre": "Rock en Español"
  },
  {
    "title": "Lobo Hombre en París",
    "artist": "La Unión",
    "genre": "Rock en Español"
  },
  {
    "title": "En Algún Lugar",
    "artist": "Duncan Dhu",
    "genre": "Rock en Español"
  },
  {
    "title": "La Flaca",
    "artist": "Jarabe de Palo",
    "genre": "Rock en Español"
  },
  {
    "title": "Depende",
    "artist": "Jarabe de Palo",
    "genre": "Rock en Español"
  },
  {
    "title": "Bonito",
    "artist": "Jarabe de Palo",
    "genre": "Rock en Español"
  },
  {
    "title": "Afueras de la Ciudad",
    "artist": "Zoe",
    "genre": "Rock en Español"
  },
  {
    "title": "Labios Rotos",
    "artist": "Zoe",
    "genre": "Rock en Español"
  },
  {
    "title": "Soñé",
    "artist": "Zoe",
    "genre": "Rock en Español"
  },
  {
    "title": "Ahora Te Puedes Marchar",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "La Chica del Bikini Azul",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "Cuando Calienta el Sol",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "Suave",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "Será Que No Me Amas",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "Isabel",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "Culpable o No",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Fría Como el Viento",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "La Incondicional",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Entrégate",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Tengo Todo Excepto a Ti",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Hasta Que Me Olvides",
    "artist": "Luis Miguel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Un Hombre Busca Una Mujer",
    "artist": "Luis Miguel",
    "genre": "Pop Latino"
  },
  {
    "title": "No Sé Tú",
    "artist": "Luis Miguel",
    "genre": "Pop / Bolero"
  },
  {
    "title": "El Noa Noa",
    "artist": "Juan Gabriel",
    "genre": "Pop Latino"
  },
  {
    "title": "Querida",
    "artist": "Juan Gabriel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Caray",
    "artist": "Juan Gabriel",
    "genre": "Pop / Regional"
  },
  {
    "title": "Me Nace del Corazón",
    "artist": "Juan Gabriel",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Pero Qué Necesidad",
    "artist": "Juan Gabriel",
    "genre": "Pop Latino"
  },
  {
    "title": "Te Lo Pido Por Favor",
    "artist": "Juan Gabriel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Abrázame Muy Fuerte",
    "artist": "Juan Gabriel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Hasta Que Te Conocí",
    "artist": "Juan Gabriel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Así Fue",
    "artist": "Juan Gabriel",
    "genre": "Pop / Balada"
  },
  {
    "title": "Torero",
    "artist": "Chayanne",
    "genre": "Pop Latino"
  },
  {
    "title": "Provócame",
    "artist": "Chayanne",
    "genre": "Pop Latino"
  },
  {
    "title": "Salomé",
    "artist": "Chayanne",
    "genre": "Pop Latino"
  },
  {
    "title": "Dejaría Todo",
    "artist": "Chayanne",
    "genre": "Pop / Balada"
  },
  {
    "title": "Un Siglo Sin Ti",
    "artist": "Chayanne",
    "genre": "Pop / Balada"
  },
  {
    "title": "Azul",
    "artist": "Cristian Castro",
    "genre": "Pop Latino"
  },
  {
    "title": "No Podrás",
    "artist": "Cristian Castro",
    "genre": "Pop Latino"
  },
  {
    "title": "Lloviendo Estrellas",
    "artist": "Cristian Castro",
    "genre": "Pop Latino"
  },
  {
    "title": "Es Mejor Así",
    "artist": "Cristian Castro",
    "genre": "Pop Latino"
  },
  {
    "title": "Gallito Feliz",
    "artist": "Cristian Castro",
    "genre": "Pop Latino"
  },
  {
    "title": "La Chica de Humo",
    "artist": "Emmanuel",
    "genre": "Pop Latino"
  },
  {
    "title": "Toda La Vida",
    "artist": "Emmanuel",
    "genre": "Pop Latino"
  },
  {
    "title": "Bella Señora",
    "artist": "Emmanuel",
    "genre": "Pop Latino"
  },
  {
    "title": "Soldado del Amor",
    "artist": "Mijares",
    "genre": "Pop Latino"
  },
  {
    "title": "Para Amarnos Más",
    "artist": "Mijares",
    "genre": "Pop / Balada"
  },
  {
    "title": "El Privilegio de Amar",
    "artist": "Mijares x Lucero",
    "genre": "Pop / Balada"
  },
  {
    "title": "Baño de Mujeres",
    "artist": "Mijares",
    "genre": "Pop Latino"
  },
  {
    "title": "Maldita Primavera",
    "artist": "Yuri",
    "genre": "Pop Latino"
  },
  {
    "title": "El Apagón",
    "artist": "Yuri",
    "genre": "Pop Latino"
  },
  {
    "title": "Detrás de Mi Ventana",
    "artist": "Yuri",
    "genre": "Pop / Balada"
  },
  {
    "title": "Hombres al Borde de un Ataque de Celos",
    "artist": "Yuri",
    "genre": "Pop Latino"
  },
  {
    "title": "Con Todos Menos Conmigo",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "Tú y Yo Somos Uno Mismo",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "Correr Tras el Viento",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "Princesa Tibetana",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "Besos de Ceniza",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "No Sé Si Es Amor",
    "artist": "Timbiriche",
    "genre": "Pop Latino"
  },
  {
    "title": "Bazar",
    "artist": "Flans",
    "genre": "Pop Latino"
  },
  {
    "title": "No Controles",
    "artist": "Flans",
    "genre": "Pop Latino"
  },
  {
    "title": "Las Mil y Una Noches",
    "artist": "Flans",
    "genre": "Pop Latino"
  },
  {
    "title": "Cómo Te Va Mi Amor",
    "artist": "Pandora",
    "genre": "Pop Latino"
  },
  {
    "title": "La Calle de las Sirenas",
    "artist": "Kabah",
    "genre": "Pop Latino"
  },
  {
    "title": "Al Pasito",
    "artist": "Kabah",
    "genre": "Pop Latino"
  },
  {
    "title": "Mai Mai",
    "artist": "Kabah",
    "genre": "Pop Latino"
  },
  {
    "title": "Shabadabada",
    "artist": "OV7",
    "genre": "Pop Latino"
  },
  {
    "title": "Enloquéceme",
    "artist": "OV7",
    "genre": "Pop Latino"
  },
  {
    "title": "Te Quiero Tanto, Tanto",
    "artist": "OV7",
    "genre": "Pop Latino"
  },
  {
    "title": "Mírame a los Ojos",
    "artist": "OV7",
    "genre": "Pop Latino"
  },
  {
    "title": "Vuela Vuela",
    "artist": "Magneto",
    "genre": "Pop Latino"
  },
  {
    "title": "Azúcar Amargo",
    "artist": "Fey",
    "genre": "Pop Latino"
  },
  {
    "title": "Media Naranja",
    "artist": "Fey",
    "genre": "Pop Latino"
  },
  {
    "title": "Muévelo",
    "artist": "Fey",
    "genre": "Pop Latino"
  },
  {
    "title": "Hips Don't Lie",
    "artist": "Shakira x Wyclef Jean",
    "genre": "Pop Latino / Urbano"
  },
  {
    "title": "Antología",
    "artist": "Shakira",
    "genre": "Pop / Balada"
  },
  {
    "title": "Ciega, Sordomuda",
    "artist": "Shakira",
    "genre": "Pop Latino"
  },
  {
    "title": "Suerte (Whenever, Wherever)",
    "artist": "Shakira",
    "genre": "Pop Latino"
  },
  {
    "title": "Inevitable",
    "artist": "Shakira",
    "genre": "Pop Latino"
  },
  {
    "title": "Ojos Así",
    "artist": "Shakira",
    "genre": "Pop Latino"
  },
  {
    "title": "Waka Waka (This Time for Africa)",
    "artist": "Shakira",
    "genre": "Pop / Dance"
  },
  {
    "title": "Las de la Intuición",
    "artist": "Shakira",
    "genre": "Pop Latino"
  },
  {
    "title": "Shakira: Bzrp Music Sessions, Vol. 53",
    "artist": "Bizarrap x Shakira",
    "genre": "Pop / Urbano"
  },
  {
    "title": "Y Yo Sigo Aquí",
    "artist": "Paulina Rubio",
    "genre": "Pop Latino"
  },
  {
    "title": "El Último Adiós",
    "artist": "Paulina Rubio",
    "genre": "Pop Latino"
  },
  {
    "title": "Ni Una Sola Palabra",
    "artist": "Paulina Rubio",
    "genre": "Pop Latino"
  },
  {
    "title": "Amor a la Mexicana",
    "artist": "Thalía",
    "genre": "Pop Latino"
  },
  {
    "title": "Piel Morena",
    "artist": "Thalía",
    "genre": "Pop Latino"
  },
  {
    "title": "Arrasando",
    "artist": "Thalía",
    "genre": "Pop Latino"
  },
  {
    "title": "Sálvame",
    "artist": "RBD",
    "genre": "Pop Latino"
  },
  {
    "title": "Rebelde",
    "artist": "RBD",
    "genre": "Pop Latino"
  },
  {
    "title": "Solo Quédate En Silencio",
    "artist": "RBD",
    "genre": "Pop Latino"
  },
  {
    "title": "Tras De Mí",
    "artist": "RBD",
    "genre": "Pop Latino"
  },
  {
    "title": "Nuestro Amor",
    "artist": "RBD",
    "genre": "Pop Latino"
  },
  {
    "title": "Livin' la Vida Loca",
    "artist": "Ricky Martin",
    "genre": "Pop Latino"
  },
  {
    "title": "La Copa de la Vida",
    "artist": "Ricky Martin",
    "genre": "Pop Latino"
  },
  {
    "title": "Pégate",
    "artist": "Ricky Martin",
    "genre": "Pop Latino"
  },
  {
    "title": "María",
    "artist": "Ricky Martin",
    "genre": "Pop Latino"
  },
  {
    "title": "Dr. Psiquiatra",
    "artist": "Gloria Trevi",
    "genre": "Pop Latino"
  },
  {
    "title": "Todos Me Miran",
    "artist": "Gloria Trevi",
    "genre": "Pop Latino"
  },
  {
    "title": "Con los Ojos Cerrados",
    "artist": "Gloria Trevi",
    "genre": "Pop / Balada"
  },
  {
    "title": "Cinco Minutos",
    "artist": "Gloria Trevi",
    "genre": "Pop Latino"
  },
  {
    "title": "Gasolina",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Pelo Suelto",
    "artist": "Gloria Trevi",
    "genre": "Pop Latino"
  },
  {
    "title": "Gasolina",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Lo Que Pasó, Pasó",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Rompe",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Llamado de Emergencia",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Limbo",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón / Pop"
  },
  {
    "title": "Danza Kuduro",
    "artist": "Don Omar x Lucenzo",
    "genre": "Urbano / Dance"
  },
  {
    "title": "Dile",
    "artist": "Don Omar",
    "genre": "Reggaetón"
  },
  {
    "title": "Pobre Diabla",
    "artist": "Don Omar",
    "genre": "Reggaetón"
  },
  {
    "title": "Salió El Sol",
    "artist": "Don Omar",
    "genre": "Reggaetón"
  },
  {
    "title": "Virtual Diva",
    "artist": "Don Omar",
    "genre": "Reggaetón"
  },
  {
    "title": "Rakata",
    "artist": "Wisin & Yandel",
    "genre": "Reggaetón"
  },
  {
    "title": "Pam Pam",
    "artist": "Wisin & Yandel",
    "genre": "Reggaetón"
  },
  {
    "title": "Sexy Movimiento",
    "artist": "Wisin & Yandel",
    "genre": "Reggaetón"
  },
  {
    "title": "Abusadora",
    "artist": "Wisin & Yandel",
    "genre": "Reggaetón"
  },
  {
    "title": "Algo Me Gusta De Ti",
    "artist": "Wisin & Yandel x Chris Brown",
    "genre": "Reggaetón / Pop"
  },
  {
    "title": "Noche de Entierro",
    "artist": "Wisin & Yandel x Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Mayor Que Yo",
    "artist": "Wisin & Yandel x Daddy Yankee x Baby Ranks",
    "genre": "Reggaetón"
  },
  {
    "title": "Me Porto Bonito",
    "artist": "Bad Bunny x Chencho Corleone",
    "genre": "Reggaetón"
  },
  {
    "title": "Tití Me Preguntó",
    "artist": "Bad Bunny",
    "genre": "Reggaetón"
  },
  {
    "title": "Callaita",
    "artist": "Bad Bunny",
    "genre": "Reggaetón"
  },
  {
    "title": "Dakiti",
    "artist": "Bad Bunny x Jhay Cortez",
    "genre": "Reggaetón / Synth"
  },
  {
    "title": "Safaera",
    "artist": "Bad Bunny x Jowell & Randy",
    "genre": "Reggaetón"
  },
  {
    "title": "Yo Perreo Sola",
    "artist": "Bad Bunny",
    "genre": "Reggaetón"
  },
  {
    "title": "La Canción",
    "artist": "J Balvin x Bad Bunny",
    "genre": "Reggaetón"
  },
  {
    "title": "Ojitos Lindos",
    "artist": "Bad Bunny x Bomba Estéreo",
    "genre": "Reggaetón / Pop"
  },
  {
    "title": "Tusa",
    "artist": "Karol G x Nicki Minaj",
    "genre": "Reggaetón"
  },
  {
    "title": "Bichota",
    "artist": "Karol G",
    "genre": "Reggaetón"
  },
  {
    "title": "Provenza",
    "artist": "Karol G",
    "genre": "Reggaetón"
  },
  {
    "title": "TQG",
    "artist": "Karol G x Shakira",
    "genre": "Reggaetón"
  },
  {
    "title": "Mi Gente",
    "artist": "J Balvin x Willy William",
    "genre": "Urbano"
  },
  {
    "title": "Ginza",
    "artist": "J Balvin",
    "genre": "Reggaetón"
  },
  {
    "title": "Safari",
    "artist": "J Balvin x Pharrell Williams",
    "genre": "Reggaetón"
  },
  {
    "title": "Felices los 4",
    "artist": "Maluma",
    "genre": "Reggaetón / Salsa"
  },
  {
    "title": "Hawái",
    "artist": "Maluma",
    "genre": "Reggaetón"
  },
  {
    "title": "Corazón",
    "artist": "Maluma x Nego do Borel",
    "genre": "Reggaetón"
  },
  {
    "title": "Gatita",
    "artist": "Bellakath",
    "genre": "Reggaetón"
  },
  {
    "title": "Reggaetón Champagne",
    "artist": "Bellakath x Dani Flow",
    "genre": "Reggaetón"
  },
  {
    "title": "La Bebé",
    "artist": "Yng Lvcas",
    "genre": "Reggaetón"
  },
  {
    "title": "La Bebé (Remix)",
    "artist": "Yng Lvcas x Peso Pluma",
    "genre": "Reggaetón"
  },
  {
    "title": "Quevedo: Bzrp Music Sessions, Vol. 52",
    "artist": "Bizarrap x Quevedo",
    "genre": "Reggaetón"
  },
  {
    "title": "Pepas",
    "artist": "Farruko",
    "genre": "Latin Urban / Guaracha"
  },
  {
    "title": "Danza Kuduro",
    "artist": "Don Omar",
    "genre": "Reggaetón / Dance"
  },
  {
    "title": "El Taxi",
    "artist": "Pitbull x Osmani Garcia",
    "genre": "Urbano"
  },
  {
    "title": "La Gasolina",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Dura",
    "artist": "Daddy Yankee",
    "genre": "Reggaetón"
  },
  {
    "title": "Despacito",
    "artist": "Luis Fonsi x Daddy Yankee",
    "genre": "Pop / Urbano"
  },
  {
    "title": "Bailando",
    "artist": "Enrique Iglesias x Gente de Zona",
    "genre": "Pop / Tropical"
  },
  {
    "title": "Mi Gente",
    "artist": "J Balvin",
    "genre": "Reggaetón"
  },
  {
    "title": "Vivir Mi Vida",
    "artist": "Marc Anthony",
    "genre": "Salsa"
  },
  {
    "title": "Valió la Pena",
    "artist": "Marc Anthony",
    "genre": "Salsa"
  },
  {
    "title": "Ahora Quien",
    "artist": "Marc Anthony",
    "genre": "Salsa"
  },
  {
    "title": "Tu Amor Me Hace Bien",
    "artist": "Marc Anthony",
    "genre": "Salsa"
  },
  {
    "title": "Flor Pálida",
    "artist": "Marc Anthony",
    "genre": "Salsa"
  },
  {
    "title": "Que Alguien Me Diga",
    "artist": "Gilberto Santa Rosa",
    "genre": "Salsa"
  },
  {
    "title": "Conciencia",
    "artist": "Gilberto Santa Rosa",
    "genre": "Salsa"
  },
  {
    "title": "La Agarradera",
    "artist": "Gilberto Santa Rosa",
    "genre": "Salsa"
  },
  {
    "title": "La Vida Es Un Carnaval",
    "artist": "Celia Cruz",
    "genre": "Salsa"
  },
  {
    "title": "La Negra Tiene Tumbao",
    "artist": "Celia Cruz",
    "genre": "Salsa"
  },
  {
    "title": "Quimbara",
    "artist": "Celia Cruz x Johnny Pacheco",
    "genre": "Salsa"
  },
  {
    "title": "Una Aventura",
    "artist": "Grupo Niche",
    "genre": "Salsa"
  },
  {
    "title": "Cali Pachanguero",
    "artist": "Grupo Niche",
    "genre": "Salsa"
  },
  {
    "title": "Gotas de Lluvia",
    "artist": "Grupo Niche",
    "genre": "Salsa"
  },
  {
    "title": "Rebelión",
    "artist": "Joe Arroyo",
    "genre": "Salsa"
  },
  {
    "title": "En Barranquilla Me Quedo",
    "artist": "Joe Arroyo",
    "genre": "Salsa"
  },
  {
    "title": "Llorarás",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Suavemente",
    "artist": "Elvis Crespo",
    "genre": "Merengue"
  },
  {
    "title": "Pintame",
    "artist": "Elvis Crespo",
    "genre": "Merengue"
  },
  {
    "title": "Tu Sonrisa",
    "artist": "Elvis Crespo",
    "genre": "Merengue"
  },
  {
    "title": "Es Mentiroso",
    "artist": "Olga Tañón",
    "genre": "Merengue"
  },
  {
    "title": "Muchacho Malo",
    "artist": "Olga Tañón",
    "genre": "Merengue"
  },
  {
    "title": "La Bilirrubina",
    "artist": "Juan Luis Guerra",
    "genre": "Merengue"
  },
  {
    "title": "Ojalá Que Llueva Café",
    "artist": "Juan Luis Guerra",
    "genre": "Merengue / Bachata"
  },
  {
    "title": "El Niágara en Bicicleta",
    "artist": "Juan Luis Guerra",
    "genre": "Merengue"
  },
  {
    "title": "Las Avispas",
    "artist": "Juan Luis Guerra",
    "genre": "Merengue"
  },
  {
    "title": "El Costo de la Vida",
    "artist": "Juan Luis Guerra",
    "genre": "Merengue"
  },
  {
    "title": "Obsesión",
    "artist": "Aventura",
    "genre": "Bachata"
  },
  {
    "title": "Dile al Amor",
    "artist": "Aventura",
    "genre": "Bachata"
  },
  {
    "title": "Propuesta Indecente",
    "artist": "Romeo Santos",
    "genre": "Bachata"
  },
  {
    "title": "Eres Mía",
    "artist": "Romeo Santos",
    "genre": "Bachata"
  },
  {
    "title": "Darte un Beso",
    "artist": "Prince Royce",
    "genre": "Bachata"
  },
  {
    "title": "Corazón Sin Cara",
    "artist": "Prince Royce",
    "genre": "Bachata"
  },
  {
    "title": "Deja Vu",
    "artist": "Prince Royce x Shakira",
    "genre": "Bachata"
  },
  {
    "title": "Monotonía",
    "artist": "Shakira x Ozuna",
    "genre": "Bachata / Urbano"
  },
  {
    "title": "El Tiburón",
    "artist": "Proyecto Uno",
    "genre": "Merengue / Dance"
  },
  {
    "title": "Está Pegao",
    "artist": "Proyecto Uno",
    "genre": "Merengue / Dance"
  },
  {
    "title": "25 Horas al Día",
    "artist": "Proyecto Uno",
    "genre": "Merengue"
  },
  {
    "title": "La Dueña del Swing",
    "artist": "Los Hermanos Rosario",
    "genre": "Merengue"
  },
  {
    "title": "El Venao",
    "artist": "Los Cantantes",
    "genre": "Merengue"
  },
  {
    "title": "Kulikitaka",
    "artist": "Toño Rosario",
    "genre": "Merengue"
  },
  {
    "title": "Dancing Queen",
    "artist": "ABBA",
    "genre": "Disco / Pop"
  },
  {
    "title": "Mamma Mia",
    "artist": "ABBA",
    "genre": "Disco / Pop"
  },
  {
    "title": "Gimme! Gimme! Gimme!",
    "artist": "ABBA",
    "genre": "Disco / Pop"
  },
  {
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "genre": "Rock"
  },
  {
    "title": "Don't Stop Me Now",
    "artist": "Queen",
    "genre": "Rock / Pop"
  },
  {
    "title": "I Want to Break Free",
    "artist": "Queen",
    "genre": "Rock"
  },
  {
    "title": "Stayin' Alive",
    "artist": "Bee Gees",
    "genre": "Disco"
  },
  {
    "title": "Night Fever",
    "artist": "Bee Gees",
    "genre": "Disco"
  },
  {
    "title": "You Should Be Dancing",
    "artist": "Bee Gees",
    "genre": "Disco"
  },
  {
    "title": "Billie Jean",
    "artist": "Michael Jackson",
    "genre": "Pop / Dance"
  },
  {
    "title": "Beat It",
    "artist": "Michael Jackson",
    "genre": "Pop"
  },
  {
    "title": "Thriller",
    "artist": "Michael Jackson",
    "genre": "Pop / Dance"
  },
  {
    "title": "Don't Stop 'Til You Get Enough",
    "artist": "Michael Jackson",
    "genre": "Disco"
  },
  {
    "title": "September",
    "artist": "Earth, Wind & Fire",
    "genre": "Disco / Funk"
  },
  {
    "title": "Let's Groove",
    "artist": "Earth, Wind & Fire",
    "genre": "Disco / Funk"
  },
  {
    "title": "Y.M.C.A.",
    "artist": "Village People",
    "genre": "Disco"
  },
  {
    "title": "Macho Man",
    "artist": "Village People",
    "genre": "Disco"
  },
  {
    "title": "Celebration",
    "artist": "Kool & The Gang",
    "genre": "Disco / Funk"
  },
  {
    "title": "Get Down On It",
    "artist": "Kool & The Gang",
    "genre": "Disco / Funk"
  },
  {
    "title": "I Will Survive",
    "artist": "Gloria Gaynor",
    "genre": "Disco"
  },
  {
    "title": "Can't Take My Eyes Off You",
    "artist": "Gloria Gaynor",
    "genre": "Disco"
  },
  {
    "title": "Uptown Funk",
    "artist": "Mark Ronson x Bruno Mars",
    "genre": "Funk / Pop"
  },
  {
    "title": "Treasure",
    "artist": "Bruno Mars",
    "genre": "Pop / Funk"
  },
  {
    "title": "Locked Out of Heaven",
    "artist": "Bruno Mars",
    "genre": "Pop"
  },
  {
    "title": "24K Magic",
    "artist": "Bruno Mars",
    "genre": "Pop / Funk"
  },
  {
    "title": "Get Lucky",
    "artist": "Daft Punk x Pharrell Williams",
    "genre": "Dance / Funk"
  },
  {
    "title": "One More Time",
    "artist": "Daft Punk",
    "genre": "Electronic"
  },
  {
    "title": "Don't Start Now",
    "artist": "Dua Lipa",
    "genre": "Pop / Disco"
  },
  {
    "title": "Levitating",
    "artist": "Dua Lipa",
    "genre": "Pop / Disco"
  },
  {
    "title": "Fireball",
    "artist": "Pitbull",
    "genre": "Dance / Pop"
  },
  {
    "title": "Timber",
    "artist": "Pitbull x Ke$ha",
    "genre": "Dance / Pop"
  },
  {
    "title": "Give Me Everything",
    "artist": "Pitbull x Ne-Yo",
    "genre": "Dance / Pop"
  },
  {
    "title": "Feel So Close",
    "artist": "Calvin Harris",
    "genre": "EDM"
  },
  {
    "title": "Titanium",
    "artist": "David Guetta x Sia",
    "genre": "EDM"
  },
  {
    "title": "Wake Me Up",
    "artist": "Avicii",
    "genre": "EDM"
  },
  {
    "title": "Levels",
    "artist": "Avicii",
    "genre": "EDM"
  },
  {
    "title": "Ángel",
    "artist": "Belinda",
    "genre": "Pop Latino"
  },
  {
    "title": "Bella Traición",
    "artist": "Belinda",
    "genre": "Pop Latino"
  },
  {
    "title": "Luz Sin Gravedad",
    "artist": "Belinda",
    "genre": "Pop Latino"
  },
  {
    "title": "Duele el Amor",
    "artist": "Aleks Syntek x Ana Torroja",
    "genre": "Pop Latino"
  },
  {
    "title": "Sexo, Pudor y Lágrimas",
    "artist": "Aleks Syntek",
    "genre": "Pop Latino"
  },
  {
    "title": "Esa Hembra Es Mala",
    "artist": "Gloria Trevi",
    "genre": "Pop / Balada"
  },
  {
    "title": "La Tortura",
    "artist": "Shakira x Alejandro Sanz",
    "genre": "Pop Latino / Urbano"
  },
  {
    "title": "Te Felicito",
    "artist": "Shakira x Rauw Alejandro",
    "genre": "Pop / Urbano"
  },
  {
    "title": "Loco",
    "artist": "Alejandro Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Por Mujeres Como Tú",
    "artist": "Pepe Aguilar",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Prometiste",
    "artist": "Pepe Aguilar",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Yo No Fui",
    "artist": "Pedro Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "El Aventurero",
    "artist": "Pedro Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Amarte a la Antigua",
    "artist": "Pedro Fernández",
    "genre": "Mariachi / Regional"
  },
  {
    "title": "Marta Tiene un Marcapasos",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "Lo Noto",
    "artist": "Hombres G",
    "genre": "Rock en Español"
  },
  {
    "title": "Arrégname el Alma",
    "artist": "Panteón Rococó",
    "genre": "Ska / Rock"
  },
  {
    "title": "El Baile del Perrito",
    "artist": "Wilfrido Vargas",
    "genre": "Merengue"
  },
  {
    "title": "El Jardinero",
    "artist": "Wilfrido Vargas",
    "genre": "Merengue"
  },
  {
    "title": "Burbujas de Amor",
    "artist": "Juan Luis Guerra",
    "genre": "Bachata / Pop"
  },
  {
    "title": "Boogie Wonderland",
    "artist": "Earth, Wind & Fire",
    "genre": "Disco / Funk"
  },
  {
    "title": "Last Dance",
    "artist": "Donna Summer",
    "genre": "Disco"
  },
  {
    "title": "Hot Stuff",
    "artist": "Donna Summer",
    "genre": "Disco"
  },
  {
    "title": "Funkytown",
    "artist": "Lipps Inc.",
    "genre": "Disco"
  },
  {
    "title": "Baracunatana",
    "artist": "Aterciopelados",
    "genre": "Rock en Español"
  },
  {
    "title": "Bolero Falaz",
    "artist": "Aterciopelados",
    "genre": "Rock en Español"
  },
  {
    "title": "Triste Canción",
    "artist": "El Tri",
    "genre": "Rock en Español"
  },
  {
    "title": "Las Piedras Rodantes",
    "artist": "El Tri",
    "genre": "Rock en Español"
  },
  {
    "title": "El Son del Dolor",
    "artist": "La Cuca",
    "genre": "Rock en Español"
  },
  {
    "title": "La Balada",
    "artist": "La Cuca",
    "genre": "Rock en Español"
  },
  {
    "title": "El Esqueleto",
    "artist": "Víctimas del Doctor Cerebro",
    "genre": "Rock / Ska"
  },
  {
    "title": "Párate y Mira",
    "artist": "Los Pericos",
    "genre": "Reggae / Rock"
  },
  {
    "title": "Pupilas Lejanas",
    "artist": "Los Pericos",
    "genre": "Reggae / Rock"
  },
  {
    "title": "Runaway",
    "artist": "Los Pericos",
    "genre": "Reggae / Rock"
  },
  {
    "title": "El Murguero",
    "artist": "Los Auténticos Decadentes",
    "genre": "Rock / Ska"
  },
  {
    "title": "Dynamite",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Butter",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Boy With Luv",
    "artist": "BTS x Halsey",
    "genre": "Kpop"
  },
  {
    "title": "Fake Love",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "DNA",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Idol",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Mic Drop",
    "artist": "BTS x Steve Aoki",
    "genre": "Kpop"
  },
  {
    "title": "Spring Day",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Blood Sweat & Tears",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "Run BTS",
    "artist": "BTS",
    "genre": "Kpop"
  },
  {
    "title": "How You Like That",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Kill This Love",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "DDU-DU DDU-DU",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Pink Venom",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Shut Down",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "As If It's Your Last",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Boombayah",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Lovesick Girls",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Playing with Fire",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Whistle",
    "artist": "BLACKPINK",
    "genre": "Kpop"
  },
  {
    "title": "Fancy",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "What Is Love?",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "TT",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Feel Special",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "I Can't Stop Me",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "The Feels",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Alcohol-Free",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Cheer Up",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Likey",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Talk that Talk",
    "artist": "TWICE",
    "genre": "Kpop"
  },
  {
    "title": "Hype Boy",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "Ditto",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "OMG",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "Super Shy",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "Attention",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "Cookie",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "ETA",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "How Sweet",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "Bubble Gum",
    "artist": "NewJeans",
    "genre": "Kpop"
  },
  {
    "title": "God's Menu",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "S-Class",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "Maniac",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "Thunderous",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "Case 143",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "Back Door",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "LALALALA",
    "artist": "Stray Kids",
    "genre": "Kpop"
  },
  {
    "title": "Super",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Don't Wanna Cry",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Hot",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Very Nice (Aju Nice)",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Left & Right",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Maestro",
    "artist": "SEVENTEEN",
    "genre": "Kpop"
  },
  {
    "title": "Love Shot",
    "artist": "EXO",
    "genre": "Kpop"
  },
  {
    "title": "Growl",
    "artist": "EXO",
    "genre": "Kpop"
  },
  {
    "title": "Monster",
    "artist": "EXO",
    "genre": "Kpop"
  },
  {
    "title": "Call Me Baby",
    "artist": "EXO",
    "genre": "Kpop"
  },
  {
    "title": "Tempo",
    "artist": "EXO",
    "genre": "Kpop"
  },
  {
    "title": "Red Flavor",
    "artist": "Red Velvet",
    "genre": "Kpop"
  },
  {
    "title": "Psycho",
    "artist": "Red Velvet",
    "genre": "Kpop"
  },
  {
    "title": "Bad Boy",
    "artist": "Red Velvet",
    "genre": "Kpop"
  },
  {
    "title": "Feel My Rhythm",
    "artist": "Red Velvet",
    "genre": "Kpop"
  },
  {
    "title": "Queendom",
    "artist": "Red Velvet",
    "genre": "Kpop"
  },
  {
    "title": "Wannabe",
    "artist": "ITZY",
    "genre": "Kpop"
  },
  {
    "title": "Dalla Dalla",
    "artist": "ITZY",
    "genre": "Kpop"
  },
  {
    "title": "Loco",
    "artist": "ITZY",
    "genre": "Kpop"
  },
  {
    "title": "Not Shy",
    "artist": "ITZY",
    "genre": "Kpop"
  },
  {
    "title": "Sneakers",
    "artist": "ITZY",
    "genre": "Kpop"
  },
  {
    "title": "Love Dive",
    "artist": "IVE",
    "genre": "Kpop"
  },
  {
    "title": "Eleven",
    "artist": "IVE",
    "genre": "Kpop"
  },
  {
    "title": "After LIKE",
    "artist": "IVE",
    "genre": "Kpop"
  },
  {
    "title": "I AM",
    "artist": "IVE",
    "genre": "Kpop"
  },
  {
    "title": "Baddie",
    "artist": "IVE",
    "genre": "Kpop"
  },
  {
    "title": "Next Level",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Black Mamba",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Savage",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Spicy",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Drama",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Supernova",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Armageddon",
    "artist": "aespa",
    "genre": "Kpop"
  },
  {
    "title": "Fearless",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Antifragile",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Unforgiven",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Eve, Psyche & The Bluebeard's Wife",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Easy",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Smart",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "TOMBOY",
    "artist": "(G)I-DLE",
    "genre": "Kpop"
  },
  {
    "title": "Nxde",
    "artist": "(G)I-DLE",
    "genre": "Kpop"
  },
  {
    "title": "Queencard",
    "artist": "(G)I-DLE",
    "genre": "Kpop"
  },
  {
    "title": "Super Lady",
    "artist": "(G)I-DLE",
    "genre": "Kpop"
  },
  {
    "title": "Fate",
    "artist": "(G)I-DLE",
    "genre": "Kpop"
  },
  {
    "title": "Crown",
    "artist": "TXT",
    "genre": "Kpop"
  },
  {
    "title": "Blue Hour",
    "artist": "TXT",
    "genre": "Kpop"
  },
  {
    "title": "Sugar Rush Ride",
    "artist": "TXT",
    "genre": "Kpop"
  },
  {
    "title": "Deja Vu",
    "artist": "TXT",
    "genre": "Kpop"
  },
  {
    "title": "Fever",
    "artist": "ENHYPEN",
    "genre": "Kpop"
  },
  {
    "title": "Bite Me",
    "artist": "ENHYPEN",
    "genre": "Kpop"
  },
  {
    "title": "Polaroid Love",
    "artist": "ENHYPEN",
    "genre": "Kpop"
  },
  {
    "title": "Sweet Venom",
    "artist": "ENHYPEN",
    "genre": "Kpop"
  },
  {
    "title": "Bang Bang Bang",
    "artist": "BIGBANG",
    "genre": "Kpop"
  },
  {
    "title": "Fantastic Baby",
    "artist": "BIGBANG",
    "genre": "Kpop"
  },
  {
    "title": "Haru Haru",
    "artist": "BIGBANG",
    "genre": "Kpop"
  },
  {
    "title": "Gee",
    "artist": "Girls' Generation (SNSD)",
    "genre": "Kpop"
  },
  {
    "title": "The Boys",
    "artist": "Girls' Generation (SNSD)",
    "genre": "Kpop"
  },
  {
    "title": "Lilac",
    "artist": "IU",
    "genre": "Kpop"
  },
  {
    "title": "Good Day",
    "artist": "IU",
    "genre": "Kpop"
  },
  {
    "title": "Blueming",
    "artist": "IU",
    "genre": "Kpop"
  },
  {
    "title": "Eight",
    "artist": "IU x SUGA",
    "genre": "Kpop"
  },
  {
    "title": "Gangnam Style",
    "artist": "PSY",
    "genre": "Kpop"
  },
  {
    "title": "Gentleman",
    "artist": "PSY",
    "genre": "Kpop"
  },
  {
    "title": "That That",
    "artist": "PSY x SUGA",
    "genre": "Kpop"
  },
  {
    "title": "Ring Ding Dong",
    "artist": "SHINee",
    "genre": "Kpop"
  },
  {
    "title": "Sherlock",
    "artist": "SHINee",
    "genre": "Kpop"
  },
  {
    "title": "View",
    "artist": "SHINee",
    "genre": "Kpop"
  },
  {
    "title": "Sorry, Sorry",
    "artist": "Super Junior",
    "genre": "Kpop"
  },
  {
    "title": "Mr. Simple",
    "artist": "Super Junior",
    "genre": "Kpop"
  },
  {
    "title": "BBOOM BBOOM",
    "artist": "MOMOLAND",
    "genre": "Kpop"
  },
  {
    "title": "DUN DUN",
    "artist": "EVERGLOW",
    "genre": "Kpop"
  },
  {
    "title": "LA DI DA",
    "artist": "EVERGLOW",
    "genre": "Kpop"
  },
  {
    "title": "Cupid",
    "artist": "FIFTY FIFTY",
    "genre": "Kpop"
  },
  {
    "title": "ASAP",
    "artist": "STAYC",
    "genre": "Kpop"
  },
  {
    "title": "Stereotype",
    "artist": "STAYC",
    "genre": "Kpop"
  },
  {
    "title": "O.O",
    "artist": "NMIXX",
    "genre": "Kpop"
  },
  {
    "title": "Love Me Like This",
    "artist": "NMIXX",
    "genre": "Kpop"
  },
  {
    "title": "Get A Guitar",
    "artist": "RIIZE",
    "genre": "Kpop"
  },
  {
    "title": "Love 119",
    "artist": "RIIZE",
    "genre": "Kpop"
  },
  {
    "title": "Plot Twist",
    "artist": "TWS",
    "genre": "Kpop"
  },
  {
    "title": "Magnetic",
    "artist": "ILLIT",
    "genre": "Kpop"
  },
  {
    "title": "Sheesh",
    "artist": "BABYMONSTER",
    "genre": "Kpop"
  },
  {
    "title": "Batter Up",
    "artist": "BABYMONSTER",
    "genre": "Kpop"
  },
  {
    "title": "I Am The Best",
    "artist": "2NE1",
    "genre": "Kpop"
  },
  {
    "title": "Fire",
    "artist": "2NE1",
    "genre": "Kpop"
  },
  {
    "title": "Nobody",
    "artist": "Wonder Girls",
    "genre": "Kpop"
  },
  {
    "title": "Bad Girl Good Girl",
    "artist": "Miss A",
    "genre": "Kpop"
  },
  {
    "title": "Move",
    "artist": "Taemin",
    "genre": "Kpop"
  },
  {
    "title": "Guilty",
    "artist": "Taemin",
    "genre": "Kpop"
  },
  {
    "title": "Daechwita",
    "artist": "Agust D",
    "genre": "Kpop"
  },
  {
    "title": "Haegeum",
    "artist": "Agust D",
    "genre": "Kpop"
  },
  {
    "title": "On The Street",
    "artist": "J-Hope x J. Cole",
    "genre": "Kpop"
  },
  {
    "title": "Like Crazy",
    "artist": "Jimin",
    "genre": "Kpop"
  },
  {
    "title": "Seven",
    "artist": "Jungkook x Latto",
    "genre": "Kpop"
  },
  {
    "title": "3D",
    "artist": "Jungkook x Jack Harlow",
    "genre": "Kpop"
  },
  {
    "title": "Standing Next to You",
    "artist": "Jungkook",
    "genre": "Kpop"
  },
  {
    "title": "Love Me Again",
    "artist": "V",
    "genre": "Kpop"
  },
  {
    "title": "Slow Dancing",
    "artist": "V",
    "genre": "Kpop"
  },
  {
    "title": "The Astronaut",
    "artist": "Jin",
    "genre": "Kpop"
  },
  {
    "title": "Wild Flower",
    "artist": "RM",
    "genre": "Kpop"
  },
  {
    "title": "On The Ground",
    "artist": "Rose",
    "genre": "Kpop"
  },
  {
    "title": "Gone",
    "artist": "Rose",
    "genre": "Kpop"
  },
  {
    "title": "Lalisa",
    "artist": "Lisa",
    "genre": "Kpop"
  },
  {
    "title": "Money",
    "artist": "Lisa",
    "genre": "Kpop"
  },
  {
    "title": "Solo",
    "artist": "Jennie",
    "genre": "Kpop"
  },
  {
    "title": "You & Me",
    "artist": "Jennie",
    "genre": "Kpop"
  },
  {
    "title": "Flower",
    "artist": "Jisoo",
    "genre": "Kpop"
  },
  {
    "title": "Gashina",
    "artist": "Sunmi",
    "genre": "Kpop"
  },
  {
    "title": "Roller Coaster",
    "artist": "Chungha",
    "genre": "Kpop"
  },
  {
    "title": "Dumb Dumb",
    "artist": "Somi",
    "genre": "Kpop"
  },
  {
    "title": "What You Waiting For",
    "artist": "Somi",
    "genre": "Kpop"
  },
  {
    "title": "Zoom",
    "artist": "Jessi",
    "genre": "Kpop"
  },
  {
    "title": "Nunu Nana",
    "artist": "Jessi",
    "genre": "Kpop"
  },
  {
    "title": "Mommae",
    "artist": "Jay Park",
    "genre": "Kpop"
  },
  {
    "title": "El Listón de Tu Pelo (Remix)",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Amor de Mis Amores",
    "artist": "Los Ángeles Azules x Kika Edgar",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia del Acordeón",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Mi Único Amor",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Amigos Nada Más",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "Me Haces Falta Tú",
    "artist": "Los Ángeles Azules",
    "genre": "Cumbia"
  },
  {
    "title": "El Negro José",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "Carola",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "La Cumbia Nació en Barú",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "El Sorullo",
    "artist": "La Sonora Dinamita",
    "genre": "Cumbia"
  },
  {
    "title": "BOP BOP!",
    "artist": "VIVIZ",
    "genre": "Kpop"
  },
  {
    "title": "LOVEADE",
    "artist": "VIVIZ",
    "genre": "Kpop"
  },
  {
    "title": "PULL UP",
    "artist": "VIVIZ",
    "genre": "Kpop"
  },
  {
    "title": "MANIAC",
    "artist": "VIVIZ",
    "genre": "Kpop"
  },
  {
    "title": "Untie",
    "artist": "VIVIZ",
    "genre": "Kpop"
  },
  {
    "title": "Blue Flame",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "No Celestial",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Sour Grapes",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Impurities",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Good Parts",
    "artist": "LE SSERAFIM",
    "genre": "Kpop"
  },
  {
    "title": "Mi Hermoso Cariño",
    "artist": "Banda Tierra Mojada",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Flor de Piña",
    "artist": "Banda Tierra Mojada",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Calentón",
    "artist": "Banda Tierra Mojada",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Tengo Ganas de Ti",
    "artist": "Banda Tierra Mojada",
    "genre": "Regional Mexicano"
  },
  {
    "title": "Pueblo Viejo",
    "artist": "Banda Tierra Mojada",
    "genre": "Regional Mexicano"
  },
  {
    "title": "El Pasadiscos",
    "artist": "Los Rugar",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia de la Nena",
    "artist": "Los Rugar",
    "genre": "Cumbia"
  },
  {
    "title": "La Del Moño Colorado",
    "artist": "Los Rugar",
    "genre": "Cumbia"
  },
  {
    "title": "El Amigo Que Se Fue",
    "artist": "Los Rugar",
    "genre": "Cumbia"
  },
  {
    "title": "Cumbia Rugar",
    "artist": "Los Rugar",
    "genre": "Cumbia"
  },
  {
    "title": "Ramito de Violetas",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "No Bailes de Caballito",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "Mambo Lupita",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "La Bota",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "Feliz Feliz",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "La Morena",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "Help! (Ayúdame)",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "Pelotero a la Bola",
    "artist": "Mi Banda El Mexicano",
    "genre": "Quebradita / Cumbia"
  },
  {
    "title": "Corazón de Acero",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Qué de Mí",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Probablemente",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Mi Todo",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Doble Servicio",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Sálvame",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Me Hubieras Dicho Antes",
    "artist": "Yiyo Sarante",
    "genre": "Salsa"
  },
  {
    "title": "Detalles",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Melao de Caña",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Mi Bajo y Yo",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Que Bueno Baila Usted",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Bajo la Tormenta",
    "artist": "Oscar D'León",
    "genre": "Salsa"
  },
  {
    "title": "Micaela",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "La Salsa La Traigo Yo",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "El Pito",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "Al Son de los Cueros",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "Ave María Lola",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "La Chica Gomela",
    "artist": "Sonora Carruseles",
    "genre": "Salsa / Boogaloo"
  },
  {
    "title": "El Mudo",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Bolero"
  },
  {
    "title": "Pena Negra",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Bolero"
  },
  {
    "title": "El Orangután",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Bolero"
  },
  {
    "title": "Amor de Cabaret",
    "artist": "La Sonora Santanera",
    "genre": "Tropical / Bolero"
  },
  {
    "title": "Bomboro Quiñá Quiñá",
    "artist": "La Sonora Santanera x La Única Internacional",
    "genre": "Tropical"
  },
  {
    "title": "La Mujer del Pelotero",
    "artist": "Merenglass",
    "genre": "Merengue"
  },
  {
    "title": "El Kulikitaka",
    "artist": "Merenglass",
    "genre": "Merengue"
  },
  {
    "title": "Llegó el Afilador",
    "artist": "Merenglass",
    "genre": "Merengue"
  },
  {
    "title": "La Cerveza",
    "artist": "Merenglass",
    "genre": "Merengue"
  },
  {
    "title": "El Conejo",
    "artist": "Merenglass",
    "genre": "Merengue"
  },
  {
    "title": "Chupando la Caña",
    "artist": "Merenglass",
    "genre": "Merengue"
  }
];

async function run() {
  console.log("=== Iniciando Sembrado de 500+ Canciones en Firebase Real ===");

  // Dar formato indexado con ID único
  const songsObj = {};
  songs.forEach((song, index) => {
    const id = (index + 1).toString();
    songsObj[id] = {
      title: song.title.trim(),
      artist: song.artist.trim(),
      genre: song.genre.trim(),
      globalRequests: 1
    };
  });

  const totalSongs = Object.keys(songsObj).length;
  console.log(`Petición preparada con ${totalSongs} canciones.`);

  try {
    const res = await fetch(`${dbUrl}/autocomplete_songs.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(songsObj)
    });
    if (res.ok) {
      console.log(`🎉 ¡Éxito! Sembradas ${totalSongs} canciones populares en la base de datos de producción.`);
    } else {
      console.error(`❌ Error en la base de datos: ${res.status} - ${await res.text()}`);
    }
  } catch (err) {
    console.error("❌ Error de red durante el PUT:", err.message);
  }
}

run();
