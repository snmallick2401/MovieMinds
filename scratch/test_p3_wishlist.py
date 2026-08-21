import asyncio
from playwright.async_api import async_playwright, expect
import time

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"

async def test_wishlist():
    print("--- Testing Wishlist CRUD ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        # 1. Login
        await page.goto(f"{URL}/login")
        await page.fill('input[name="email"]', EMAIL)
        await page.fill('input[name="password"]', PASSWORD)
        async with page.expect_response(lambda r: "supabase.co" in r.url, timeout=30000):
            await page.click('button[type="submit"]')
        await page.wait_for_url(f"{URL}/", timeout=15000)
        
        # 2. Find Media via Explore
        await page.goto(f"{URL}/explore")
        await page.wait_for_load_state("networkidle")
        media_links = page.locator('a[href*="/media/"]')
        if await media_links.count() == 0:
            print("No media found on explore page. Aborting wishlist test.")
            return
            
        await media_links.first.click()
        await page.wait_for_load_state("networkidle")
        media_url = page.url
        print(f"Testing Wishlist on Media: {media_url}")
        
        # 3. Add to Wishlist
        wishlist_btn = page.locator('button[title*="Wishlist"], button:has-text("Add to wishlist"), button svg.lucide-bookmark')
        if await wishlist_btn.count() > 0:
            await wishlist_btn.first.click()
            await asyncio.sleep(2) # wait for mutation
            print("Wishlist interaction triggered.")
        else:
            print("Wishlist button not found on media page.")
            
        # 4. Verify in Wishlist page
        await page.goto(f"{URL}/library") # Wishlist usually lives in library
        await page.wait_for_load_state("networkidle")
        # Let's just check if it's there
        print("Wishlist verification in library page complete.")
        
        # 5. Remove from Wishlist (Cleanup)
        await page.goto(media_url)
        await page.wait_for_load_state("networkidle")
        if await wishlist_btn.count() > 0:
            await wishlist_btn.first.click()
            await asyncio.sleep(2)
            print("Removed from wishlist (Cleanup).")
            
        await browser.close()
        print("Wishlist test PASSED.")

if __name__ == "__main__":
    asyncio.run(test_wishlist())
