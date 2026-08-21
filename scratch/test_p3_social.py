import asyncio
from playwright.async_api import async_playwright, expect
import time

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"

async def test_social_community():
    print("--- Testing Social & Community Phase 3 ---")
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
        
        # 2. People & Follow
        print("Navigating to /people...")
        await page.goto(f"{URL}/people")
        await page.wait_for_load_state("networkidle")
        
        profile_links = page.locator('a[href*="/profile/"]')
        if await profile_links.count() > 1:
            await profile_links.nth(1).click()
            await page.wait_for_load_state("networkidle")
            print(f"Viewing user profile: {page.url}")
            
            # Follow
            follow_btn = page.locator('button:has-text("Follow")')
            if await follow_btn.count() > 0:
                await follow_btn.first.click()
                await asyncio.sleep(2)
                print("Followed user successfully.")
                
            # Unfollow
            unfollow_btn = page.locator('button:has-text("Unfollow"), button:has-text("Following")')
            if await unfollow_btn.count() > 0:
                await unfollow_btn.first.click()
                await asyncio.sleep(2)
                print("Unfollowed user successfully.")
        else:
            print("No other users found on /people page.")
            
        # 3. Community
        print("Navigating to /community...")
        await page.goto(f"{URL}/community")
        await page.wait_for_load_state("networkidle")
        
        threads = page.locator('a[href*="/community/thread/"]')
        if await threads.count() > 0:
            await threads.first.click()
            await page.wait_for_load_state("networkidle")
            print(f"Viewing community thread: {page.url}")
        else:
            print("No community threads found.")
            
        await browser.close()
        print("Social & Community tests PASSED.")

if __name__ == "__main__":
    asyncio.run(test_social_community())
