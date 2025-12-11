# AI Vision Feature Guide

## Overview

RepairFlow includes AI Vision capabilities for automatic device condition assessment using OCR and image analysis.

## Features

- **Device Photo Capture**: Before and after repair photos
- **OCR Text Extraction**: Automatic text recognition from device screens
- **Condition Notes**: AI-suggested condition descriptions

## Configuration

### Feature Flag

Enable/disable via environment variable:
```bash
FEATURE_AI_VISION=true  # or false to disable
```

### Usage in Code

```typescript
import { isAIVisionEnabled } from '@/lib/feature-flags';

if (isAIVisionEnabled()) {
  // Show AI vision features
}
```

## How It Works

1. **Photo Upload**: User uploads device photo
2. **Processing**: Image is processed using Tesseract.js
3. **Text Extraction**: OCR extracts visible text
4. **Display**: Results shown in ticket notes

## Technical Details

- **Library**: Tesseract.js v6.x
- **Processing**: Client-side (no server upload for OCR)
- **Supported Formats**: JPEG, PNG, WebP

## Troubleshooting

### OCR Not Working

1. Check `FEATURE_AI_VISION=true` in environment
2. Ensure adequate lighting in photos
3. Check browser console for errors

### Slow Processing

- OCR processing depends on image size
- Consider resizing large images before upload
- First OCR call may be slower (loading Tesseract engine)

## Limitations

- Works best with printed text
- Handwritten text may not be recognized
- Non-Latin scripts may have reduced accuracy
