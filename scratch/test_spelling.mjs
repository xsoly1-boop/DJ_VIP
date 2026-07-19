import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

// Copy similarity helpers from PublicView.jsx
const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getStringSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;
  const dist = getLevenshteinDistance(str1, str2);
  return 1.0 - dist / maxLen;
};

const normalize = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .trim();
};

async function testSpelling(typedTitle, typedArtist) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const userTitleNorm = normalize(typedTitle);
    const userArtistNorm = normalize(typedArtist);
    const titlePrefix = userTitleNorm.substring(0, 3);

    console.log(`Searching prefix "${titlePrefix}%" in autocomplete_songs...`);
    const res = await client.query(
      "SELECT * FROM autocomplete_songs WHERE title ILIKE $1 LIMIT 150",
      [`${titlePrefix}%`]
    );

    const candidateSongs = res.rows;
    console.log(`Found ${candidateSongs.length} candidates in database.`);

    let bestMatch = null;
    let maxSimilarity = 0;

    candidateSongs.forEach(song => {
      const songTitleNorm = normalize(song.title);
      const songArtistNorm = normalize(song.artist);

      const titleSim = getStringSimilarity(songTitleNorm, userTitleNorm);
      
      let artistSim = 1.0;
      if (typedArtist && songArtistNorm) {
        artistSim = getStringSimilarity(songArtistNorm, userArtistNorm);
      }

      const overallSim = typedArtist ? (titleSim * 0.7 + artistSim * 0.3) : titleSim;

      if (overallSim > maxSimilarity) {
        maxSimilarity = overallSim;
        bestMatch = song;
      }
    });

    console.log("\n--- RESULT ---");
    if (bestMatch) {
      console.log(`Best match found: "${bestMatch.title}" by "${bestMatch.artist}"`);
      console.log(`Similarity score: ${maxSimilarity.toFixed(4)}`);
      
      if (maxSimilarity >= 0.90) {
        console.log("Verdict: Autocorrect directly!");
      } else if (maxSimilarity >= 0.75) {
        console.log("Verdict: Show verification modal (¿Quisiste decir...?)");
      } else {
        console.log("Verdict: Proceed with user spelling (similarity < 0.75)");
      }
    } else {
      console.log("No best match found!");
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await client.end();
  }
}

// Run test with "Goldeeen"
testSpelling("Goldeeen", "");
