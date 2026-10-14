import os
import sys
from pathlib import Path
from PIL import Image

def generate_overviews_for_folder(folder_path, min_overview_zoom=10):
    folder = Path(folder_path)
    existing_zooms = []
    for d in folder.iterdir():
        if d.is_dir() and d.name.isdigit():
            existing_zooms.append(int(d.name))
    
    if not existing_zooms:
        return 0
    
    current_min_zoom = min(existing_zooms)
    print(f"Processing {folder.name}: existing min zoom is {current_min_zoom}")
    
    total_created = 0
    for target_z in range(current_min_zoom - 1, min_overview_zoom - 1, -1):
        source_z = target_z + 1
        src_zoom_dir = folder / str(source_z)
        if not src_zoom_dir.exists():
            break
        
        child_tiles = {}
        for x_dir in src_zoom_dir.iterdir():
            if not x_dir.is_dir() or not x_dir.name.isdigit():
                continue
            x = int(x_dir.name)
            for y_file in x_dir.glob("*.png"):
                y_stem = y_file.stem
                if y_stem.isdigit():
                    y = int(y_stem)
                    px = x // 2
                    py = y // 2
                    child_tiles.setdefault((px, py), []).append((x, y, y_file))
        
        if not child_tiles:
            break
            
        target_zoom_dir = folder / str(target_z)
        target_zoom_dir.mkdir(exist_ok=True)
        
        for (px, py), children in child_tiles.items():
            parent_x_dir = target_zoom_dir / str(px)
            parent_x_dir.mkdir(exist_ok=True)
            parent_tile_path = parent_x_dir / f"{py}.png"
            
            canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
            for (cx, cy, cpath) in children:
                try:
                    with Image.open(cpath) as img:
                        img_rgba = img.convert("RGBA")
                        ox = (cx % 2) * 256
                        oy = (cy % 2) * 256
                        canvas.paste(img_rgba, (ox, oy))
                except Exception as e:
                    pass
            
            resized = canvas.resize((256, 256), Image.Resampling.BILINEAR)
            resized.save(parent_tile_path, "PNG", optimize=True)
            total_created += 1

    return total_created

def main():
    tiles_base = Path("/app/mediafiles/drone_tiles")
    if not tiles_base.exists():
        print(f"Tiles base {tiles_base} does not exist!")
        return
    
    total_tiles = 0
    for item in tiles_base.iterdir():
        if item.is_dir():
            created = generate_overviews_for_folder(item, min_overview_zoom=10)
            print(f"Created {created} overview tiles for {item.name}")
            total_tiles += created
            
    print(f"\nAll done! Total overview tiles created: {total_tiles}")

if __name__ == '__main__':
    main()
