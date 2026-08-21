import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the test_schema environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

describe('Prisma Schema Validation (test_schema)', () => {
  let testRunId: string;

  beforeAll(async () => {
    testRunId = `test_run_${Date.now()}`;
    
    // SAFETY CHECK: Ensure we are in test_schema
    await prisma.$executeRawUnsafe(`SET search_path TO test_schema`);
    const result: any = await prisma.$queryRaw`SHOW search_path`;
    const searchPath = result[0].search_path;
    
    if (!searchPath.includes('test_schema')) {
      throw new Error(`CRITICAL SAFETY FAILURE: search_path is '${searchPath}'. Expected 'test_schema'. Aborting tests!`);
    }
    console.log(`✅ search_path verified: ${searchPath}`);
  });

  afterAll(async () => {
    // Teardown test data
    await prisma.newsArticle.deleteMany({
      where: { source: { contains: 'Vitest' } }
    });
    await prisma.$disconnect();
  });

  it('should successfully perform CRUD on NewsArticle', async () => {
    // Create
    const article = await prisma.newsArticle.create({
      data: {
        source: 'Vitest Test Runner',
        title: `Integration Test Article ${testRunId}`,
        url: `https://test.com/article/${testRunId}`,
        summary: 'Testing the new model',
        publishedAt: new Date(),
      }
    });

    expect(article).toBeDefined();
    expect(article.id).toBeTypeOf('string');
    expect(article.title).toContain(testRunId);

    // Read
    const fetched = await prisma.newsArticle.findUnique({
      where: { url: `https://test.com/article/${testRunId}` }
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.summary).toBe('Testing the new model');

    // Update
    const updated = await prisma.newsArticle.update({
      where: { id: article.id },
      data: { summary: 'Updated summary' }
    });
    expect(updated.summary).toBe('Updated summary');

    // Delete
    const deleted = await prisma.newsArticle.delete({
      where: { id: article.id }
    });
    expect(deleted.id).toBe(article.id);
  });

  it('should verify Media and StreamingPlatform existence in test schema', async () => {
    // Simply counting to ensure the tables are accessible and the schema push worked
    const mediaCount = await prisma.media.count();
    const platformCount = await prisma.streamingPlatform.count();
    
    expect(typeof mediaCount).toBe('number');
    expect(typeof platformCount).toBe('number');
  });
});
