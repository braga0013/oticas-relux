import sys
from PIL import Image
from rembg import remove, new_session

session = new_session("u2netp")  # modelo leve e rápido
names = ["sol", "grau", "lente", "infantil"]
for n in names:
    src = f"originais/{n}.png"
    inp = Image.open(src).convert("RGBA")
    out = remove(inp, session=session, post_process_mask=True)
    # recorta para o conteúdo (bounding box do que sobrou) p/ enquadrar melhor
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(f"{n}.png")
    print(f"OK {n}.png -> {out.size}")
print("DONE")
