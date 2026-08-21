import { MediaSource, MediaStatus, MediaType, type Prisma } from "@prisma/client";
import { invalidateCatalogCache } from "@/lib/cache/catalog";
import { fetchAniListCollection, fetchAniListDetails } from "@/lib/anilist/client";
import { prisma } from "@/lib/prisma";
import { fetchTmdbCollection, fetchTmdbDetails } from "@/lib/tmdb/client";
import type { NormalizedMedia } from "@/types/media";

type SyncSource = "all" | "tmdb" | "anilist";

function date(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function mediaData(media: NormalizedMedia): Prisma.MediaUncheckedCreateInput {
  return {
    source: media.source as MediaSource,
    sourceId: media.sourceId,
    title: media.title,
    originalTitle: media.originalTitle,
    alternativeTitles: media.alternativeTitles,
    description: media.description,
    posterUrl: media.posterUrl,
    backdropUrl: media.backdropUrl,
    releaseDate: date(media.releaseDate),
    year: media.year,
    runtime: media.runtime,
    language: media.language,
    country: media.country,
    mediaType: media.mediaType as MediaType,
    status: media.status as MediaStatus,
    contentRating: media.contentRating,
    averageRating: media.averageRating,
    voteCount: media.voteCount,
    popularity: media.popularity,
    seasonCount: media.seasonCount,
    episodeCount: media.episodeCount,
    sourceUpdatedAt: media.sourceUpdatedAt,
    lastSyncedAt: new Date(),
  };
}

async function ensureGenres(genreNames: string[]) {
  const uniqueNames = Array.from(new Set(genreNames.filter(Boolean)));
  if (uniqueNames.length === 0) return new Map<string, string>();

  const existing = await prisma.genre.findMany({
    where: { name: { in: uniqueNames } },
  });

  const genreMap = new Map<string, string>();
  for (const g of existing) {
    genreMap.set(g.name, g.id);
  }

  const missingNames = uniqueNames.filter((name) => !genreMap.has(name));

  if (missingNames.length > 0) {
    await prisma.genre.createMany({ 
      data: missingNames.map(name => ({ name })), 
      skipDuplicates: true 
    });
    const newlyCreated = await prisma.genre.findMany({
      where: { name: { in: missingNames } },
    });
    for (const g of newlyCreated) {
      genreMap.set(g.name, g.id);
    }
  }

  return genreMap;
}

async function ensurePlatforms(
  platforms: Array<{ name: string; logoUrl?: string | null; region?: string | null; watchUrl?: string | null }>,
) {
  const uniquePlatforms = new Map<string, string | null>();
  for (const p of platforms) {
    if (p?.name && !uniquePlatforms.has(p.name)) {
      uniquePlatforms.set(p.name, p.logoUrl ?? null);
    }
  }

  if (uniquePlatforms.size === 0) return new Map<string, string>();

  const names = Array.from(uniquePlatforms.keys());
  const existing = await prisma.streamingPlatform.findMany({
    where: { name: { in: names } },
  });

  const platformMap = new Map<string, string>();
  for (const p of existing) {
    platformMap.set(p.name, p.id);
  }

  const missingPlatforms = [];
  for (const [name, logoUrl] of uniquePlatforms.entries()) {
    if (!platformMap.has(name)) {
      missingPlatforms.push({ name, logoUrl: logoUrl ?? null });
    }
  }

  if (missingPlatforms.length > 0) {
    await prisma.streamingPlatform.createMany({ data: missingPlatforms, skipDuplicates: true });
    const newlyCreated = await prisma.streamingPlatform.findMany({
      where: { name: { in: missingPlatforms.map(p => p.name) } },
    });
    for (const p of newlyCreated) {
      platformMap.set(p.name, p.id);
    }
  }

  return platformMap;
}

async function ensurePeople(credits: NonNullable<NormalizedMedia["credits"]>) {
  const uniquePeople = new Map<number, { name: string; profileUrl: string | null }>();
  for (const c of credits) {
    const tmdbId = Number(c.id);
    if (!isNaN(tmdbId) && !uniquePeople.has(tmdbId)) {
      uniquePeople.set(tmdbId, { name: c.name, profileUrl: c.profileUrl });
    }
  }

  if (uniquePeople.size === 0) return new Map<number, string>();

  const tmdbIds = Array.from(uniquePeople.keys());
  const existing = await prisma.person.findMany({
    where: { tmdbId: { in: tmdbIds } },
  });

  const personMap = new Map<number, string>();
  for (const p of existing) {
    personMap.set(p.tmdbId, p.id);
  }

  const missingPeople = [];
  for (const [tmdbId, person] of uniquePeople.entries()) {
    if (!personMap.has(tmdbId)) {
      missingPeople.push({ tmdbId, name: person.name, profileUrl: person.profileUrl });
    }
  }

  if (missingPeople.length > 0) {
    await prisma.person.createMany({ data: missingPeople, skipDuplicates: true });
    const newlyCreated = await prisma.person.findMany({
      where: { tmdbId: { in: missingPeople.map(m => m.tmdbId) } },
    });
    for (const p of newlyCreated) {
      personMap.set(p.tmdbId, p.id);
    }
  }

  return personMap;
}

export async function upsertMedia(
  media: NormalizedMedia,
  genreMap?: Map<string, string>,
  platformMap?: Map<string, string>,
  personMap?: Map<number, string>,
) {
  const data = mediaData(media);
  const record = await prisma.media.upsert({
    where: {
      source_sourceId: { source: media.source as MediaSource, sourceId: media.sourceId },
    },
    create: data,
    update: data,
  });

  const genreNames = Array.from(new Set(media.genres.filter(Boolean)));
  const gMap = genreMap ?? (await ensureGenres(genreNames));

  const validPlatforms = (media.platforms ?? []).filter(
    (p): p is { name: string; logoUrl?: string | null; region?: string | null; watchUrl?: string | null } =>
      Boolean(p && p.name),
  );
  const pMap = platformMap ?? (await ensurePlatforms(validPlatforms));

  const validCredits = media.credits ?? [];
  const cMap = personMap ?? (await ensurePeople(validCredits));

  const mediaGenreData = genreNames
    .map((name) => gMap.get(name))
    .filter((id): id is string => Boolean(id))
    .map((genreId) => ({ mediaId: record.id, genreId }));

  const uniquePlatformDataMap = new Map<
    string,
    { mediaId: string; platformId: string; region: string | null; watchUrl: string | null }
  >();
  for (const p of validPlatforms) {
    const platformId = pMap.get(p.name);
    if (platformId && !uniquePlatformDataMap.has(platformId)) {
      uniquePlatformDataMap.set(platformId, {
        mediaId: record.id,
        platformId,
        region: p.region ?? null,
        watchUrl: p.watchUrl ?? null,
      });
    }
  }
  const mediaPlatformData = Array.from(uniquePlatformDataMap.values());

  const mediaPersonData = validCredits.map((c, idx) => {
    const personId = cMap.get(Number(c.id));
    if (!personId) return null;
    return {
      mediaId: record.id,
      personId,
      role: c.role,
      character: c.character,
      job: c.job,
      department: c.department,
      order: idx,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const isDetailSync = media.credits !== undefined && media.platforms !== undefined;

  const transactions: any[] = [];
  
  if (isDetailSync) {
    transactions.push(
      prisma.mediaGenre.deleteMany({ where: { mediaId: record.id } }),
      prisma.mediaPlatform.deleteMany({ where: { mediaId: record.id } }),
      prisma.mediaPerson.deleteMany({ where: { mediaId: record.id } })
    );

    if (mediaGenreData.length > 0)
      transactions.push(prisma.mediaGenre.createMany({ data: mediaGenreData, skipDuplicates: true }));
    if (mediaPlatformData.length > 0)
      transactions.push(prisma.mediaPlatform.createMany({ data: mediaPlatformData, skipDuplicates: true }));
    if (mediaPersonData.length > 0)
      transactions.push(prisma.mediaPerson.createMany({ data: mediaPersonData, skipDuplicates: true }));
  } else if (mediaGenreData.length > 0) {
    // For summary syncs, we only safely merge new genres without wiping anything
    transactions.push(prisma.mediaGenre.createMany({ data: mediaGenreData, skipDuplicates: true }));
  }

  if (transactions.length > 0) {
    await prisma.$transaction(transactions);
  }

  return record;
}

async function upsertWithConcurrency(
  media: NormalizedMedia[],
  concurrency = 4,
  genreMap?: Map<string, string>,
  platformMap?: Map<string, string>,
) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, media.length) },
    async () => {
      while (cursor < media.length) {
        const current = media[cursor];
        cursor += 1;
        await upsertMedia(current, genreMap, platformMap);
      }
    },
  );
  await Promise.all(workers);
}

export async function syncCollection(
  collection: "trending" | "popular" | "top_rated" | "upcoming" = "trending",
  page = 1,
  source: SyncSource = "all",
) {
  const failures: string[] = [];
  let tmdb: NormalizedMedia[] = [];
  let anilist: NormalizedMedia[] = [];

  if (source === "all" || source === "tmdb") {
    try {
      tmdb = await fetchTmdbCollection(collection, page);
    } catch (error) {
      failures.push(
        `TMDb: ${error instanceof Error ? error.message : "Unknown provider error"}`,
      );
    }
  }
  if (source === "all" || source === "anilist") {
    try {
      anilist = await fetchAniListCollection(page);
    } catch (error) {
      failures.push(
        `AniList: ${error instanceof Error ? error.message : "Unknown provider error"}`,
      );
    }
  }
  if (!tmdb.length && !anilist.length) {
    throw new Error(`All requested catalog providers failed: ${failures.join("; ")}`);
  }

  const media = [...tmdb, ...anilist];

  // Pre-ensure all unique genres and streaming platforms across the batch
  const allGenreNames = media.flatMap((m) => m.genres);
  const allPlatforms = media.flatMap((m) => m.platforms ?? []);
  const genreMap = await ensureGenres(allGenreNames);
  const platformMap = await ensurePlatforms(allPlatforms);

  await upsertWithConcurrency(media, 4, genreMap, platformMap);

  if (tmdb.length) {
    await prisma.catalogSync.upsert({
      where: { source_collection_page: { source: "TMDB", collection, page } },
      create: { source: "TMDB", collection, page, completedAt: new Date() },
      update: { completedAt: new Date() },
    });
  }
  if (anilist.length) {
    await prisma.catalogSync.upsert({
      where: { source_collection_page: { source: "ANILIST", collection, page } },
      create: { source: "ANILIST", collection, page, completedAt: new Date() },
      update: { completedAt: new Date() },
    });
  }
  invalidateCatalogCache();
  return { imported: media.length, collection, page, source, warnings: failures };
}

export async function refreshMedia(
  source: MediaSource,
  sourceId: string,
  mediaType: MediaType,
) {
  const normalized =
    source === "TMDB"
      ? await fetchTmdbDetails(sourceId, mediaType === "TV" ? "TV" : "MOVIE")
      : await fetchAniListDetails(sourceId);
      
  normalized.sourceUpdatedAt = new Date();
  
  return upsertMedia(normalized);
}

