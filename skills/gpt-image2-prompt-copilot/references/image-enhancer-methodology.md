
name: image-enhancer
description: "AI-driven iterative image improvement: Gemini Vision fault analysis → prompt rewrite → Nanobanana regeneration. Use when a generated image has specific flaws (wrong lighting, bad composition, AI artifacts) and needs targeted fixes. Keywords: fix image, improve image, image quality, image artifacts, regenerate, enhance, sharpen, image flaw."

# Image Enhancer

This skill takes your images and screenshots and makes them look better—sharper, clearer, and more professional.

## NEVER Do

**NEVER regenerate blindly** — always use Gemini Vision to identify *specific* faults before rewriting the prompt. Blind regeneration repeats the same errors because the model has no memory of why the previous attempt failed.

**NEVER rewrite the entire prompt to fix one flaw** — isolate the failing dimension (e.g., only rewrite D5-Lighting). Full rewrites introduce new problems in dimensions that were working fine.

**NEVER try to fix AI skin texture artifacts with more resolution** — AI skin artifacts come from missing negative prompts ("artificial AI skin texture", "plastic skin"). Adding resolution makes them sharper, not gone.

**NEVER use vague regeneration instructions like "make it better"** — diffusion models respond to concrete visual anchors. "Make it better" changes nothing. "Replace Rembrandt lighting with studio softbox, even fill, subtle shadow right" changes lighting precisely.

**NEVER skip the NEVER list on Dimension 8** — every enhanced image must end with the product-appropriate negative suffix. Removing negatives during iteration is how artifacts reappear in the "fixed" version.

## When to Use This Skill

- Improving screenshot quality for blog posts or documentation
- Enhancing images before sharing on social media
- Preparing images for presentations or reports
- Upscaling low-resolution images
- Sharpening blurry photos
- Cleaning up compressed images

## What This Skill Does

1. **Analyzes Image Quality**: Checks resolution, sharpness, and compression artifacts
2. **Enhances Resolution**: Upscales images intelligently
3. **Improves Sharpness**: Enhances edges and details
4. **Reduces Artifacts**: Cleans up compression artifacts and noise
5. **Optimizes for Use Case**: Adjusts based on intended use (web, print, social media)

## How to Use

### Basic Enhancement

```
Improve the image quality of screenshot.png
```

```
Enhance all images in this folder
```

### Specific Improvements

```
Upscale this image to 4K resolution
```

```
Sharpen this blurry screenshot
```

```
Reduce compression artifacts in this image
```

### Batch Processing

```
Improve the quality of all PNG files in this directory
```

## Example

**User**: "Improve the image quality of screenshot-2024.png"

**Output**:
```
Analyzing screenshot-2024.png...

Current specs:
- Resolution: 1920x1080
- Format: PNG
- Quality: Good, but slight blur

Enhancements applied:
✓ Upscaled to 2560x1440 (retina)
✓ Sharpened edges
✓ Enhanced text clarity
✓ Optimized file size

Saved as: screenshot-2024-enhanced.png
Original preserved as: screenshot-2024-original.png
```

**Inspired by:** Lenny Rachitsky's workflow from his newsletter - used for screenshots in his articles

## Tips

- Always keeps original files as backup
- Works best with screenshots and digital images
- Can batch process entire folders
- Specify output format if needed (PNG for quality, JPG for smaller size)
- For social media, mention the platform for optimal sizing

## Common Use Cases

- **Blog Posts**: Enhance screenshots before publishing
- **Documentation**: Make UI screenshots crystal clear
- **Social Media**: Optimize images for Twitter, LinkedIn, Instagram
- **Presentations**: Upscale images for large screens
- **Print Materials**: Increase resolution for physical media
