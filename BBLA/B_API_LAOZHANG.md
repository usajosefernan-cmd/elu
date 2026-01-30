# LaoZhang API - Guía de Integración para Luxifier

## 🔐 Configuración

**API Key:** `LAOZHANG_API_KEY` (Configurada en Supabase Secrets)

> **Frontend Note:** Para integraciones cliente (React/Vite) como LuxCanvas, definir `VITE_LAOZHANG_API_KEY` en `.env`.
> **Base URL:** `https://api.laozhang.ai`

## 🔗 Enlaces Oficiales

- **Documentación General:** [LaoZhang API Docs](https://docs.laozhang.ai/en/api-capabilities/image-generation-guide)
- **Nano Banana:** [Guía de Edición](https://docs.laozhang.ai/en/api-capabilities/nano-banana-image-edit)
- **Nano Banana Pro:** [Guía de Edición](https://docs.laozhang.ai/en/api-capabilities/nano-banana-pro-image-edit)
- **SeeDream 4.0:** [Guía de Generación](https://docs.laozhang.ai/en/api-capabilities/seedream-image-generation)
- **Sora Image:** [Guía de Edición](https://docs.laozhang.ai/en/api-capabilities/sora-image-edit)

---

## 🍌 Modelos Disponibles para Edición de Imágenes

### 1. Nano Banana (Preview Rápido)

| Campo     | Valor                         |
| --------- | ----------------------------- |
| Modelo    | `gemini-2.5-flash-image`      |
| Endpoint  | `/v1/chat/completions`        |
| Costo     | **$0.025/edit**               |
| Velocidad | ~10 segundos                  |
| Uso       | Previews rápidas, iteraciones |

### 2. Nano Banana Pro (Gemini 3 Pro) ⭐ PRINCIPAL

| Campo           | Valor                                                         |
| --------------- | ------------------------------------------------------------- |
| Modelo          | `gemini-3-pro-image-preview`                                  |
| Endpoint Nativo | `/v1beta/models/gemini-3-pro-image-preview:generateContent`   |
| Costo           | **$0.05/edit**                                                |
| Resolución      | **2K Nativo** (2048x1536) / 4K                                |
| Configuración   | **IMPORTANTE:** No enviar `aspectRatio` para evitar recortes. |
| Uso             | Restauración final de alta calidad                            |

### 3. SeeDream 4.0 (Forensic Re-Shoot)

| Campo    | Valor                                                                     |
| -------- | ------------------------------------------------------------------------- |
| Modelo   | `seedream-4-0-250828`                                                     |
| Endpoint | `/v1/images/generations`                                                  |
| Costo    | **$0.01/imagen**                                                          |
| Feature  | **Latitude Recovery & Forensic Reshoot**                                  |
| Uso      | Reshoot forense directo (Forensic Reshoot). Ideal para escenas complejas. |

### 4. Sora Image (Generación Inteligente V2)

| Campo          | Valor                                     |
| -------------- | ----------------------------------------- |
| Modelo         | `sora_image`                              |
| Endpoint       | `/v1/chat/completions`                    |
| Costo          | **$0.01/imagen**                          |
| **Limitation** | **Ceguera:** Ignora input visual directo. |
| **Solución**   | **"Magic Eye V2" Pipeline**               |
| Uso            | Reconstrucción Ultra-Fidelity de escenas. |

---

## �️ Estrategia de Implementación (Updated)

1. **Previews:** Usar `gemini-2.5-flash-image` ($0.025, rápido)
2. **Restauración Fiel (2K):** Usar `gemini-3-pro-image-preview` (Nano Banana Pro).
3. **Re-Shoot (4K):** Usar `seedream-4-0-250828` para máxima fidelidad 4K.
4. **Rescate Creativo:** Usar `sora_image` (Magic Eye) o `gpt-4o-image` (Direct Edit).

---

## 📊 Resultados de Pruebas (2026-01-09)

| Modelo              | Estrategia                          | Resultado                                                 |
| ------------------- | ----------------------------------- | --------------------------------------------------------- |
| Nano Banana Preview | **Master Forensic Prompt**          | ✅ "Razor-sharp" texturas, piel orgánica.                  |
| Nano Banana Pro 2K  | **Config Nativa (Sin AspectRatio)** | ✅ Máxima Calidad (2K), sin recortes.                      |
| GPT-4o Direct Edit  | **Mega Prompt Unificado**           | ✅ **Éxito (47s)**. Edición single-shot de alta fidelidad. |
| **SeeDream 4.0**    | **Forensic Reshoot 4K**             | 🟡 Testing...                                             |
| Sora Magic Eye V2   | Vision -> Text -> Gen               | ✅ Reconstrucción cinemática semántica.                    |

**Conclusión:**

- **Nano Banana Pro:** Calidad Máxima Nativa (Restauración).

- **SeeDream 4.0:** Promesa de Reshoot 4K (Testing).

- **GPT-4o Direct:** Mejor balance Calidad/Velocidad para "Re-Shoot".

- [Nano Banana Pro](https://docs.laozhang.ai/en/api-capabilities/nano-banana-pro-image-edit)

- [Nano Banana](https://docs.laozhang.ai/en/api-capabilities/nano-banana-image-edit)

- [Sora Image Edit](https://docs.laozhang.ai/en/api-capabilities/sora-image-edit)
  ******** DOCUMENTACION:
  <https://docs.laozhang.ai/en/api-capabilities/image-generation-guide>
  (aqui esta edciion nanaobananpro nanonbana sora y seedream)
  🍒 Nano Banana Pro
  Nano Banana Pro Image Editing
  Nano Banana Pro Image Editing API: Professional image editing powered by Gemini 3 Pro. $0.05/edit, supports 4K output, complex instructions, multi-image fusion (up to 14 images).

🧠 Intelligent Editing at New Heights Nano Banana Pro Edit uses Google’s Gemini 3 Pro model with exceptional semantic understanding. It doesn’t just “modify images” - it “understands and redraws” them.
🎁 Free Trial
Register and get $0.05 credit to test Nano Banana Pro once
🚀 Live Demo
AI Images - Try instantly, no code required
​
Prerequisites
1
Get API Key

Login to laozhang.ai console to get your API key
2
Configure Billing Mode

Edit token settings and select one of these billing modes (same price):
Pay-per-use Priority (Recommended): Use balance first, auto-switch when insufficient
Pay-per-use: Direct charge per request. Best for strict budget control
Both modes have identical pricing at $0.05/edit, only the billing method differs.
Token Settings
API calls will fail without proper billing configuration. Complete this setup first!
​
Model Overview
Nano Banana Pro Edit (gemini-3-pro-image-preview) is designed for scenarios requiring precise control and high-quality output. Unlike simple filters or patches, it understands complex natural language instructions and makes logical modifications to images.
​
Core Capabilities
Precise Local Editing: “Replace that cat with a dog wearing glasses, but keep the same pose”
Perfect Style Transfer: “Transform this photo into cyberpunk-style oil painting with stronger lighting”
Multi-Image Creative Fusion: “Combine these two images to generate a brand new poster”
4K HD Output: Supports 2K/4K resolution output for edited results
​
🌟 Core Features
⚡ Fast Response: ~10 seconds average for editing
💰 Great Value:
0.05
/
e
d
i
t
(
79
0.05/edit(790.24)
🔄 Dual Compatibility: Supports OpenAI SDK and Google native formats
📐 Flexible Sizes: Google native format supports 10 aspect ratios
🖼️ High Resolution: Supports 1K, 2K, 4K resolution output
🧠 Thinking Mode: Built-in reasoning ability, understands complex editing instructions
🌐 Search Grounding: Supports combining real-time search data for editing
🎨 Multi-Image Reference: Supports up to 14 reference images for complex compositing
📦 Base64 Output: Returns base64 encoded image data directly
​
🔀 Two API Modes
Feature OpenAI Compatible Mode Google Native Format
Endpoint /v1/chat/completions /v1beta/models/gemini-3-pro-image-preview:generateContent
Output Size Default ratio 10 aspect ratios
Resolution Fixed 1K 1K/2K/4K
Multi-Image ✅ Supported ✅ Supported (up to 14)
Compatibility Perfect with OpenAI SDK Requires native calls
Return Format Base64 Base64
Image Input URL or Base64 Base64 (inline_data)
💡 How to Choose?
For default ratio images, use OpenAI Compatible Mode - simple and fast
For custom aspect ratios (like 16:9, 9:16) or high-res (2K/4K), use Google Native Format
​
📋 Model Comparison
​
Comparison with Other Editing Models
Model Model ID Billing LaoZhang Price Official Price Savings Resolution Speed
Nano Banana Pro gemini-3-pro-image-preview Per-use $0.05/edit $0.24/edit 79% 1K/2K/4K ~10s
Nano Banana gemini-2.5-flash-image Per-use $0.025/edit $0.04/edit 37.5% 1K (fixed) ~10s
GPT-4o Edit gpt-4o Token - - - - ~20s
DALL·E 2 Edit dall-e-2 Per-use - $0.018/image - Fixed Slower
​
Pro vs Standard Detailed Comparison
Feature Nano Banana Pro Nano Banana
Model gemini-3-pro-image-preview gemini-2.5-flash-image
Technology Gemini 3 Gemini 2.5
Resolution 1K/2K/4K 1K (fixed)
Price $0.05/edit $0.025/edit
Thinking Mode ✅ Yes ❌ No
Search Grounding ✅ Yes ❌ No
Multi-Image Up to 14 Up to 3
Speed ~10s ~10s
Best For Professional design, complex compositing Quick edits, simple modifications
💰 Price Advantage
Nano Banana Pro:
0.05
/
e
d
i
t
(
L
a
o
Z
h
a
n
g
A
P
I
)
v
s
0.05/edit(LaoZhangAPI)vs0.24/edit (official), 79% cheaper
Bonus: Get +10% bonus on large deposits
Exchange Rate: Paying in CNY is even more cost-effective
Nano Banana Pro offers exceptional value at LaoZhang API!
​
🚀 Quick Start
​
Prerequisites
1
Create Token

Login to LaoZhang API Token Management and create a pay-per-use type token
Token Creation Interface
2
Select Billing Type

Important: Must select “Pay-per-use” type
3
Save Token

Copy the generated token in format sk-xxxxxx
​
Method 1: OpenAI Compatible Mode
​
Single Image Edit - Curl
curl -X POST "<https://api.laozhang.ai/v1/chat/completions>" \
     -H "Authorization: Bearer sk-YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
    "model": "gemini-3-pro-image-preview",
    "stream": false,
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Add a futuristic neon halo above the person head"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/your-image.jpg"
                    }
                }
            ]
        }
    ]
}'
​
Single Image Edit - Python SDK
from openai import OpenAI
import base64
import re

client = OpenAI(
    api_key="sk-YOUR_API_KEY",
    base_url="<https://api.laozhang.ai/v1>"
)

response = client.chat.completions.create(
    model="gemini-3-pro-image-preview",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Add a cute wizard hat on this cat's head"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/your-image.jpg"
                    }
                }
            ]
        }
    ]
)

# Extract and save image

content = response.choices[0].message.content
match = re.search(r'!\[.*?\]\((data:image/png;base64,.*?)\)', content)

if match:
    base64_data = match.group(1).split[','](1)
    image_data = base64.b64decode(base64_data)

    with open('edited.png', 'wb') as f:
        f.write(image_data)
    print("✅ Edited image saved: edited.png")

​
Multi-Image Compositing - Python SDK
from openai import OpenAI
import base64
import re

client = OpenAI(
    api_key="sk-YOUR_API_KEY",
    base_url="<https://api.laozhang.ai/v1>"
)

response = client.chat.completions.create(
    model="gemini-3-pro-image-preview",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Combine the style of image A with the content of image B"
                },
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/style.jpg"}
                },
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/content.jpg"}
                }
            ]
        }
    ]
)

# Extract and save image

content = response.choices[0].message.content
match = re.search(r'!\[.*?\]\((data:image/png;base64,.*?)\)', content)

if match:
    base64_data = match.group(1).split[','](1)
    image_data = base64.b64decode(base64_data)

    with open('merged.png', 'wb') as f:
        f.write(image_data)
    print("✅ Merged image saved: merged.png")

​
Method 2: Google Native Format (Custom Aspect Ratio + 4K)
​
Supported Resolutions
Aspect Ratio 1K Resolution 2K Resolution 4K Resolution
1:1 1024×1024 2048×2048 4096×4096
16:9 1376×768 2752×1536 5504×3072
9:16 768×1376 1536×2752 3072×5504
4:3 1200×896 2400×1792 4800×3584
3:4 896×1200 1792×2400 3584×4800
💡 How to Set Resolution Pass "2K" or "4K" in generationConfig.imageConfig.imageSize. Default is "1K" if not specified.
​
4K HD Editing - Curl
curl -X POST "<https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent>" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Transform this image into a cyberpunk style with neon lights"},
        {"inline_data": {"mime_type": "image/jpeg", "data": "BASE64_IMAGE_DATA_HERE"}}
      ]
    }],
    "generationConfig": {
      "responseModalities": ["IMAGE"],
      "imageConfig": {
        "aspectRatio": "16:9",
        "imageSize": "4K"
      }
    }
  }'
​
Python Code Examples
💡 Progressive Examples Example 1 edits image → Example 2 transforms its style → Example 3 fuses both images. Clear progression!
Example 1: Single Image Edit → Add Elements to First Image

Example 2: Style Transfer → Use First Image to Generate Second

Example 3: Multi-Image Fusion → Use First and Second to Generate Third

Complete Python Tool Script

​
🎯 Editing Scenarios
​

1. Single Image Edit - Add Elements
   def add_element_to_image(image_url, element_description):
    """Add new elements to image"""
    headers = {
   
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
   
    }
   
    data = {
   
        "model": "gemini-3-pro-image-preview",
        "stream": False,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": f"Add {element_description} to this image"},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        }]
   
    }
   
    response = requests.post(API_URL, headers=headers, json=data)
    return extract_base64_from_response(response.json())

# Usage example

result = add_element_to_image(
    "<https://example.com/landscape.jpg>",
    "a rainbow in the sky"
)
​
2. Style Transfer
def style_transfer(image_url, style_description):
    """Image style transfer"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gemini-3-pro-image-preview",
        "stream": False,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": f"Transform this image into {style_description} style"},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        }]
    }
    
    response = requests.post(API_URL, headers=headers, json=data)
    return extract_base64_from_response(response.json())

# Usage example

result = style_transfer(
    "<https://example.com/photo.jpg>",
    "Van Gogh oil painting"
)
​
3. Multi-Image Compositing
def creative_merge(image_urls, merge_instruction):
    """Creatively merge multiple images"""
    content = [{"type": "text", "text": merge_instruction}]

    for url in image_urls:
        content.append({
            "type": "image_url",
            "image_url": {"url": url}
        })
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "gemini-3-pro-image-preview",
        "stream": False,
        "messages": [{"role": "user", "content": content}]
    }
    
    response = requests.post(API_URL, headers=headers, json=data)
    return extract_base64_from_response(response.json())

# Usage example

images = ["https://example.com/cat.jpg", "https://example.com/background.jpg"]
result = creative_merge(images, "Naturally blend the cat into the background")
​
💡 Best Practices
​
Edit Instruction Optimization

# ❌ Vague instruction

instruction = "edit the image"

# ✅ Clear and specific instruction

instruction = """

1. Add a bright moon in the upper right corner

2. Adjust overall color tone to warm tones

3. Add some firefly light effects

4. Keep the main subject unchanged
   """
   ​
   Multi-Image Processing Strategy
   def smart_multi_image_edit(images, instruction):
    """Smart multi-image editing"""
   
    if len(images) == 1:
   
        prompt = f"Edit this image: {instruction}"
   
    elif len(images) == 2:
   
        prompt = f"Combine these two images creatively: {instruction}"
   
    else:
   
        prompt = f"Process these {len(images)} images together: {instruction}"
   
   # Build content
   
    return send_edit_request(content)
   ​
   ❓ FAQ
   What's the difference between Pro and Standard?

How to use 4K resolution?

What image formats are supported?

Are there image size limits?

How many images can be processed at once?

Why is Pro so affordable at LaoZhang API?

Does it support Chinese editing instructions?

How to get better editing results?

​
🎯 Common Use Cases
E-commerce Model Swap: Upload clothing and model photos, generate outfit effects
Interior Design: Upload raw room photos, generate decorated results via prompt
Game Assets: Quickly modify game icons or character appearances
Social Media: Transform portrait photos into various art styles
Product Display: Place products into different scene backgrounds
Creative Posters: Fuse multiple assets to generate poster designs
​
🔗 Related Resources
Pro Image Generation
Learn how to generate images from text with Nano Banana Pro
Standard Image Editing
More affordable Nano Banana Standard editing version
Token Management
Create and manage your API tokens
Pricing
View detailed pricing and billing information

SeeDream 4.0 Image Generation/Editing
BytePlus Ark SeeDream 4.0 AI image generation and editing API, 65% discount from official pricing

API Endpoint: <https://api.laozhang.ai/v1/images/generations>
Model Name: seedream-4-0-250828
Billing: Pay-per-use
Price: $0.025/image (65% off official price)
​
Prerequisites
1
Get API Key

Log in to laozhang.ai console to obtain your API key
2
Configure Billing Mode

Edit token settings and choose one of the following billing modes (same price for both):
Volume Priority (Recommended): Uses balance billing first, automatically switches when balance is insufficient. Suitable for most users
Pay-per-call: Direct deduction for each call. Suitable for strict budget control scenarios
Both modes have exactly the same price at $0.025/image, only the billing method differs.
Token Settings
If billing mode is not configured, API calls will fail. You must complete this configuration first!
​
Changelog
September 11, 2025 - SeeDream 4.0 API launched officially, integrated by LaoZhang AI on the same day
​
Core Features
Text-to-Image
Generate high-quality images from text descriptions
Image-to-Image
AI editing and redrawing based on source images
Multi-Image Input
Supports up to 10 reference images
Flexible Dimensions
Customizable image resolution and size
OpenAI Format
Fully compatible with OpenAI Image API format
Great Value
Only $0.025/image, 65% off official price
​
Key Information
​
Source
Strategic Partnership
SeeDream 4.0 is powered by BytePlus Ark (international version). LaoZhang AI has established a strategic partnership to provide you with stable and reliable service.
​
Technical Specifications
Item Description
API Format OpenAI Image API compatible
Request Endpoint /v1/images/generations
Model Name seedream-4-0-250828
Max Reference Images 10 images
Size Support Customizable resolution
Watermark Optional (can be disabled)
​
Pricing Advantage
💰 Exceptional Pricing
LaoZhang AI Price: $0.025/image
Official Price: $0.03/image
Discount: Equivalent to 65% off official pricing
Recharge Bonus: Top up $100, get +15% bonus, double savings
Actual Cost: Approximately ¥0.14/image (CNY)
Same price as Nano Banana (Gemini image generation), excellent value!
​
Getting Started
1
Create Token

Login to LaoZhang API Token Management and create a pay-per-use token
Token Creation Interface
2
Select Billing Type

Important: Must select “Pay-per-use” type
3
Save Token

Copy the generated token (format: sk-xxxxxx) and replace API_KEY in the code
​
Text-to-Image
​
Python Version

# !/usr/bin/env python3

# -*- coding: utf-8 -*-

"""
Seedream API Image Generator - Pure Python Version
Just modify API_KEY to use
"""

# =================== Configuration Section ===================

API_KEY = "sk-"                                              # Replace with your API key
API_URL = "<https://api.laozhang.ai/v1/images/generations>"    # API endpoint
PROMPT = "A beautiful sunset over mountains, realistic style"  # Image description
MODEL = "seedream-4-0-250828"                                # Model name
OUTPUT_DIR = "."                                             # Output directory

# ==============================================

import requests
import os
import datetime

def generate_image(prompt, output_dir="."):
    """Generate image and save to local"""
    print(f"🎨 Seedream Image Generator")
    print(f"📝 Prompt: {prompt}")
    print("=" * 50)

    # API request parameters
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "response_format": "url",
        "size": "2K",
        "watermark": False
    }
    
    try:
        print("⏳ Generating image...")
    
        # Call API
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    
        if response.status_code != 200:
            return False, f"API Error ({response.status_code}): {response.text}"
    
        # Parse response
        result = response.json()
        if "data" not in result or len(result["data"]) == 0:
            return False, "API returned no image data"
    
        # Get image URL
        image_url = result["data"][0]["url"]
        print(f"🌐 Got image URL successfully")
    
        # Download image
        print("⬇️ Downloading image...")
        img_response = requests.get(image_url, timeout=30)
        img_response.raise_for_status()
    
        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f"generated_{timestamp}.jpg")
    
        # Save image
        os.makedirs(output_dir, exist_ok=True)
        with open(filename, 'wb') as f:
            f.write(img_response.content)
    
        file_size = len(img_response.content)
        return True, f"✅ Generated successfully: {filename} ({file_size // 1024}KB)"
    
    except Exception as e:
        return False, f"Generation failed: {str(e)}"

def main():
    """Main function"""
    print("🚀 Seedream API Image Generator - Python Version")
    print("=" * 50)

    # Check API key
    if API_KEY == "sk-" or not API_KEY:
        print("⚠️  Please modify API_KEY at the top of the code")
        print("   Replace 'sk-' with your actual API key")
        print()
        print("📋 Instructions:")
        print("1. Modify API_KEY to your actual key")
        print("2. Optional: Modify PROMPT to generate different images")
        print("3. Run: python3 seedream-text-to-image.py")
        return
    
    # Execute image generation
    success, message = generate_image(PROMPT, OUTPUT_DIR)
    print(message)
    
    if success:
        print()
        print("🎉 Task completed!")
        print("💡 Tip: Modify PROMPT to generate different images")

if **name** == "**main**":
    main()
​
Curl Simple Version
curl -X POST <https://api.laozhang.ai/v1/images/generations> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -d '{
    "model": "seedream-4-0-250828",
    "prompt": "A beautiful sunset over mountains, realistic style",
    "response_format": "url",
    "size": "2K",
    "watermark": false
}'
​
Curl One-Line Version (with Auto Download)
Requires python3 installation, automatically parses response and downloads image
curl -X POST <https://api.laozhang.ai/v1/images/generations> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -d '{"model": "seedream-4-0-250828","prompt": "A beautiful sunset over mountains, realistic style","response_format": "url","size": "2K","watermark": false}' \
  | python3 -c "import json,sys,os; data=json.loads(sys.stdin.read()); os.system(f'curl -L -o generated_\$(date +%Y%m%d_%H%M%S).jpg \"{data[\"data\"][0][\"url\"]}\"') if 'data' in data else print('Error')"
​
Image-to-Image
AI editing and redrawing based on source images, supports up to 10 reference images.
​
Python Version

# !/usr/bin/env python3

# -*- coding: utf-8 -*-

"""
Seedream API Image Editor - Python Version
Generate new images based on source image, just modify API_KEY to use
"""

# =================== Configuration Section ===================

API_KEY = "sk-"                                              # Replace with your API key
API_URL = "<https://api.laozhang.ai/v1/images/generations>"    # Image editing API endpoint
PROMPT = "Generate a close-up image of a dog lying on lush grass."  # Editing prompt
IMAGE_URL = "<https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imageToimage.png>"  # Source image URL
MODEL = "seedream-4-0-250828"                                # Model to use
OUTPUT_DIR = "."                                             # Output directory

# ==============================================

import requests
import os
import datetime

def edit_image(prompt, image_url, output_dir="."):
    """Generate edited image based on source image"""
    print(f"🎨 Seedream Image Editor")
    print(f"📝 Edit Prompt: {prompt}")
    print(f"🖼️  Source URL: {image_url[:50]}...")
    print("=" * 50)

    # API request parameters
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "image": image_url,
        "sequential_image_generation": "disabled",
        "response_format": "url",
        "size": "2K",
        "stream": False,
        "watermark": False
    }
    
    try:
        print("⏳ Editing image...")
    
        # Call API
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    
        if response.status_code != 200:
            return False, f"API Error ({response.status_code}): {response.text}"
    
        # Parse response
        result = response.json()
        if "data" not in result or len(result["data"]) == 0:
            return False, "API returned no image data"
    
        # Get image URL
        edited_image_url = result["data"][0]["url"]
        print(f"🌐 Got edited image URL successfully")
    
        # Download image
        print("⬇️ Downloading edited image...")
        img_response = requests.get(edited_image_url, timeout=30)
        img_response.raise_for_status()
    
        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f"edited_{timestamp}.jpg")
    
        # Save image
        os.makedirs(output_dir, exist_ok=True)
        with open(filename, 'wb') as f:
            f.write(img_response.content)
    
        file_size = len(img_response.content)
        return True, f"✅ Edit successful: {filename} ({file_size // 1024}KB)"
    
    except Exception as e:
        return False, f"Edit failed: {str(e)}"

def main():
    """Main function"""
    print("🚀 Seedream API Image Editor - Python Version")
    print("=" * 50)

    # Check API key
    if API_KEY == "sk-" or not API_KEY:
        print("⚠️  Please modify API_KEY at the top of the code")
        print("   Replace 'sk-' with your actual API key")
        print()
        print("📋 Instructions:")
        print("1. Modify API_KEY to your actual key")
        print("2. Modify IMAGE_URL to the image you want to edit")
        print("3. Modify PROMPT to describe the desired editing effect")
        print("4. Run: python3 seedream-image-edit.py")
        return
    
    # Execute image editing
    success, message = edit_image(PROMPT, IMAGE_URL, OUTPUT_DIR)
    print(message)
    
    if success:
        print()
        print("🎉 Edit completed!")
        print("💡 Tip: Modify PROMPT and IMAGE_URL to edit different images")

if **name** == "**main**":
    main()
​
Curl Version

# !/bin/bash

# Seedream API Image Editor - Curl Version

# Generate new images based on source image, modify API_KEY to use

# =============== Configuration Section ===============

API_KEY="sk-YOUR_API_KEY"                                    # Replace with your API key
API_URL="<https://api.laozhang.ai/v1/images/generations>"      # Image editing API endpoint
PROMPT="Generate a close-up image of a dog lying on lush grass."  # Editing prompt
IMAGE_URL="<https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/seedream4_imageToimage.png>"  # Source image URL
MODEL="seedream-4-0-250828"                                  # Model name

# ====================================

# Check API key

if [ "$API_KEY" = "sk-YOUR_API_KEY" ]; then
    echo "⚠️  Please modify API_KEY in the script"
    echo "   Replace 'sk-YOUR_API_KEY' with your actual API key"
    echo ""
    echo "📋 Instructions:"
    echo "1. Modify API_KEY to your actual key"
    echo "2. Modify IMAGE_URL to the image you want to edit"
    echo "3. Modify PROMPT to describe the desired editing effect"
    echo "4. Run: ./seedream-image-edit.sh"
    exit 1
fi

# Generate output filename

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="edited_${TIMESTAMP}.jpg"

echo "🎨 Seedream API Image Editor - Curl Version"
echo "========================================"
echo "📝 Edit Prompt: $PROMPT"
echo "🖼️  Source URL: ${IMAGE_URL:0:50}..."
echo "📁 Output File: $OUTPUT_FILE"
echo "========================================"

# Step 1: Call API to get JSON response

echo "⏳ Editing image..."

# Build JSON request body

JSON_DATA=$(cat <<EOF
{
  "model": "$MODEL",
  "prompt": "$PROMPT",
  "image": "$IMAGE_URL",
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "2K",
  "stream": false,
  "watermark": false
}
EOF
)

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$JSON_DATA")

# Check API response

if [ -z "$RESPONSE" ]; then
    echo "❌ No API response, please check network connection"
    exit 1
fi

echo "✅ API response successful"

# Step 2: Parse JSON with Python and extract image URL

echo "🔍 Parsing edited image URL..."
EDITED_IMAGE_URL=$(echo "$RESPONSE" | python3 -c "
import json
import sys

try:
    data = json.loads(sys.stdin.read())

    if 'data' in data and len(data['data']) > 0:
        url = data['data'][0]['url']
        print(url)
    else:
        print('ERROR: Image URL not found')
        sys.exit(1)

except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
")

# Check URL parsing result

if [[ "$EDITED_IMAGE_URL" == ERROR* ]]; then
    echo "❌ URL parsing failed: $EDITED_IMAGE_URL"
    echo "📄 Original API response:"
    echo "$RESPONSE"
    exit 1
fi

echo "🌐 Edited image URL retrieved successfully"

# Step 3: Download edited image

echo "⬇️ Downloading edited image..."
curl -s -L -o "$OUTPUT_FILE" "$EDITED_IMAGE_URL"

# Check download result

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ Image edited successfully!"
    echo "📁 File: $OUTPUT_FILE"
    echo "📊 Size: $FILE_SIZE"
    echo ""
    echo "🎉 Complete! Check the edited image file"
    echo "💡 Tip: Modify PROMPT and IMAGE_URL to edit different images"
else
    echo "❌ Image download failed"
    echo "🔗 You can manually access: $EDITED_IMAGE_URL"
fi
​
Resources
​
Official Documentation
API Documentation
BytePlus ModelArk official technical documentation
User Manual
Seedream 4.0 User Manual
User Guide
Seedream 4.0 User Guide
Prompting Tips
Prompting and style keyword guide
​
Common Questions
Dimensions and Resolution

Reference Image Count

Watermark Settings

Response Format

Generation Mode

​
API Parameter Reference
​
Request Parameters
Parameter Type Required Description
model string ✓ Model name: seedream-4-0-250828
prompt string ✓ Image description or editing prompt
image string ✗ Reference image URL (for image-to-image)
size string ✗ Image size, default 2K
response_format string ✗ Response format: url or b64_json, default url
watermark boolean ✗ Whether to add watermark, default false
sequential_image_generation string ✗ Generation mode, default disabled
stream boolean ✗ Whether to stream response, default false
​
Response Format
{
  "created": 1726051200,
  "data": [
    {
      "url": "https://example.com/generated_image.jpg",
      "revised_prompt": "..."
    }
  ]
}
​
Next Steps

Sora Image Editing
Edit and transform existing images using Sora official reverse-engineered technology, pay-per-use at only $0.01/image

​
Model Overview
Sora Image editing functionality is based on image-to-image technology from sora.chatgpt.com, implementing intelligent editing and transformation of existing images through the chat completions interface. Supports single or multiple image processing at highly competitive pricing.
🎨 Smart Image Editing
Upload image + text description = new creation! Supports style transformation, element modification, multi-image fusion and other advanced features.
​
🌟 Core Features
🔄 Flexible Editing: Supports style transformation, element addition/deletion, color adjustment, etc.
🎭 Multi-Image Processing: Can process multiple images simultaneously for fusion, stitching effects
💰 Exceptional Value: $0.01/image, pay-per-use
🚀 Instant Generation: Based on chat interface, fast response
🌏 Chinese Friendly: Perfect support for Chinese editing instructions
​
📋 Feature Comparison
Feature Sora Image Editing Traditional Image Edit APIs DALL·E 2 Edit
Price $0.01/image $0.02-0.05/image $0.018/image
Chinese Support ✅ Native ❌ Needs translation ❌ Needs translation
Multi-Image Input ✅ Supported ❌ Not supported ❌ Not supported
Response Speed Fast Medium Slower
​
🚀 Quick Start
​
Basic Example - Single Image Edit
import requests
import re

# API Configuration

API_KEY = "YOUR_API_KEY"
API_URL = "<https://api.laozhang.ai/v1/chat/completions>"

def edit_image(image_url, prompt, model="gpt-4o-image"):
    """
    Edit single image

    Args:
        image_url: Original image URL
        prompt: Edit description
        model: Model to use, "gpt-4o-image" or "sora_image"
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Build message with image
    content = [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": image_url}}
    ]
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": content}]
    }
    
    response = requests.post(API_URL, headers=headers, json=payload)
    result = response.json()
    
    # Extract edited image URL
    content = result['choices'][0]['message']['content']
    edited_urls = re.findall(r'!\[.*?\]\((https?://[^)]+)\)', content)
    
    return edited_urls[0] if edited_urls else None

# Usage example

original_url = "<https://example.com/cat.jpg>"
edited_url = edit_image(original_url, "Change the cat's fur to rainbow colors")
print(f"Edited image: {edited_url}")
​
Advanced Example - Multi-Image Fusion
def merge_images(image_urls, prompt, model="gpt-4o-image"):
    """
    Merge multiple images

    Args:
        image_urls: List of image URLs
        prompt: Merge description
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Build message with multiple images
    content = [{"type": "text", "text": prompt}]
    for url in image_urls:
        content.append({
            "type": "image_url",
            "image_url": {"url": url}
        })
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": content}]
    }
    
    response = requests.post(API_URL, headers=headers, json=payload)
    result = response.json()
    
    # Extract result
    content = result['choices'][0]['message']['content']
    merged_urls = re.findall(r'!\[.*?\]\((https?://[^)]+)\)', content)
    
    return merged_urls

# Merge example

urls = [
    "https://example.com/landscape1.jpg",
    "https://example.com/landscape2.jpg"
]
merged = merge_images(urls, "Merge two landscape images into one panoramic view")
​
🎯 Editing Scenarios
​

1. Style Transformation

# Style transformation templates

style_templates = {
    "Cartoon": "Transform into Disney cartoon style with vibrant colors",
    "Oil Painting": "Transform into classical oil painting style, like Van Gogh",
    "Ink Wash": "Transform into Chinese ink wash painting style with artistic spacing",
    "Cyberpunk": "Transform into cyberpunk style with neon lighting effects",
    "Sketch": "Transform into pencil sketch style with black and white lines"
}

def apply_style(image_url, style_name):
    """Apply preset style"""
    if style_name in style_templates:
        prompt = style_templates[style_name]
        return edit_image(image_url, prompt)
    else:
        return None

# Batch style transformation

original = "<https://example.com/portrait.jpg>"
for style in ["Cartoon", "Oil Painting", "Ink Wash"]:
    result = apply_style(original, style)
    print(f"{style} style: {result}")
​
2. Smart Background Replacement
def change_background(image_url, new_background):
    """Replace image background"""
    prompts = {
        "Beach": "Keep subject, replace background with sunny beach, palm trees and blue sky",
        "Office": "Keep person, replace background with modern office",
        "Space": "Keep subject, replace background with vast starry space",
        "Solid Color": "Remove background, replace with pure white background"
    }

    prompt = prompts.get(new_background, f"Replace background with {new_background}")
    return edit_image(image_url, prompt)

# Usage example

new_photo = change_background(
    "<https://example.com/person.jpg>",
    "Beach"
)
​
3. Object Editing
def edit_objects(image_url, action, target, details=""):
    """Edit specific objects in image"""
    action_prompts = {
        "Add": f"Add {target} to the image, {details}",
        "Remove": f"Remove {target} from the image, naturally fill background",
        "Replace": f"Replace {target} in the image with {details}",
        "Modify": f"Modify {target} in the image, {details}"
    }

    prompt = action_prompts.get(action, "")
    return edit_image(image_url, prompt)

# Editing examples

# Add object

result1 = edit_objects(
    "<https://example.com/room.jpg>",
    "Add", "a cat", "sitting on the sofa"
)

# Remove object

result2 = edit_objects(
    "<https://example.com/street.jpg>",
    "Remove", "power pole"
)

# Replace object

result3 = edit_objects(
    "<https://example.com/table.jpg>",
    "Replace", "apple", "orange"
)
​
4. Color and Lighting Adjustment
def adjust_image(image_url, adjustments):
    """Adjust image color and lighting"""
    prompt_parts = []

    if "brightness" in adjustments:
        prompt_parts.append(f"Adjust brightness to {adjustments['brightness']}")
    
    if "color_tone" in adjustments:
        prompt_parts.append(f"Adjust color tone to {adjustments['color_tone']}")
    
    if "time" in adjustments:
        prompt_parts.append(f"Adjust lighting to {adjustments['time']} effect")
    
    if "season" in adjustments:
        prompt_parts.append(f"Adjust seasonal feeling to {adjustments['season']}")
    
    prompt = ", ".join(prompt_parts)
    return edit_image(image_url, prompt)

# Adjustment example

adjusted = adjust_image(
    "<https://example.com/landscape.jpg>",
    {
        "brightness": "bright",
        "color_tone": "warm tones",
        "time": "golden hour",
        "season": "autumn"
    }
)
​
💡 Best Practices
​

1. Precise Editing Instructions

# ❌ Vague

prompt = "make it better"

# ✅ Specific and detailed

prompt = """
Change the sky to sunset colors with orange and pink hues.
Keep all foreground elements unchanged.
Add some birds flying in the sky.
Maintain natural lighting and shadows.
"""
​
2. Multi-Image Fusion Tips
def smart_merge(image_urls, merge_type):
    """Smart multi-image fusion"""
    templates = {
        "panorama": "Merge these images into a seamless panoramic view",
        "collage": "Create an artistic collage from these images",
        "blend": "Blend these images together artistically",
        "comparison": "Create a side-by-side comparison of these images"
    }

    prompt = templates.get(merge_type, "Combine these images creatively")
    return merge_images(image_urls, prompt)

# Panorama fusion

panorama = smart_merge([url1, url2, url3], "panorama")
​
3. Batch Processing
def batch_edit_images(edit_tasks):
    """Batch edit images"""
    results = []

    for task in edit_tasks:
        try:
            edited = edit_image(
                task['url'],
                task['prompt'],
                task.get('model', 'gpt-4o-image')
            )
    
            results.append({
                'original': task['url'],
                'edited': edited,
                'prompt': task['prompt'],
                'success': edited is not None
            })
        except Exception as e:
            results.append({
                'original': task['url'],
                'success': False,
                'error': str(e)
            })
    
    return results

# Batch tasks

tasks = [
    {'url': 'img1.jpg', 'prompt': 'Make it more vibrant'},
    {'url': 'img2.jpg', 'prompt': 'Convert to black and white'},
    {'url': 'img3.jpg', 'prompt': 'Add vintage filter'}
]

results = batch_edit_images(tasks)
​
⚠️ Important Notes
Model Selection:
gpt-4o-image: Recommended, more stable
sora_image: Same technology, similar results
Both are $0.01/image
Image Input:
Supports online image URLs
Ensure images are publicly accessible
Recommended max size: 20MB
Multi-Image Processing:
Can include multiple images in one request
Add all images to content array
Describe fusion/editing intent clearly
Result Extraction:
Results returned in Markdown format
Extract URLs using regex
Download edited images promptly
