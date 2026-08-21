import asyncio
from playwright.async_api import async_playwright, expect
import time

URL = "http://127.0.0.1:3000"
EMAIL = "snmallick2401@gmail.com"
PASSWORD = "s9939668767"

async def test_auth():
    print("--- Testing Authentication & Logout ---")
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
        
        # 2. Verify Session
        expect(page.locator("aside")).to_be_visible
        print("Authenticated state confirmed.")
        
        # 3. Locate and Click Logout
        # The SignOutButton is in the sidebar for desktop view
        logout_btn = page.locator('aside button:has-text("Sign out")')
        await expect(logout_btn).to_be_visible()
        await logout_btn.click()
        
        # 4. Wait for redirect
        await page.wait_for_url(f"{URL}/login", timeout=15000)
        print("Redirected to login after logout.")
        
        # 5. Attempt protected routes
        await page.goto(f"{URL}/library")
        await page.wait_for_url(f"{URL}/login?next=%2Flibrary", timeout=5000)
        print("/library correctly redirected to login.")
        
        await page.goto(f"{URL}/profile")
        await page.wait_for_url(f"{URL}/login?next=%2Fprofile", timeout=5000)
        print("/profile correctly redirected to login.")
        
        await browser.close()
        print("Authentication test PASSED.")

if __name__ == "__main__":
    asyncio.run(test_auth())
