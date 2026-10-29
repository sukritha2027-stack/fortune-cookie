"""Cut the recorded screencast into Reel 1: speed ramps, text overlays, end card, audio."""
import bisect, json, os, shutil, subprocess, sys
from PIL import Image

REC, OV, SOUNDS, OUT = sys.argv[1:5]
FPS = 30
fr = json.load(open(os.path.join(REC, "frames.json")))
m = json.load(open(os.path.join(REC, "marks.json")))

def src(t):
    i = max(0, bisect.bisect(fr, t) - 1)
    return os.path.join(REC, "frames", f"{i:05d}.jpg")

# (name, src_start, src_end, output_seconds, overlay schedule: list of (overlay, from_src_t, to_src_t, y_center))
segs = [
    ("drag",  m["drag_start"] - 0.2, m["drag_end"] + 0.3, 1.6),
    ("quick", m["drag_end"] + 0.3, m["quick_end"] + 0.25, 0.9),
    ("crack", m["tap"] - 0.35, m["ps_visible"] + 2.2, None),          # real time
    ("hold", m["ps_visible"] + 2.2, m["ps_visible"] + 2.2, 1.6),       # freeze on the settled P.S.
    ("tapcard", m["ps_visible"] + 2.2, m["card_tap"] + 0.35, None),    # real time
]
END_CARD_S = 4.0

Q_Y, TOP_Y = 0.12, 0.17
overlays = {k: Image.open(os.path.join(OV, k + ".png")).convert("RGBA") for k in ["hook", "quick", "crack", "ps", "end"]}

def zoom_for(seg, st):
    # ease into a 1.45x zoom on the paper strip once the P.S. is up
    if seg == "crack" and st >= m["ps_visible"] + 0.1:
        x = min(1.0, (st - m["ps_visible"] - 0.1) / 0.7)
        return 1 + 0.15 * (x * x * (3 - 2 * x))
    if seg in ("hold", "tapcard"):
        return 1.15
    return 1.0

ZC = (0.5, 0.62)  # zoom centre (x, y) as a fraction of the frame

def apply_zoom(im, z):
    if z <= 1.0001:
        return im
    w, h = 1080 / z, 1920 / z
    cx, cy = 1080 * ZC[0], 1920 * ZC[1]
    left = min(max(cx - w / 2, 0), 1080 - w); top = min(max(cy - h / 2, 0), 1920 - h)
    return im.resize((1080, 1920), Image.LANCZOS, box=(left, top, left + w, top + h))

def overlay_for(seg, st):
    if seg == "drag":
        return "hook", Q_Y
    if seg == "quick":
        return "quick", Q_Y
    if seg == "crack":
        if st < m["tap"] + 1.6:
            return "crack", TOP_Y
        if st >= m["ps_visible"]:
            return "ps", TOP_Y
        return None, None
    if seg in ("hold", "tapcard"):
        return "ps", TOP_Y
    return None, None

frames_out = os.path.join(OUT, "frames"); shutil.rmtree(frames_out, ignore_errors=True); os.makedirs(frames_out)
n = 0; t_out = 0.0; timeline = {}
cache = {}
for name, s0, s1, dur in segs:
    length = (s1 - s0) if dur is None else dur
    speed = (s1 - s0) / length
    timeline[name] = (t_out, t_out + length, speed)
    k = 0
    while k / FPS < length - 1e-6:
        st = s0 + (k / FPS) * speed
        path = src(st)
        im = cache.get(path)
        if im is None:
            im = Image.open(path).convert("RGBA"); cache.clear(); cache[path] = im
        frame = apply_zoom(im, zoom_for(name, st)).copy()
        ov, yc = overlay_for(name, st)
        if ov:
            o = overlays[ov]; frame.alpha_composite(o, (0, int(1920 * yc - o.size[1] / 2)))
        frame.convert("RGB").save(os.path.join(frames_out, f"{n:05d}.jpg"), quality=93)
        n += 1; k += 1
    t_out += length

# end card: the app's own Story card, full screen
card = Image.open(os.path.join(REC, "card.png")).convert("RGBA").resize((1080, 1920))
o = overlays["end"]; card.alpha_composite(o, (0, int(1920 * 0.17 - o.size[1] / 2)))
card = card.convert("RGB")
timeline["endcard"] = (t_out, t_out + END_CARD_S, 1)
for k in range(int(END_CARD_S * FPS)):
    card.save(os.path.join(frames_out, f"{n:05d}.jpg"), quality=93); n += 1
total = n / FPS

# audio times in the output timeline
c0, _, _ = timeline["crack"]
crack_t = c0 + (m["crack_sfx"] - (m["tap"] - 0.35))
paper_t = c0 + (m["paper_sfx"] - (m["tap"] - 0.35))
tap_t = c0 + 0.35
json.dump({"timeline": timeline, "crack_t": crack_t, "paper_t": paper_t, "total": total}, open(os.path.join(OUT, "edl.json"), "w"), indent=1)
print(json.dumps({"timeline": timeline, "crack_t": round(crack_t, 2), "paper_t": round(paper_t, 2), "total": total}))

# music: app lullaby at low level, ducked at the crack (like the app does), back up after the P.S.
ps_out = c0 + (m["ps_visible"] - (m["tap"] - 0.35))
vol = (f"volume='if(lt(t,{tap_t:.2f}),0.32,if(lt(t,{ps_out:.2f}),0.10,0.10+min(0.18,(t-{ps_out:.2f})*0.12)))':eval=frame")
fc = (f"[1:a]atrim=0:{total:.2f},{vol},afade=t=out:st={total-0.8:.2f}:d=0.8[mu];"
      f"[2:a]adelay={int(crack_t*1000)}|{int(crack_t*1000)},volume=1.5[cr];"
      f"[3:a]adelay={int(paper_t*1000)}|{int(paper_t*1000)},volume=0.45[pa];"
      f"[mu][cr][pa]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95[a]")
out_mp4 = os.path.join(OUT, "reel.mp4")
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(frames_out, "%05d.jpg"),
       "-stream_loop", "-1", "-i", os.path.join(SOUNDS, "lullaby.mp3"),
       "-i", os.path.join(SOUNDS, "crack.mp3"), "-i", os.path.join(SOUNDS, "paper.mp3"),
       "-filter_complex", fc, "-map", "0:v", "-map", "[a]",
       "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-t", f"{total:.3f}", out_mp4]
subprocess.run(cmd, check=True)
print("wrote", out_mp4)
