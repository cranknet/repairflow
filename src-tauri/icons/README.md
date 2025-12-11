# Placeholder - Replace with actual app icons

This directory should contain app icons for the RepairFlow desktop app:

- `32x32.png` - Small icon (32x32 pixels)
- `128x128.png` - Medium icon (128x128 pixels)
- `icon.ico` - Windows icon file

## Generating icons

You can use an online tool like https://www.icoconverter.com/ or run:

```bash
# If you have ImageMagick installed
convert logo.png -resize 32x32 icons/32x32.png
convert logo.png -resize 128x128 icons/128x128.png
convert logo.png icons/icon.ico
```
