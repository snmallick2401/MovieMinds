import asyncio
from playwright.async_api import async_playwright
import time
import os

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"

async def run_e2e():
    print("Starting E2E Test...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            record_video_dir="artifacts/videos"
        )
        page = await context.new_page()

        # Monitor console errors and network failures
        page.on("console", lambda msg: print(f"Browser Console [{msg.type}]: {msg.text}"))
        
        def handle_request(request):
            if "supabase" in request.url or "/login" in request.url:
                print(f"Request started: {request.method} {request.url}")
        page.on("request", handle_request)

        def handle_request_failed(request):
            print(f"Request failed: {request.url} - {request.failure}")
            
        page.on("requestfailed", handle_request_failed)
        
        def handle_response(response):
            if "supabase" in response.url or response.status >= 400:
                print(f"Response: {response.status} {response.url}")
                
        page.on("response", handle_response)
        
        # 1. Load Homepage
        print("Navigating to Homepage...")
        await page.goto(f"{URL}/")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="artifacts/homepage_unauth.png")
        print("Homepage loaded.")

        # 2. Login
        print("Navigating to Login...")
        await page.goto(f"{URL}/login")
        await page.wait_for_load_state("networkidle")
        
        print("Filling login form...")
        await page.fill('input[name="email"]', EMAIL)
        await page.fill('input[name="password"]', PASSWORD)
        
        async with page.expect_response(lambda response: "supabase.co" in response.url, timeout=60000) as response_info:
            await page.click('button[type="submit"]')
            
        print("Supabase response received!")
        response = await response_info.value
        print(f"Supabase response status: {response.status}")
        
        print("Waiting for redirection after login...")
        await page.wait_for_url(f"{URL}/", timeout=60000)
        await page.wait_for_load_state("networkidle")
        
        current_url = page.url
        print(f"Post-login URL: {current_url}")
        current_url = page.url
        print(f"Post-login URL: {current_url}")
        
        # 3. Test Navigation (Explore)
        print("Navigating to Explore...")
        await page.click('a[href="/explore"]')
        await page.wait_for_load_state("networkidle")

        # 4. Search
        print("Testing Search...")
        search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]')
        if await search_input.count() > 0:
            await search_input.first.fill("Attack on Titan")
            await page.keyboard.press("Enter")
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
            
            # 5. Media Detail Page
            print("Opening Media Detail Page...")
            media_links = page.locator('a[href*="/media/"]')
            if await media_links.count() > 0:
                await media_links.first.click()
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                
                # 6. Library Mutation
                print("Testing Library Mutation...")
                library_btn = page.locator('button:has-text("Add to Library"), button:has-text("Watching"), button:has-text("Plan to watch")')
                if await library_btn.count() > 0:
                    await library_btn.first.click()
                    await asyncio.sleep(1)
        
        # 7. Profile
        print("Testing Profile...")
        await page.goto(f"{URL}/profile")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        print("E2E Phase 2 complete.")
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    os.makedirs("artifacts", exist_ok=True)
    asyncio.run(run_e2e())
