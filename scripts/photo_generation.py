from PIL import Image, ImageDraw, ImageFont
import os
import random

# Используем постоянный фон из папки pictures
bg_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pictures", "blank_bg.png")
if not os.path.exists(bg_path):
    print(f"Background not found at {bg_path}")
    exit(1)

# Базовый фон
img_bg = Image.open(bg_path)
width, height = img_bg.size
new_height = 576
top = (height - new_height) // 2
bottom = top + new_height
img_bg = img_bg.crop((0, top, width, bottom))
img_bg = img_bg.resize((1280, 720), Image.Resampling.LANCZOS)

# Словарь: Название меню -> Иконка Unicode
# Используем Segoe MDL2 Assets (стандартный иконочный шрифт Windows)
menus = {
    "profile": "\uE77B",     # Person
    "information": "\uE946", # Info
    "education": "\uE718",   # Book
    "admin panel": "\uE774", # Globe (or Shield) - we'll use Globe for language, let's use Shield \uEA18 for admin
    "language": "\uE774",    # Globe
    "settings": "\uE713",    # Gear
}
# Корректируем иконку админки на более подходящую
menus["admin panel"] = "\uE8EF" # \uE8EF is often a wrench or gear-like, but \uE8D7 is crown. Let's use \uE7E3 (CommandPrompt) or \uE773 (Server)

try:
    font_main = ImageFont.truetype("georgiai.ttf", 160)
except IOError:
    try:
        font_main = ImageFont.truetype("timesi.ttf", 160)
    except IOError:
        font_main = ImageFont.load_default()

# Загружаем шрифт с иконками (встроен в Windows)
try:
    font_icon = ImageFont.truetype("segmdl2.ttf", 450)
except IOError:
    print("Warning: Icon font 'segmdl2.ttf' not found, using default.")
    font_icon = ImageFont.load_default()

try:
    font_watermark = ImageFont.truetype("arial.ttf", 24)
except IOError:
    font_watermark = ImageFont.load_default()

watermark_text = "https://t.me/dt_shadowbot"

for menu, icon_char in menus.items():
    img = img_bg.copy().convert("RGBA")
    
    # 1. Рисуем хаотичный паттерн иконок на заднем плане
    icon_layer = Image.new("RGBA", img.size, (255, 255, 255, 0))
    random.seed(menu) # Чтобы хаос для каждого меню был одинаковым при перезапуске
    
    for _ in range(35):
        size = random.randint(30, 200)
        try:
            fnt = ImageFont.truetype("segmdl2.ttf", size)
        except:
            fnt = ImageFont.load_default()
            
        txt_img = Image.new('RGBA', (size*2, size*2), (255, 255, 255, 0))
        txt_draw = ImageDraw.Draw(txt_img)
        
        alpha = random.randint(3, 15)
        txt_draw.text((size//2, size//2), icon_char, font=fnt, fill=(255, 255, 255, alpha))
        
        angle = random.randint(0, 360)
        rotated_txt = txt_img.rotate(angle, expand=1, resample=Image.Resampling.BICUBIC)
        
        x_rand = random.randint(-150, 1280)
        y_rand = random.randint(-150, 720)
        
        icon_layer.alpha_composite(rotated_txt, dest=(x_rand, y_rand))
    
    # Накладываем слой с иконкой
    img = Image.alpha_composite(img, icon_layer)
    draw = ImageDraw.Draw(img)
    
    # 2. Рисуем основной текст меню
    text_main = menu
    bbox = draw.textbbox((0, 0), text_main, font=font_main)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Авто-подгон размера шрифта, если текст не влезает
    current_font = font_main
    if text_w > 1200:
        scaled_size = int(160 * (1150 / text_w))
        try:
            current_font = ImageFont.truetype("georgiai.ttf", scaled_size)
        except:
            current_font = ImageFont.truetype("timesi.ttf", scaled_size)
        bbox = draw.textbbox((0, 0), text_main, font=current_font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

    x_center = (1280 - text_w) / 2
    y_center = (720 - text_h) / 2 - bbox[1]

    # Тень текста
    shadow_offset = 4
    draw.text((x_center + shadow_offset, y_center + shadow_offset), text_main, font=current_font, fill=(0, 0, 0, 255))
    # Основной текст
    draw.text((x_center, y_center), text_main, font=current_font, fill=(255, 255, 255, 255))
    
    # 3. Водяной знак
    x_wm = 30
    y_wm = 720 - 50
    draw.text((x_wm + 2, y_wm + 2), watermark_text, font=font_watermark, fill=(0, 0, 0, 255))
    draw.text((x_wm, y_wm), watermark_text, font=font_watermark, fill=(200, 200, 200, 255))
    
    # Сохраняем результат
    img = img.convert("RGB")
    filename = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "pictures", f"{menu.replace(' ', '_')}.png")
    img.save(filename)
    print(f"Saved {filename}")
