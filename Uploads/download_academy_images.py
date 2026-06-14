import os
import requests
from PIL import Image
from io import BytesIO
import time

# Create directories
base_path = "/home/ubuntu/tapchi-hcqs/nextjs_space/public/images"
campus_dir = os.path.join(base_path, "campus")
articles_dir = os.path.join(base_path, "articles")
hero_dir = os.path.join(base_path, "hero")

for directory in [campus_dir, articles_dir, hero_dir]:
    os.makedirs(directory, exist_ok=True)

# Image URLs organized by category
campus_images = [
    "https://congchungnguyenhue.com/Uploaded/Images/Original/2024/02/02/hc5-16928660893791491829394_0202094537.jpg",
    "https://weart.vn/wp-content/uploads/2025/06/hoc-vien-hau-can-nhin-tu-cong-chinh-1200x800.jpg",
    "https://navigates.vn/wp-content/uploads/2023/05/co-so-vat-chat-hoc-vien-hau-can-1.jpg",
    "https://navigates.vn/wp-content/uploads/2023/05/co-so-vat-chat-hoc-vien-hau-can-7.jpg",
    "https://navigates.vn/wp-content/uploads/2023/05/co-so-vat-chat-hoc-vien-hau-can-6.jpg",
    "https://navigates.vn/wp-content/uploads/2023/05/co-so-vat-chat-hoc-vien-hau-can-9.jpg",
    "https://navigates.vn/wp-content/uploads/2023/05/co-so-vat-chat-hoc-vien-hau-can-2.jpg",
    "http://hocvienhaucan.edu.vn/wp-content/blogs.dir/1/files/z6936807281096_23d9f2b4ac92d5477046e655126e06ac.jpg",
]

research_images = [
    "https://file3.qdnd.vn/data/images/0/2025/06/07/upload_2299/hc3452102447am.jpg?dpi=150&quality=100&w=870",
    "https://file3.qdnd.vn/data/images/5/2024/08/13/upload_2080/z5726002534625_a4dab2213a1d8aadff10bd2e63b52321.jpg?dpi=150&quality=100&w=870",
    "https://file3.qdnd.vn/data/images/0/2025/06/07/upload_2299/hvhc356102447am.jpg?dpi=150&quality=100&w=870",
    "https://file3.qdnd.vn/data/images/0/2025/04/18/upload_2223/anh%201%20hvhc.jpg?dpi=150&quality=100&w=870",
]

conference_images = [
    "http://hocvienhaucan.edu.vn/wp-content/blogs.dir/1/files/2504.jpg",
    "https://file3.qdnd.vn/data/images/0/2025/10/09/upload_2325/dsc_6693.jpg",
    "https://file3.qdnd.vn/data/images/0/2025/08/06/upload_2223/hoc%20vien%20hau%20can%20qdnd%20vn.jpg",
    "http://hocvienhaucan.edu.vn/wp-content/blogs.dir/1/files/892.jpg",
    "http://hocvienhaucan.edu.vn/wp-content/blogs.dir/1/files/1652.jpg",
]

logistics_images = [
    "https://upload.wikimedia.org/wikipedia/commons/6/6b/U.S._Marines_from_Combat_Logistics_Battalion_8%2C_Transportation_Support_Company%2C_work_together_with_Navy_personnel_from_Beach_Master_Unit_2_off-loading_ISO_containers_off_a_Landing_Craft_Utility_during_120615-M-KS710-039.jpg",
    "https://navigates.vn/wp-content/uploads/2023/04/hoc-vien-hau-can.jpg",
    "https://navigates.vn/wp-content/uploads/2023/04/hau-can.jpg",
]

def download_image(url, save_path, max_retries=3):
    """Download image with retry logic"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Open image to verify it's valid
            img = Image.open(BytesIO(response.content))
            
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Save image
            img.save(save_path, 'JPEG', quality=95)
            
            # Get dimensions
            width, height = img.size
            aspect_ratio = width / height
            
            return True, width, height, aspect_ratio
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed for {url}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return False, 0, 0, 0
    
    return False, 0, 0, 0

# Download campus images
print("Downloading campus images...")
campus_count = 0
for idx, url in enumerate(campus_images, 1):
    save_path = os.path.join(campus_dir, f"campus_{idx}.jpg")
    success, w, h, ratio = download_image(url, save_path)
    if success:
        campus_count += 1
        print(f"✓ Campus {idx}: {w}x{h} (ratio: {ratio:.2f}) - {save_path}")
    else:
        print(f"✗ Failed to download campus image {idx}")

# Download research images
print("\nDownloading research images...")
research_count = 0
for idx, url in enumerate(research_images, 1):
    save_path = os.path.join(articles_dir, f"research_{idx}.jpg")
    success, w, h, ratio = download_image(url, save_path)
    if success:
        research_count += 1
        print(f"✓ Research {idx}: {w}x{h} (ratio: {ratio:.2f}) - {save_path}")
    else:
        print(f"✗ Failed to download research image {idx}")

# Download conference images
print("\nDownloading conference images...")
conference_count = 0
for idx, url in enumerate(conference_images, 1):
    save_path = os.path.join(articles_dir, f"conference_{idx}.jpg")
    success, w, h, ratio = download_image(url, save_path)
    if success:
        conference_count += 1
        print(f"✓ Conference {idx}: {w}x{h} (ratio: {ratio:.2f}) - {save_path}")
    else:
        print(f"✗ Failed to download conference image {idx}")

# Download logistics images
print("\nDownloading logistics images...")
logistics_count = 0
for idx, url in enumerate(logistics_images, 1):
    save_path = os.path.join(articles_dir, f"logistics_{idx}.jpg")
    success, w, h, ratio = download_image(url, save_path)
    if success:
        logistics_count += 1
        print(f"✓ Logistics {idx}: {w}x{h} (ratio: {ratio:.2f}) - {save_path}")
    else:
        print(f"✗ Failed to download logistics image {idx}")

# Find suitable hero images (16:9 ratio)
print("\n" + "="*60)
print("Analyzing images for hero section (16:9 ratio)...")
print("="*60)

hero_candidates = []
all_dirs = [campus_dir, articles_dir]

for directory in all_dirs:
    for filename in os.listdir(directory):
        if filename.endswith('.jpg'):
            filepath = os.path.join(directory, filename)
            try:
                img = Image.open(filepath)
                w, h = img.size
                ratio = w / h
                
                # Check if close to 16:9 (1.77) - allow 10% tolerance
                if 1.6 <= ratio <= 1.95:
                    hero_candidates.append({
                        'path': filepath,
                        'filename': filename,
                        'width': w,
                        'height': h,
                        'ratio': ratio
                    })
            except:
                pass

# Sort by size (larger is better for hero)
hero_candidates.sort(key=lambda x: x['width'] * x['height'], reverse=True)

# Copy best candidates to hero folder
hero_count = 0
for idx, candidate in enumerate(hero_candidates[:3], 1):
    hero_path = os.path.join(hero_dir, f"hero_{idx}.jpg")
    img = Image.open(candidate['path'])
    
    # Ensure minimum size for hero images
    if img.size[0] >= 1200:
        img.save(hero_path, 'JPEG', quality=95)
        hero_count += 1
        print(f"✓ Hero {idx}: {candidate['width']}x{candidate['height']} (ratio: {candidate['ratio']:.2f})")
        print(f"  Source: {candidate['filename']}")
    
    if hero_count >= 2:
        break

# Summary
print("\n" + "="*60)
print("DOWNLOAD SUMMARY")
print("="*60)
print(f"Campus images: {campus_count}/{len(campus_images)}")
print(f"Research images: {research_count}/{len(research_images)}")
print(f"Conference images: {conference_count}/{len(conference_images)}")
print(f"Logistics images: {logistics_count}/{len(logistics_images)}")
print(f"Hero images (16:9): {hero_count}/2 minimum")
print("="*60)

# Check if we need to generate additional hero images
if hero_count < 2:
    print(f"\n⚠ Warning: Only {hero_count} hero images found. Need at least 2.")
    print("Consider generating additional hero images with 16:9 aspect ratio.")
    with open('/home/ubuntu/hero_images_needed.txt', 'w') as f:
        f.write(f"Need {2 - hero_count} more hero images in 16:9 aspect ratio\n")

print("\n✓ All images downloaded and organized!")
