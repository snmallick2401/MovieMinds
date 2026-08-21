import asyncio
from playwright.async_api import async_playwright, expect
import time

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"

async def test_auth_logout(browser):
    print("--- Testing Logout ---")
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto(f"{URL}/login")
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    async with page.expect_response(lambda r: "supabase.co" in r.url, timeout=30000):
        await page.click('button[type="submit"]')
    await page.wait_for_url(f"{URL}/", timeout=30000)
    print("Logged in successfully.")
    
    # Logout
    # We assume there is a profile dropdown or a logout button
    # Let's navigate to profile to find logout if it's there
    await page.goto(f"{URL}/profile")
    logout_btn = page.locator('button:has-text("Sign Out"), button:has-text("Log out"), button:has-text("Logout"), a:has-text("Sign out")')
    if await logout_btn.count() > 0:
        await logout_btn.first.click()
        await page.wait_for_url(f"{URL}/login", timeout=15000)
        print("Logout successful. Redirected to login.")
    else:
        print("WARNING: Logout button not found on profile.")
    
    await context.close()


async def test_media_interactions(browser):
    print("--- Testing Media Interactions (Wishlist, Library, Rating, Review) ---")
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto(f"{URL}/login")
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    async with page.expect_response(lambda r: "supabase.co" in r.url, timeout=30000):
        await page.click('button[type="submit"]')
    await page.wait_for_url(f"{URL}/", timeout=30000)
    
    # Search for a specific media to test
    await page.goto(f"{URL}/search?q=Naruto")
    await page.wait_for_load_state("networkidle")
    
    media_links = page.locator('a[href*="/media/"]')
    if await media_links.count() == 0:
        print("No media found for 'Naruto'. Aborting media test.")
        await context.close()
        return
        
    await media_links.first.click()
    await page.wait_for_load_state("networkidle")
    media_url = page.url
    print(f"Testing on Media: {media_url}")
    
    # 1. Wishlist
    print("Testing Wishlist...")
    wishlist_btn = page.locator('button[title*="Wishlist"], button:has-text("Add to wishlist"), button svg.lucide-heart')
    if await wishlist_btn.count() > 0:
        await wishlist_btn.first.click()
        await asyncio.sleep(2)
        print("Wishlist interaction triggered.")
        
    # 2. Library
    print("Testing Library...")
    library_btn = page.locator('button:has-text("Add to Library"), button:has-text("Watching"), button:has-text("Plan to watch")')
    if await library_btn.count() > 0:
        await library_btn.first.click()
        await asyncio.sleep(2)
        print("Library interaction triggered.")
        
    # 3. Rating
    print("Testing Rating...")
    # Typically a star rating system or a select dropdown
    rating_stars = page.locator('button[aria-label*="Rate"], .rating-stars button, select[name="rating"]')
    if await rating_stars.count() > 0:
        if await rating_stars.first.get_attribute("type") == "button":
            await rating_stars.nth(4).click() # 5 stars/2.5 stars depending on scale
            await asyncio.sleep(1)
            print("Rating submitted.")
            
    # 4. Review
    print("Testing Reviews...")
    review_btn = page.locator('button:has-text("Write a review"), a:has-text("Write Review")')
    if await review_btn.count() > 0:
        await review_btn.first.click()
        await asyncio.sleep(1)
        headline = page.locator('input[name="headline"], input[placeholder*="Headline"]')
        if await headline.count() > 0:
            await headline.fill("Automated Test Review")
        content = page.locator('textarea[name="content"], textarea')
        if await content.count() > 0:
            await content.fill("This is an automated test review used for regression testing.")
        
        submit_review = page.locator('button[type="submit"]:has-text("Post"), button:has-text("Submit")')
        if await submit_review.count() > 0:
            await submit_review.click()
            await asyncio.sleep(2)
            print("Review submitted.")
            
    await context.close()


async def test_social_and_community(browser):
    print("--- Testing Social & Community ---")
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto(f"{URL}/login")
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    async with page.expect_response(lambda r: "supabase.co" in r.url, timeout=30000):
        await page.click('button[type="submit"]')
    await page.wait_for_url(f"{URL}/", timeout=30000)
    
    # Social Graph (People)
    print("Testing People/Social...")
    await page.goto(f"{URL}/people")
    await page.wait_for_load_state("networkidle")
    
    user_links = page.locator('a[href*="/profile/"]')
    if await user_links.count() > 1: # Ignore own profile if it's the first
        await user_links.nth(1).click()
        await page.wait_for_load_state("networkidle")
        print(f"Viewing user profile: {page.url}")
        
        follow_btn = page.locator('button:has-text("Follow")')
        if await follow_btn.count() > 0:
            await follow_btn.first.click()
            await asyncio.sleep(2)
            print("Follow triggered.")
            
            # Unfollow to clean up
            unfollow_btn = page.locator('button:has-text("Unfollow"), button:has-text("Following")')
            if await unfollow_btn.count() > 0:
                await unfollow_btn.first.click()
                await asyncio.sleep(1)
                print("Unfollow triggered.")
    
    # Community
    print("Testing Community...")
    await page.goto(f"{URL}/community")
    await page.wait_for_load_state("networkidle")
    
    thread_links = page.locator('a[href*="/community/thread/"]')
    if await thread_links.count() > 0:
        await thread_links.first.click()
        await page.wait_for_load_state("networkidle")
        print(f"Viewing thread: {page.url}")
        
    await context.close()


async def run_all():
    print("Starting Feature Tests...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        await test_auth_logout(browser)
        await test_media_interactions(browser)
        await test_social_and_community(browser)
        await browser.close()
        print("Feature Tests Completed.")

if __name__ == "__main__":
    asyncio.run(run_all())
