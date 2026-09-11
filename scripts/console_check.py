from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_msgs = []
    page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text[:300]}"))
    page.on("pageerror", lambda err: console_msgs.append(f"[PAGEERROR] {str(err)[:300]}"))
    failed = []
    page.on("requestfailed", lambda req: failed.append(f"{req.url[:120]} :: {req.failure}"))

    page.goto("http://localhost:3000/", wait_until="networkidle", timeout=60000)
    page.goto("http://localhost:3000/actions", wait_until="networkidle", timeout=60000)
    page.goto("http://localhost:3000/leaderboard", wait_until="networkidle", timeout=60000)

    print("=== CONSOLE ===")
    for m in console_msgs[:40]:
        print(m)
    if not console_msgs:
        print("(clean - no console messages)")
    print("=== FAILED REQUESTS ===")
    for f in failed[:15]:
        print(f)
    if not failed:
        print("(none)")

    browser.close()
