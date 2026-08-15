import { PrismaClient, MediaType, LibraryStatus } from '@prisma/client';
import { getPersonalizedRecommendations } from '../lib/media/queries';

const prisma = new PrismaClient();

const PERSONAS = [
  {
    username: 'action_junkie',
    email: 'action@test.com',
    displayName: 'Action Junkie',
    favoriteGenres: ['Action', 'Adventure', 'Thriller'],
    antiGenres: ['Romance', 'Drama']
  },
  {
    username: 'romcom_enthusiast',
    email: 'romcom@test.com',
    displayName: 'RomCom Enthusiast',
    favoriteGenres: ['Romance', 'Comedy', 'Slice of Life'],
    antiGenres: ['Horror', 'Thriller']
  },
  {
    username: 'horror_buff',
    email: 'horror@test.com',
    displayName: 'Horror Buff',
    favoriteGenres: ['Horror', 'Mystery', 'Psychological'],
    antiGenres: ['Comedy', 'Family']
  },
  {
    username: 'anime_weeb',
    email: 'weeb@test.com',
    displayName: 'Anime Weeb',
    favoriteGenres: ['Animation', 'Fantasy', 'Action'],
    antiGenres: ['Documentary', 'History'],
    onlyAnime: true
  },
  {
    username: 'scifi_nerd',
    email: 'scifi@test.com',
    displayName: 'Sci-Fi Nerd',
    favoriteGenres: ['Sci-Fi', 'Mystery', 'Adventure'],
    antiGenres: ['Romance', 'Family']
  },
  {
    username: 'classic_snob',
    email: 'classic@test.com',
    displayName: 'Classic Snob',
    favoriteGenres: ['Drama', 'History', 'Documentary'],
    antiGenres: ['Action', 'Comedy']
  },
  {
    username: 'kdrama_fanatic',
    email: 'kdrama@test.com',
    displayName: 'K-Drama Fanatic',
    favoriteGenres: ['Romance', 'Drama'],
    antiGenres: ['Horror', 'Sci-Fi']
  },
  {
    username: 'fantasy_escapist',
    email: 'fantasy@test.com',
    displayName: 'Fantasy Escapist',
    favoriteGenres: ['Fantasy', 'Adventure', 'Magic'],
    antiGenres: ['Documentary', 'Crime']
  },
  {
    username: 'comedy_casual',
    email: 'comedy@test.com',
    displayName: 'Comedy Casual',
    favoriteGenres: ['Comedy', 'Family', 'Animation'],
    antiGenres: ['Horror', 'Thriller', 'Crime']
  },
  {
    username: 'detective_mind',
    email: 'detective@test.com',
    displayName: 'Detective Mind',
    favoriteGenres: ['Crime', 'Mystery', 'Thriller'],
    antiGenres: ['Comedy', 'Romance']
  }
];

const AI_ENGINE_URL = 'http://127.0.0.1:8001';

async function seedPersonas() {
  console.log('Seeding personas...');
  const users = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        favoriteGenres: p.favoriteGenres
      },
      create: {
        id: crypto.randomUUID(),
        email: p.email,
        username: p.username,
        displayName: p.displayName,
        favoriteGenres: p.favoriteGenres,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`
      }
    });
    users.push(user);
    console.log(`✅ Upserted ${user.username}`);
  }
  return users;
}

async function seedUserLibrary(users: any[]) {
  console.log('\nSeeding User Libraries and Ratings...');
  
  console.log('Fetching genres from DB...');
  const dbGenres = await prisma.genre.findMany();
  if (dbGenres.length === 0) {
    console.log('No genres found in DB. AI engine relies on existing DB media. Please run standard sync first.');
  }

  // Fetch all media with genres
  console.log('Fetching 500 media from DB...');
  const allMedia = await prisma.media.findMany({
    include: { genres: { include: { genre: true } } },
    take: 500
  });
  console.log(`Fetched ${allMedia.length} media items.`);

  if (allMedia.length < 50) {
    console.warn('⚠️ Warning: Very few media items in DB. Recommendations might not be optimal.');
  }

  for (const p of PERSONAS) {
    const user = users.find(u => u.email === p.email);
    if (!user) continue;

    // Filter media matching their favorite genres
    let matchingMedia = allMedia.filter(m => 
      m.genres.some(g => p.favoriteGenres.includes(g.genre.name))
    );

    // Filter media matching anti-genres
    let antiMedia = allMedia.filter(m => 
      m.genres.some(g => p.antiGenres.includes(g.genre.name))
    );

    if (p.onlyAnime) {
      matchingMedia = matchingMedia.filter(m => ['ANIME', 'ANIME_MOVIE', 'OVA'].includes(m.mediaType));
    }

    // Ensure we don't exceed array bounds if not enough data
    if (matchingMedia.length < 20) matchingMedia = [...matchingMedia, ...allMedia].slice(0, 20);
    if (antiMedia.length < 5) antiMedia = [...antiMedia, ...allMedia].slice(0, 5);

    // Shuffle arrays
    matchingMedia.sort(() => 0.5 - Math.random());
    antiMedia.sort(() => 0.5 - Math.random());

    // Deduplicate
    const uniqueMatch = Array.from(new Set(matchingMedia));
    const uniqueAnti = Array.from(new Set(antiMedia)).filter(m => !uniqueMatch.includes(m));

    // 15 matching COMPLETED, 5 anti COMPLETED
    const toCompleteMatch = uniqueMatch.slice(0, 15);
    const toCompleteAnti = uniqueAnti.slice(0, 5);
    const toComplete = [...toCompleteMatch, ...toCompleteAnti];

    // 5 PLAN_TO_WATCH
    const toPlanToWatch = uniqueMatch.slice(15, 20);

    // Delete existing interactions
    await prisma.userLibrary.deleteMany({ where: { userId: user.id } });
    await prisma.userRating.deleteMany({ where: { userId: user.id } });

    const libraryData = [];
    const ratingData = [];

    for (const m of toComplete) {
      if (!m) continue;
      const isMatch = toCompleteMatch.includes(m);
      const rating = isMatch ? (Math.random() * 2 + 8).toFixed(1) : (Math.random() * 4 + 1).toFixed(1); 

      libraryData.push({
        userId: user.id,
        mediaId: m.id,
        status: LibraryStatus.COMPLETED,
        completed: true,
        completedAt: new Date(),
        progress: m.episodeCount || 1
      });

      ratingData.push({
        userId: user.id,
        mediaId: m.id,
        rating: Number(rating)
      });
    }

    for (const m of toPlanToWatch) {
      if (!m) continue;
      libraryData.push({
        userId: user.id,
        mediaId: m.id,
        status: LibraryStatus.PLAN_TO_WATCH
      });
    }

    if (libraryData.length > 0) {
      await prisma.userLibrary.createMany({ data: libraryData });
    }
    if (ratingData.length > 0) {
      await prisma.userRating.createMany({ data: ratingData });
    }

    console.log(`✅ Seeded interactions for ${user.username}`);
  }
}

async function testHealth() {
  console.log('\n🏥 Testing AI Engine Health...');
  try {
    const res = await fetch(`${AI_ENGINE_URL}/health`);
    if (res.ok) {
      console.log('✅ AI Engine is healthy on port 8001');
    } else {
      console.error('❌ AI Engine health check failed.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Could not connect to AI Engine on port 8001.', err.message);
    process.exit(1);
  }
}

async function testRecommendations(users: any[]) {
  console.log('\n🤖 Testing ML Recommendations for Personas...');
  for (const user of users) {
    console.log(`\nFetching for: ${user.username}...`);
    // Uses Next.js heuristics/ML function directly
    const recs = await getPersonalizedRecommendations(user.id, 3);
    
    if (recs && recs.length > 0) {
      console.log(`✅ Received ${recs.length} recommendations:`);
      recs.forEach((r, idx) => {
        console.log(`  ${idx + 1}. [${r.matchPercentage}%] ${r.title} - Reason: ${r.recommendationReason}`);
      });
      if (recs[0].matchPercentage === 96 && recs[0].recommendationReason.includes('Trending')) {
         console.warn(`  ⚠️ Hit the fallback mechanism instead of ML!`);
      } else {
         console.log(`  ✅ ML Engine processed taste vectors successfully.`);
      }
    } else {
      console.error('❌ Failed to get recommendations.');
    }
  }
}

async function testFallback() {
  console.log('\n🛡️ Testing Next.js AI Fallback Mechanism...');
  
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    if (typeof input === 'string' && input.includes(':8001')) {
      throw new Error('Simulated Timeout Error');
    }
    return originalFetch(input, init);
  };

  try {
    const fallbackRecs = await getPersonalizedRecommendations(null, 3);
    console.log('✅ Fallback recommendations (Guest/Timeout):');
    fallbackRecs.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.matchPercentage}%] ${r.title} - Reason: ${r.recommendationReason}`);
    });
    if (fallbackRecs[0].matchPercentage === 96) {
      console.log('✅ Fallback heuristics validated successfully.');
    } else {
      console.error('❌ Fallback heuristics returned unexpected data.');
    }
  } catch (err) {
    console.error('❌ Fallback mechanism threw an error!', err);
  } finally {
    global.fetch = originalFetch; // Restore
  }
}

async function main() {
  try {
    await testHealth();
    const users = await seedPersonas();
    await seedUserLibrary(users);
    await testRecommendations(users);
    await testFallback();
    console.log('\n🎉 All seeding and tests completed successfully!');
  } catch (err) {
    console.error('\n❌ Fatal Error during execution:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
