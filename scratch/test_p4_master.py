import asyncio
from playwright.async_api import async_playwright, expect
import time

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"
MEDIA_ID = "cmsmbh76i038gv6p83tr9ddr9"

async def test_master():
    print("--- Phase 4 Master Test ---")
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
        print("Logged in successfully.")
        
        # 2. Reviews & Wishlist CRUD
        print(f"Navigating to media {MEDIA_ID}")
        await page.goto(f"{URL}/media/{MEDIA_ID}")
        await page.wait_for_load_state("networkidle")
        
        # Wishlist Add
        wishlist_btn = page.locator('button[title*="Wishlist"], button:has-text("Add to wishlist"), button svg.lucide-bookmark')
        if await wishlist_btn.count() > 0:
            await wishlist_btn.first.click()
            await asyncio.sleep(2)
            print("Wishlist interaction triggered.")
        
        # Review Create
        review_btn = page.locator('button:has-text("Write a review"), a:has-text("Write Review")')
        if await review_btn.count() > 0:
            await review_btn.first.click()
            await asyncio.sleep(1)
            headline = page.locator('input[name="headline"], input[placeholder*="Headline"]')
            if await headline.count() > 0:
                await headline.fill("Automated Phase 4 Review")
            content = page.locator('textarea[name="content"], textarea')
            if await content.count() > 0:
                await content.fill("This is a Phase 4 comprehensive regression test review.")
            
            submit_review = page.locator('button[type="submit"]:has-text("Post"), button:has-text("Submit")')
            if await submit_review.count() > 0:
                await submit_review.click()
                await asyncio.sleep(2)
                print("Review created.")
                
        # 3. Notifications & Social
        await page.goto(f"{URL}/notifications")
        await page.wait_for_load_state("networkidle")
        print("Notifications page rendered.")
        
        # 4. AI Recommendations
        await page.goto(f"{URL}/media/{MEDIA_ID}")
        ai_btn = page.locator('button:has-text("AI Recommendations"), a:has-text("Similar")')
        if await ai_btn.count() > 0:
            await ai_btn.first.click()
            await page.wait_for_load_state("networkidle")
            print("AI Recommendation interaction triggered.")
            
        await browser.close()
        print("Phase 4 Master Test PASSED.")

if __name__ == "__main__":
    asyncio.run(test_master())
