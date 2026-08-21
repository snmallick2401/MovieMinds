import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

async function prepareTestDB() {
  console.log("Preparing test database environment...");
  
  // 1. Read .env.local
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found!");
  }
  
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  let dbUrl = envConfig['DATABASE_URL'];
  let directUrl = envConfig['DIRECT_URL'];
  
  if (!dbUrl) throw new Error("DATABASE_URL not found in .env.local");
  
  // 2. Modify connection string to use test_schema
  const modifyUrlSchema = (url: string) => {
    if (!url) return url;
    const urlObj = new URL(url);
    urlObj.searchParams.set('schema', 'test_schema');
    return urlObj.toString();
  };
  
  const testDbUrl = modifyUrlSchema(dbUrl);
  const testDirectUrl = modifyUrlSchema(directUrl);
  
  // 3. Write .env.test
  const testEnvPath = path.join(__dirname, '../.env.test');
  fs.writeFileSync(testEnvPath, `DATABASE_URL="${testDbUrl}"\nDIRECT_URL="${testDirectUrl}"\n`);
  console.log("✅ Created .env.test pointing to test_schema");
  
  // 4. Public Schema Guard: Capture row counts using the CURRENT (public) DB connection
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); // explicitly use public URL
  
  try {
    console.log("Capturing Public Schema Guard metrics...");
    const mediaCount = await prisma.media.count();
    const streamingPlatformCount = await prisma.streamingPlatform.count();
    
    // NewsArticle might not have rows yet, but we'll try to count it
    let newsCount = 0;
    try {
      // we use generic raw query in case Prisma client isn't fully updated yet, but we generated it.
      newsCount = await prisma.newsArticle.count();
    } catch(e) {
      console.warn("NewsArticle table might not be in public schema yet or empty.");
    }
    
    const guardData = {
      media: mediaCount,
      streamingPlatform: streamingPlatformCount,
      newsArticle: newsCount,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(__dirname, '../test-guard.json'), JSON.stringify(guardData, null, 2));
    console.log(`✅ Public Schema Guard active: Media(${mediaCount}), Platforms(${streamingPlatformCount}), News(${newsCount})`);
    
    // 5. Create test_schema via raw SQL on the existing connection
    console.log("Creating test_schema if it doesn't exist...");
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS test_schema`);
    console.log("✅ test_schema created/verified.");
    
  } catch (error) {
    console.error("Error during DB preparation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  
  // 6. Push schema into test_schema
  console.log("Pushing Prisma schema to test_schema...");
  // Using cross-env to set DATABASE_URL
  try {
    execSync(`npx cross-env DATABASE_URL="${testDbUrl}" DIRECT_URL="${testDirectUrl}" npx prisma db push --skip-generate --accept-data-loss`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log("✅ Schema pushed to test_schema successfully.");
  } catch(e) {
    console.error("Error pushing schema:", e);
    process.exit(1);
  }
}

prepareTestDB();
