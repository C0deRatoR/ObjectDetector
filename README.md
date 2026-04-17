# DetectArch — Real-Time Object Detection Web App

A production-style object detection dashboard powered by **YOLOv8** and **FastAPI**, with a premium "Digital Architect" UI.

## Features

- **Image Upload Detection** — Upload `.jpg`, `.png`, or `.webp` images for instant YOLOv8 inference
- **Webcam Real-Time Detection** — Browser webcam capture with frame-by-frame API inference
- **Live Analytics** — FPS counter, latency histogram, detection log
- **Class Filtering** — Toggle individual COCO classes on/off
- **Confidence Threshold** — Adjustable slider (0.10 – 0.95)
- **Model Selection** — Switch between YOLOv8 nano / small / medium
- **Snapshot Export** — Download annotated frames as PNG

## Tech Stack

| Layer | Technology |
|---|---|
| ML Model | YOLOv8 (Ultralytics) |
| Backend | FastAPI + Uvicorn |
| Image Processing | OpenCV + Pillow |
| Frontend | HTML5 + Vanilla JS + Tailwind CSS |

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server (serves both API + frontend)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 3. Open in browser
# http://localhost:8000
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check + model info |
| `GET` | `/classes` | List all 80 COCO class names |
| `POST` | `/detect/image` | Upload image → annotated result |
| `POST` | `/detect/frame` | Webcam frame (base64) → annotated result |

## Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── detector.py      # YOLOv8 inference wrapper
│   └── utils.py         # Image encode/decode helpers
├── frontend/
│   ├── index.html       # DetectArch dashboard UI
│   └── app.js           # Webcam + upload + analytics logic
├── stitch_modern_aesthetic_ui/
│   ├── DESIGN.md        # Design system specification
│   ├── code.html        # Original Stitch design template
│   └── screen.png       # Design reference screenshot
├── requirements.txt
└── README.md
```
