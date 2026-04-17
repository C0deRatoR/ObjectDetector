# Product Requirements Document (PRD)
## Real-Time Object Detection Web App
**Project 5 | SY B.Tech CS (AI/ML) | Resume Project**

---

## 1. Project Overview

| Field | Details |
|---|---|
| **Project Name** | Real-Time Object Detection Web App |
| **Version** | 1.0 |
| **Tech Stack** | Python, YOLOv8 (Ultralytics), OpenCV, FastAPI |
| **Target** | Internship Portfolio / Resume Project |
| **Estimated Timeline** | 2–3 weeks (solo dev) |

### Problem Statement
Computer vision applications require real-time, accurate object detection but most student projects either rely on pre-built demos or lack a proper API layer. This project bridges the gap by building a **production-style** web app where users can upload images or stream webcam input to get live YOLOv8-powered object detection with bounding boxes, class labels, and confidence scores — all served via a clean FastAPI backend.

---

## 2. Goals & Objectives

### Primary Goals
- Demonstrate applied Computer Vision skills using a state-of-the-art model (YOLOv8)
- Build a working full-stack AI app with a REST API backend
- Showcase understanding of ML inference pipelines (not just training)
- Create something **demo-able in an interview** within 60 seconds

### Resume Impact Goals
- Shows depth in AI/ML beyond theory — real, deployed inference pipeline
- Covers 3 key recruiter keywords: **Computer Vision**, **Deep Learning**, **REST APIs**
- Proves ability to productionize ML models using modern frameworks
- Differentiates from typical "Jupyter notebook" projects

---

## 3. Target Users

| User | Use Case |
|---|---|
| **Interviewers / Recruiters** | Live demo of AI project during interviews |
| **You (Developer)** | Portfolio showcase, learning, GitHub stargazer bait |
| **Fellow Students** | Reference implementation for CV projects |

---

## 4. Core Features

### 4.1 Image Upload Detection (Must Have)
- User uploads a `.jpg`, `.png`, or `.jpeg` image via the UI
- YOLOv8 runs inference on the uploaded image
- Response includes: annotated image with bounding boxes, list of detected objects with confidence scores and class labels
- Supports all 80 COCO classes out of the box (YOLOv8n pretrained)

### 4.2 Webcam Real-Time Detection (Must Have)
- Browser captures webcam feed using JavaScript `getUserMedia` API
- Frames sent to FastAPI backend at ~10–15 FPS via base64 or multipart POST
- Annotated frames streamed back and rendered in the browser
- Toggle button to start/stop webcam inference

### 4.3 FastAPI Backend (Must Have)
- `POST /detect/image` — accepts image file, returns annotated image + JSON detections
- `POST /detect/frame` — accepts raw webcam frame, returns annotated frame
- `GET /health` — health check endpoint
- `GET /classes` — returns list of all detectable classes
- CORS enabled for local frontend development

### 4.4 Detection Results Display (Must Have)
- Annotated image/frame rendered on canvas or `<img>` element
- Detection table showing: Class Name, Confidence %, Bounding Box coordinates
- Color-coded bounding boxes per class category
- Confidence score threshold slider (0.1 – 0.9, default 0.5)

### 4.5 Model Selection (Nice to Have)
- Dropdown to select model variant: `yolov8n`, `yolov8s`, `yolov8m`
- Trade-off display: Speed vs Accuracy indicator per model

### 4.6 Stats Dashboard (Nice to Have)
- FPS counter for webcam mode
- Inference time per frame (ms) displayed
- Total objects detected count
- Most frequently detected class in current session

---

## 5. Technical Architecture

```
┌──────────────────────────────────────────┐
│              Frontend (HTML/JS/CSS)       │
│   - Image Upload UI                       │
│   - Webcam capture (getUserMedia)         │
│   - Results canvas + detection table     │
└────────────────┬─────────────────────────┘
                 │ HTTP (REST)
                 ▼
┌──────────────────────────────────────────┐
│           FastAPI Backend (Python)        │
│   - /detect/image                        │
│   - /detect/frame                        │
│   - /health, /classes                    │
│   - CORS Middleware                      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│        Inference Engine                  │
│   - YOLOv8 (Ultralytics) model          │
│   - OpenCV for frame preprocessing      │
│   - Numpy for array ops                  │
│   - PIL/Pillow for image I/O            │
└──────────────────────────────────────────┘
```

---

## 6. Tech Stack Details

| Layer | Technology | Why |
|---|---|---|
| **ML Model** | YOLOv8 (Ultralytics) | SOTA real-time object detection, simple Python API |
| **Backend** | FastAPI | Async, auto Swagger docs, production-ready |
| **Image Processing** | OpenCV + Pillow | Industry standard CV libraries |
| **Numerical Ops** | NumPy | Fast array manipulation for frame data |
| **Frontend** | HTML5 + Vanilla JS (or React) | Keep it lightweight, focus on backend |
| **Packaging** | pip + requirements.txt | Simple reproducibility |
| **Optional Deploy** | Docker + Render/Railway | Bonus: makes it cloud-deployable |

---

## 7. API Specification

### `POST /detect/image`
```
Request:
  Content-Type: multipart/form-data
  Body: file (image file)
        confidence_threshold (float, default: 0.5)

Response 200:
  {
    "annotated_image": "<base64 encoded image>",
    "detections": [
      {
        "class": "person",
        "confidence": 0.92,
        "bbox": { "x1": 100, "y1": 50, "x2": 300, "y2": 400 }
      }
    ],
    "inference_time_ms": 45.3,
    "total_objects": 3
  }
```

### `POST /detect/frame`
```
Request:
  Content-Type: application/json
  Body: { "frame": "<base64 encoded jpeg frame>" }

Response 200:
  {
    "annotated_frame": "<base64 encoded jpeg>",
    "detections": [...],
    "fps": 14.2
  }
```

### `GET /health`
```
Response 200: { "status": "ok", "model": "yolov8n", "device": "cpu" }
```

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Inference Latency** | < 200ms per image on CPU (yolov8n) |
| **Webcam FPS** | 10–15 FPS on a mid-range laptop |
| **API Response Time** | < 300ms end-to-end |
| **Supported Image Formats** | JPG, PNG, JPEG, WEBP |
| **Max Upload Size** | 10 MB |
| **Browser Support** | Chrome, Firefox (latest) |

---

## 9. Project Structure

```
object-detection-app/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── detector.py          # YOLOv8 inference class
│   ├── utils.py             # Image encode/decode helpers
│   └── models/              # Downloaded YOLO weights (auto on first run)
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js               # Upload + webcam logic
├── requirements.txt
├── Dockerfile               # Optional
└── README.md                # Setup + demo GIF
```

---

## 10. Milestones & Timeline

| Week | Milestone |
|---|---|
| **Week 1** | Set up FastAPI, integrate YOLOv8, test `/detect/image` endpoint |
| **Week 1–2** | Build frontend (upload UI + result display), wire to backend |
| **Week 2** | Add webcam streaming, confidence threshold control |
| **Week 3** | Polish UI, write README, record demo GIF, push to GitHub |
| **Bonus** | Dockerize + deploy to Render/Railway for live URL |

---

## 11. Resume Talking Points (What to Say in Interviews)

- *"Built a real-time object detection web app using YOLOv8 and FastAPI — designed a REST inference API that processes images and webcam frames, returning annotated results and structured JSON detections."*
- *"Optimized the inference pipeline to achieve sub-200ms latency on CPU using YOLOv8n with OpenCV preprocessing."*
- *"Implemented a configurable confidence threshold slider and multi-model selection to demonstrate trade-offs between speed and accuracy in production ML systems."*

---

## 12. Success Criteria

- [ ] `/detect/image` endpoint works end-to-end with correct bounding boxes
- [ ] Webcam feed runs at 10+ FPS in browser
- [ ] Confidence slider correctly filters low-confidence detections
- [ ] GitHub repo has a demo GIF in the README
- [ ] (Bonus) Live deployment link in repo description
- [ ] Code is clean, commented, and structured for readability

---

*Document Version: 1.0 | Author: SY B.Tech CS AI/ML Student*
