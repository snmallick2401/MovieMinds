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
  const idsToRefresh = [16498, 11061]; // AOT and HxH

  for (const id of idsToRefresh) {
    console.log(`Refreshing ${id}...`);
    try {
      const response = await anilistFetch<{ data?: { Media?: any } }>(DETAIL_QUERY, { id });
      if (response.data?.Media) {
        const normalized = normalizeAniList(response.data.Media);
        await upsertMedia(normalized);
        console.log(`Success: ${id}`);
      }
    } catch (err) {
      console.error(`Failed: ${id}`, err);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
