import os
from PIL import Image

def process_notification_icon():
    source_img_path = "/Users/dorian/.gemini/antigravity/brain/b52e7e5a-6e2a-42a6-b37b-9e68d920d815/headphones_alternatives_1782460117784.png"
    target_img_dir = "/Users/dorian/.gemini/antigravity/scratch/DJVIP/android/app/src/main/res/drawable"
    
    if not os.path.exists(source_img_path):
        print(f"Error: Source image not found at {source_img_path}")
        return
        
    img = Image.open(source_img_path).convert("RGBA")
    width, height = img.size
    
    # 1. Encontrar los píxeles blancos en el tercio izquierdo (Opción 1)
    # R > 200, G > 200, B > 200 es considerado blanco
    white_pixels = []
    for x in range(0, int(width / 3)):
        for y in range(0, int(height * 0.7)):  # Evitar el texto de abajo
            r, g, b, a = img.getpixel((x, y))
            if r > 200 and g > 200 and b > 200:
                white_pixels.append((x, y))
                
    if not white_pixels:
        print("Error: No se encontraron píxeles blancos para la Opción 1.")
        return
        
    # Bounding box de la Opción 1
    min_x = min(p[0] for p in white_pixels)
    max_x = max(p[0] for p in white_pixels)
    min_y = min(p[1] for p in white_pixels)
    max_y = max(p[1] for p in white_pixels)
    
    print(f"Option 1 bounding box: X({min_x} to {max_x}), Y({min_y} to {max_y})")
    
    # Añadir un pequeño padding de 8px
    padding = 8
    crop_min_x = max(0, min_x - padding)
    crop_max_x = min(width, max_x + padding)
    crop_min_y = max(0, min_y - padding)
    crop_max_y = min(height, max_y + padding)
    
    # Recortar
    cropped = img.crop((crop_min_x, crop_min_y, crop_max_x, crop_max_y))
    c_width, c_height = cropped.size
    
    # 2. Convertir a silueta blanca pura sobre fondo transparente
    final_icon = Image.new("RGBA", (c_width, c_height), (255, 255, 255, 0))
    for x in range(c_width):
        for y in range(c_height):
            r, g, b, a = cropped.getpixel((x, y))
            # Calcular la intensidad de brillo para suavizar los bordes (anti-aliasing)
            brightness = int((r + g + b) / 3)
            if brightness > 40:
                # El alpha de la silueta será proporcional a la luminosidad original
                alpha = int(a * (brightness / 255.0))
                # Dibujar píxel blanco con el alpha calculado
                final_icon.putpixel((x, y), (255, 255, 255, alpha))
                
    # 3. Redimensionar a varios tamaños estándar para Android y guardar
    # densities:
    # drawable (default fallback) -> 72x72
    # drawable-mdpi -> 24x24
    # drawable-hdpi -> 36x36
    # drawable-xhdpi -> 48x48
    # drawable-xxhdpi -> 72x72
    # drawable-xxxhdpi -> 96x96
    
    sizes = {
        "": 72,
        "-hdpi": 36,
        "-mdpi": 24,
        "-xhdpi": 48,
        "-xxhdpi": 72,
        "-xxxhdpi": 96
    }
    
    res_base_dir = "/Users/dorian/.gemini/antigravity/scratch/DJVIP/android/app/src/main/res"
    
    for suffix, size in sizes.items():
        resized = final_icon.resize((size, size), Image.Resampling.LANCZOS)
        
        # Determinar el directorio de destino
        # Si suffix es vacío, va a res/drawable/
        # Si no, va a res/drawable-hdpi/, res/drawable-mdpi/, etc.
        folder_name = f"drawable{suffix}"
        target_dir = os.path.join(res_base_dir, folder_name)
        os.makedirs(target_dir, exist_ok=True)
        
        output_path = os.path.join(target_dir, "ic_notification.png")
        resized.save(output_path, "PNG")
        print(f"Guardado: {output_path} (tamaño: {size}x{size})")
        
if __name__ == "__main__":
    process_notification_icon()
