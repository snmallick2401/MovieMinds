import { anilistFetch } from "../lib/anilist/client";

const DETAIL_QUERY = `
  query Detail($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { english romaji }
      characters(sort: [ROLE, RELEVANCE], perPage: 15) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id name { full } image { large }
          }
        }
      }
    }
  }
`;

async function test() {
  const res = await anilistFetch<{ data: any }>(DETAIL_QUERY, { id: 16498 });
  console.log(JSON.stringify(res.data.Media.characters, null, 2));
}

test().catch(console.error);
