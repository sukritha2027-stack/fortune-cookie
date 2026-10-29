"""Drive the Fortune Cookie app (local demo mode) and capture a 9:16 screencast.

Writes frames/*.jpg + frames.json (frame timestamps) + marks.json (event times),
and card.png (the app's own Story card). Retries until the low-water P.S. is the
"little raisin" line.
"""
import base64, datetime, json, os, random, shutil, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = sys.argv[2]
W, H, DSF = 405, 720, 1080 / 405  # 1080x1920 output

TOUCH_JS = """
(() => {
  const d = document.createElement('div');
  d.id = '__touch';
  Object.assign(d.style, {position:'fixed', width:'34px', height:'34px', marginLeft:'-17px', marginTop:'-17px',
    borderRadius:'50%', background:'rgba(255,255,255,.55)', border:'2px solid rgba(98,29,64,.35)',
    boxShadow:'0 2px 8px rgba(0,0,0,.18)', pointerEvents:'none', zIndex:2147483647, opacity:'0',
    transition:'opacity .12s, transform .12s', left:'-100px', top:'-100px'});
  document.documentElement.appendChild(d);
  addEventListener('mousemove', e => { d.style.left = e.clientX+'px'; d.style.top = e.clientY+'px'; }, true);
  addEventListener('mousedown', () => { d.style.opacity='1'; d.style.transform='scale(.85)'; }, true);
  addEventListener('mouseup', () => { d.style.transform='scale(1)'; setTimeout(()=>{ d.style.opacity='0'; }, 220); }, true);
})();
"""


def attempt(p, n):
    b = p.chromium.launch(args=["--force-device-scale-factor=%.7f" % DSF])
    ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=DSF,
                        is_mobile=True, has_touch=False, timezone_id="Asia/Kolkata")
    pg = ctx.new_page()
    pg.clock.set_fixed_time(datetime.datetime(2026, 10, 30, 3, 0, tzinfo=datetime.timezone.utc))  # 8:30 IST, Fri 30 Oct
    pg.goto(URL)
    pg.wait_for_selector("#authForm", state="visible")
    pg.fill("#authName", "Sukritha")
    pg.fill("#authEmail", f"demo{n}{random.randint(1000,9999)}@example.com")
    pg.fill("#authPass", "cookie123")
    pg.click("#authSubmit")
    # walkthrough
    pg.wait_for_selector("#walkOverlay", state="visible", timeout=8000)
    pg.click("#walkSkip")
    pg.wait_for_selector("#quizOverlay", state="visible", timeout=8000)
    pg.add_script_tag(content=TOUCH_JS)
    pg.wait_for_timeout(600)

    # answer the first 5 questions off camera
    for _ in range(5):
        pg.click("#qNext"); pg.wait_for_timeout(250)
    assert "water" in pg.inner_text("#qText").lower(), pg.inner_text("#qText")
    pg.wait_for_timeout(700)

    # ---- start capture ----
    frames_dir = os.path.join(OUT, "frames"); shutil.rmtree(frames_dir, ignore_errors=True); os.makedirs(frames_dir)
    cdp = ctx.new_cdp_session(pg)
    frames, marks = [], {}
    def on_frame(ev):
        i = len(frames)
        with open(os.path.join(frames_dir, f"{i:05d}.jpg"), "wb") as f:
            f.write(base64.b64decode(ev["data"]))
        frames.append(ev["metadata"]["timestamp"])
        try:
            cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})
        except Exception:
            pass
    cdp.on("Page.screencastFrame", on_frame)
    cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 72, "maxWidth": 1080, "maxHeight": 1920, "everyNthFrame": 1})
    pg.wait_for_timeout(900)
    marks["start"] = time.time()

    # drag the water slider all the way left, slowly
    box = pg.locator("#qSlider").bounding_box()
    y = box["y"] + box["height"] / 2
    x0 = box["x"] + box["width"] / 2
    x1 = box["x"] + 4
    pg.mouse.move(x0, y); pg.wait_for_timeout(150)
    marks["drag_start"] = time.time()
    pg.mouse.down()
    steps = 90  # slow on camera; sped up ~3x in the edit for smooth motion
    for k in range(1, steps + 1):
        pg.mouse.move(x0 + (x1 - x0) * (k / steps) ** 0.8, y); pg.wait_for_timeout(60)
    pg.mouse.up()
    marks["drag_end"] = time.time()
    pg.wait_for_timeout(700)
    val = pg.eval_on_selector("#qSlider", "e => +e.value")
    assert val < 30, f"water slider at {val}"

    # tap Next on the water question, then the remaining questions
    nb = pg.locator("#qNext").bounding_box()
    pg.mouse.move(nb["x"] + nb["width"] / 2, nb["y"] + nb["height"] / 2); pg.wait_for_timeout(150)
    pg.mouse.down(); pg.mouse.up()
    marks["quick_start"] = time.time()
    pg.wait_for_timeout(260)
    for q in range(6):
        sb = pg.locator("#qSlider").bounding_box()
        yy = sb["y"] + sb["height"] / 2
        xa = sb["x"] + sb["width"] / 2
        xb = sb["x"] + sb["width"] * random.choice([0.25, 0.35, 0.65, 0.75])
        pg.mouse.move(xa, yy); pg.mouse.down()
        for k in range(1, 9):
            pg.mouse.move(xa + (xb - xa) * k / 8, yy); pg.wait_for_timeout(18)
        pg.mouse.up(); pg.wait_for_timeout(120)
        nb = pg.locator("#qNext").bounding_box()
        pg.mouse.move(nb["x"] + nb["width"] / 2, nb["y"] + nb["height"] / 2)
        pg.mouse.down(); pg.mouse.up()
        pg.wait_for_timeout(260)
        if pg.locator("#crackOverlay").is_visible():
            break
    pg.wait_for_selector("#crackOverlay", state="visible", timeout=5000)
    marks["quick_end"] = time.time()
    pg.wait_for_timeout(900)

    # tap the cookie
    cb = pg.locator("#cookieBtn").bounding_box()
    pg.mouse.move(cb["x"] + cb["width"] / 2, cb["y"] + cb["height"] / 2)
    pg.wait_for_timeout(200)
    marks["tap"] = time.time()
    pg.mouse.down(); pg.mouse.up()
    marks["crack_sfx"] = marks["tap"] + 0.43
    marks["paper_sfx"] = marks["tap"] + 0.43 + 0.42
    pg.wait_for_function("getComputedStyle(document.querySelector('#stripLucky')).opacity === '1'", timeout=15000)
    marks["ps_visible"] = time.time()
    ps = pg.inner_text("#stripLucky")
    fortune = pg.inner_text("#stripText")
    pg.wait_for_timeout(2600)

    # get the card, story format
    gb = pg.locator("#crackCard").bounding_box()
    pg.mouse.move(gb["x"] + gb["width"] / 2, gb["y"] + gb["height"] / 2); pg.wait_for_timeout(250)
    marks["card_tap"] = time.time()
    pg.mouse.down(); pg.mouse.up()
    pg.wait_for_selector("#shareOverlay", state="visible", timeout=5000)
    pg.wait_for_timeout(700)
    st = pg.locator("#fmtSeg button[data-fmt=story]").bounding_box()
    pg.mouse.move(st["x"] + st["width"] / 2, st["y"] + st["height"] / 2); pg.wait_for_timeout(200)
    pg.mouse.down(); pg.mouse.up()
    pg.wait_for_function("document.querySelector('#cardImg').naturalHeight > document.querySelector('#cardImg').naturalWidth * 1.5", timeout=8000)
    marks["story_card"] = time.time()
    pg.wait_for_timeout(1500)
    marks["end"] = time.time()
    cdp.send("Page.stopScreencast")
    pg.wait_for_timeout(300)
    cdp.remove_listener("Page.screencastFrame", on_frame)

    data = pg.eval_on_selector("#cardImg", "e => e.src")
    with open(os.path.join(OUT, "card.png"), "wb") as f:
        f.write(base64.b64decode(data.split(",", 1)[1]))
    b.close()
    json.dump(frames, open(os.path.join(OUT, "frames.json"), "w"))
    json.dump(marks, open(os.path.join(OUT, "marks.json"), "w"), indent=1)
    return ps, fortune


with sync_playwright() as p:
    for n in range(8):
        ps, fortune = attempt(p, n)
        print(f"try {n}: fortune={fortune!r} ps={ps!r}")
        if "little raisin" in ps:
            print("GOT RAISIN")
            break
