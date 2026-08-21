import asyncio
from playwright.async_api import async_playwright
import time
import os

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"
CONCURRENCY = 8  # 8 simultaneous requests to stress the DB

async def authenticate(context):
    print("Authenticating for stress test...")
    page = await context.new_page()
    await page.goto(f"{URL}/login")
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    
    async with page.expect_response(lambda r: "supabase.co" in r.url, timeout=30000) as resp:
        await page.click('button[type="submit"]')
        
    await page.wait_for_url(f"{URL}/", timeout=30000)
    await page.wait_for_load_state("networkidle")
    
    cookies = await context.cookies()
    await page.close()
    return cookies

async def stress_worker(worker_id, context, path):
    page = await context.new_page()
    start_time = time.time()
    try:
        print(f"[Worker {worker_id}] Requesting {path}...")
        
        # We listen for any 500 server errors
        page.on("response", lambda r: print(f"[Worker {worker_id}] ERROR 500 at {r.url}") if r.status == 500 else None)
        
        await page.goto(f"{URL}{path}", timeout=30000)
        await page.wait_for_load_state("domcontentloaded")
        
        duration = time.time() - start_time
        print(f"[Worker {worker_id}] Successfully loaded {path} in {duration:.2f}s")
        return True
    except Exception as e:
        duration = time.time() - start_time
        print(f"[Worker {worker_id}] FAILED to load {path} in {duration:.2f}s: {str(e)}")
        return False
    finally:
        await page.close()

async def run_stress_test():
    print("Starting Stress Test...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Authenticate once to get cookies
        auth_context = await browser.new_context()
        cookies = await authenticate(auth_context)
        await auth_context.close()
        
        # Create a new context with the authenticated cookies
        context = await browser.new_context()
        await context.add_cookies(cookies)
        
        # Test paths that trigger database queries
        paths_to_test = [
            "/",
            "/profile",
            "/library",
            "/explore",
            "/search?q=Attack",
            "/",
            "/profile",
            "/library"
        ]
        
        tasks = []
        for i in range(CONCURRENCY):
            path = paths_to_test[i % len(paths_to_test)]
            tasks.append(stress_worker(i, context, path))
            
        print(f"Launching {CONCURRENCY} concurrent requests...")
        start_total = time.time()
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_total
        
        success_count = sum(1 for r in results if r)
        print(f"Stress Test Results: {success_count}/{CONCURRENCY} succeeded in {total_time:.2f}s")
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_stress_test())
