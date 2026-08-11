import { prisma } from "../lib/prisma";
import { anilistFetch, normalizeAniList } from "../lib/anilist/client";
import { upsertMedia } from "../lib/media/sync";

const DETAIL_QUERY = `
  query Detail($id: Int) {
    Media(id: $id, type: ANIME) {
      id format status title { romaji english native } synonyms description
      coverImage { extraLarge large } bannerImage startDate { year month day }
      episodes duration averageScore popularity favourites genres countryOfOrigin isAdult
      characters(sort: [ROLE, RELEVANCE], perPage: 15) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id name { full } image { large }
          }
        }
      }
      externalLinks {
        id site url type
      }
    }
  }
`;

async function run() {
  const animes = await prisma.media.findMany({
    where: { source: "ANILIST" },
    include: { credits: true },
  });

  console.log(`Found ${animes.length} Anime records.`);
  let count = 0;

  for (const anime of animes) {
    if (anime.credits.length === 0) {
      console.log(`Refreshing ${anime.title} (${anime.sourceId})...`);
      try {
        const response = await anilistFetch<{ data?: { Media?: any } }>(DETAIL_QUERY, {
          id: Number(anime.sourceId),
        });
        if (response.data?.Media) {
          const normalized = normalizeAniList(response.data.Media);
          await upsertMedia(normalized);
          count++;
        }
      } catch (err) {
        console.error(`Failed to refresh ${anime.title}:`, err);
      }
      // Delay to avoid hitting rate limits too fast
      await new Promise(r => setTimeout(r, 700));
    }
  }
  console.log(`Successfully refreshed ${count} anime records.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
