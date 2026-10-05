"""Extract the runner from the three user photographs without changing the subject.

Requires Pillow, numpy, and opencv-python-headless. The ordered source names below
are deliberate. A hand-traced outline seeds GrabCut; exports retain full-image
coordinates so the cutouts align exactly with their corresponding beach frames.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "running"
OUT.mkdir(parents=True, exist_ok=True)
FRAMES = [
    ("shared image (1).jpg", [(599,443),(611,430),(635,424),(663,428),(680,445),(680,474),(669,503),(690,515),(721,525),(744,538),(756,571),(760,602),(758,636),(762,678),(772,695),(765,708),(755,718),(744,711),(742,690),(744,668),(738,641),(733,611),(725,602),(730,652),(731,692),(724,739),(708,780),(684,806),(703,817),(705,839),(690,866),(678,865),(677,846),(664,858),(645,897),(625,933),(614,951),(621,965),(637,970),(643,978),(601,983),(578,980),(570,964),(576,946),(563,935),(571,917),(580,875),(588,841),(588,782),(589,730),(596,689),(604,670),(589,658),(579,639),(575,606),(574,578),(580,550),(591,529),(609,516),(615,507),(604,489),(601,469)]),
    ("shared image.jpg", [(478,412),(491,398),(517,389),(546,393),(565,405),(575,425),(572,455),(563,470),(593,474),(623,486),(643,513),(660,548),(676,577),(681,599),(668,622),(656,644),(637,672),(635,708),(637,756),(630,801),(614,850),(595,881),(578,894),(554,886),(540,866),(530,845),(538,899),(547,942),(554,961),(546,975),(561,992),(569,1003),(551,1010),(516,1000),(508,984),(496,975),(490,954),(485,923),(483,888),(478,852),(474,817),(474,771),(478,737),(479,700),(466,682),(478,672),(473,647),(463,655),(452,671),(441,669),(430,658),(437,645),(451,630),(458,600),(461,571),(464,545),(454,524),(450,505),(461,488),(488,477),(496,470),(488,453),(484,437)]),
    ("shared image (3).jpg", [(368,251),(380,237),(402,229),(433,224),(459,230),(482,241),(490,259),(486,286),(483,320),(469,346),(464,359),(497,371),(532,388),(555,407),(569,445),(575,480),(591,524),(584,548),(587,588),(585,624),(584,665),(571,682),(556,684),(551,670),(562,648),(558,621),(555,593),(550,569),(542,553),(536,610),(539,652),(535,697),(531,744),(526,795),(515,852),(497,917),(473,980),(453,1042),(465,1069),(450,1080),(398,1080),(400,1051),(416,1010),(424,955),(422,914),(422,880),(402,893),(386,898),(364,896),(342,888),(325,868),(317,847),(317,815),(314,772),(312,727),(312,692),(324,663),(326,638),(307,652),(309,669),(299,680),(284,683),(276,672),(278,653),(280,631),(279,609),(275,578),(273,548),(261,539),(269,516),(278,487),(288,451),(302,416),(317,394),(342,381),(372,372),(384,360),(393,348),(382,328),(377,303)]),
]

for index, (name, outline) in enumerate(FRAMES, start=1):
    source = Image.open(ROOT / name).convert("RGB")
    rgb = np.array(source)
    polygon = np.zeros(rgb.shape[:2], dtype=np.uint8)
    cv2.fillPoly(polygon, [np.array(outline, dtype=np.int32)], 255)
    mask = np.full(polygon.shape, cv2.GC_BGD, dtype=np.uint8)
    mask[cv2.dilate(polygon, np.ones((17, 17), np.uint8)) > 0] = cv2.GC_PR_BGD
    mask[polygon > 0] = cv2.GC_PR_FGD
    mask[cv2.erode(polygon, np.ones((15, 15), np.uint8)) > 0] = cv2.GC_FGD
    # Known gaps between the arms and torso remain transparent.
    holes = {1: [(732,618),(737,621),(742,645),(741,664),(735,644)],
             2: [(638,595),(645,604),(643,624),(636,617)],
             3: [(318,551),(333,545),(327,582),(320,619),(310,624),(307,604)]}
    cv2.fillPoly(mask, [np.array(holes[index], dtype=np.int32)], cv2.GC_BGD)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, None,
                np.zeros((1,65), np.float64), np.zeros((1,65), np.float64), 5, cv2.GC_INIT_WITH_MASK)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # Sunlit water can enter the seed outline near bent limbs. Remove bright
    # regions connected to the exterior, retaining isolated shirt droplets.
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    exterior = np.where((gray > 65) | (alpha == 0), 255, 0).astype(np.uint8)
    cv2.floodFill(exterior, None, (0, 0), 128)
    footwear = {1: 942, 2: 975, 3: 1055}[index]
    remove = exterior == 128
    remove[footwear:] = False
    alpha[remove] = 0
    count, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), 8)
    if count > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        alpha[labels != largest] = 0
    alpha = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.55))
    cutout = source.convert("RGBA")
    cutout.putalpha(alpha)
    cutout.resize((1600, 900), Image.Resampling.LANCZOS).save(OUT / f"runner-{index}.webp", quality=94, method=6)
    # Tight alpha crops for the decorative prop in the interests section.
    with Image.open(OUT / f"runner-{index}.webp") as runner:
        runner.crop(runner.getbbox()).save(OUT / f"prop-{index}.webp", quality=92)
    source.resize((1600, 900), Image.Resampling.LANCZOS).save(OUT / f"beach-{index}.webp", quality=86, method=6)
    # Reconstruct the hidden beach from adjacent pixels, avoiding a second
    # silhouette when the foreground scales away from the original photograph.
    height, width = rgb.shape[:2]
    yy, xx = np.indices((height, width))
    adjacent = rgb[np.clip(yy - 12, 0, height - 1), np.clip(xx + 360, 0, width - 1)]
    patch_mask = cv2.dilate(polygon, np.ones((29, 29), np.uint8))
    blend = cv2.GaussianBlur(patch_mask, (41, 41), 0).astype(np.float32)[..., None] / 255
    plate = Image.fromarray((rgb * (1 - blend) + adjacent * blend).astype(np.uint8))
    plate.resize((1600, 900), Image.Resampling.LANCZOS).save(OUT / f"plate-{index}.webp", quality=86, method=6)
    print(f"{index}: {name} -> original beach, clean plate, transparent runner")
