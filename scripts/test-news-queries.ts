import { getLatestNews, getNewsForMedia } from "../lib/news/queries";

async function main() {
  const latest = await getLatestNews(2);
  console.log("Latest:", latest);

  const contextual = await getNewsForMedia("Attack on Titan", 2);
  console.log("Contextual:", contextual);
}
main().catch(console.error);
