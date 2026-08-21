import asyncio
from playwright.async_api import async_playwright
import os

URL = "http://127.0.0.1:3000"

async def test_viewports():
    print("--- Testing Viewports ---")
    os.makedirs(".temp_screenshots", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Mobile
        mobile_context = await browser.new_context(viewport={"width": 390, "height": 844}, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")
        m_page = await mobile_context.new_page()
        await m_page.goto(f"{URL}/login")
        await m_page.screenshot(path=".temp_screenshots/mobile_login.png")
        await m_page.goto(f"{URL}/explore")
        await asyncio.sleep(2)
        await m_page.screenshot(path=".temp_screenshots/mobile_explore.png")
        await m_page.goto(f"{URL}/media/cmsmbh76i038gv6p83tr9ddr9")
        await asyncio.sleep(2)
        await m_page.screenshot(path=".temp_screenshots/mobile_media.png")
        print("Mobile screenshots saved.")
        await mobile_context.close()
        
        # Tablet
        tablet_context = await browser.new_context(viewport={"width": 768, "height": 1024})
        t_page = await tablet_context.new_page()
        await t_page.goto(f"{URL}/explore")
        await asyncio.sleep(2)
        await t_page.screenshot(path=".temp_screenshots/tablet_explore.png")
        await t_page.goto(f"{URL}/community")
        await asyncio.sleep(2)
        await t_page.screenshot(path=".temp_screenshots/tablet_community.png")
        print("Tablet screenshots saved.")
        await tablet_context.close()
        
        await browser.close()
        print("Viewport test PASSED.")

if __name__ == "__main__":
    asyncio.run(test_viewports())
