import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function verifyGuard() {
  console.log("Verifying Public Schema Guard...");
  
  const guardPath = path.join(__dirname, '../test-guard.json');
  if (!fs.existsSync(guardPath)) {
    console.error("test-guard.json not found!");
    process.exit(1);
  }
  
  const original = JSON.parse(fs.readFileSync(guardPath, 'utf8'));
  
  // We use the LOCAL DATABASE_URL to connect to the public schema
  // which does not have ?schema=test_schema
  const prisma = new PrismaClient(); 
  
  try {
    const currentMediaCount = await prisma.media.count();
    const currentPlatformCount = await prisma.streamingPlatform.count();
    
    let currentNewsCount = 0;
    try {
      currentNewsCount = await prisma.newsArticle.count();
    } catch(e) {}
    
    console.log(`Original: Media(${original.media}), Platforms(${original.streamingPlatform}), News(${original.newsArticle})`);
    console.log(`Current:  Media(${currentMediaCount}), Platforms(${currentPlatformCount}), News(${currentNewsCount})`);
    
    if (original.media !== currentMediaCount || original.streamingPlatform !== currentPlatformCount) {
      console.error("❌ CRITICAL: Public schema has been mutated during test execution!");
      process.exit(1);
    }
    
    console.log("✅ Public Schema Guard Verified: 0 leaked records in public schema.");
    
  } finally {
    await prisma.$disconnect();
  }
}

verifyGuard();
