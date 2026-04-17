"""
main.py — FastAPI application with CORS, serving YOLOv8 object detection
over REST endpoints for both static image uploads and live webcam frames.
"""

from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import time

from backend.detector import ObjectDetector
from backend.utils import (
    decode_base64_to_cv2,
    encode_cv2_to_base64,
    read_upload_to_cv2,
)

# ── App & Model Bootstrap ──────────────────────────────────────────────
app = FastAPI(
    title="DetectArch API",
    description="Real-Time Object Detection powered by YOLOv8",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve Frontend Static Files ─────────────────────────────────────────
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/", include_in_schema=False)
async def root():
    """Redirect / to the frontend index.html."""
    return RedirectResponse(url="/static/index.html")


# Lazy-init detector on first request (avoids import-time download)
_detector: ObjectDetector | None = None


def get_detector() -> ObjectDetector:
    global _detector
    if _detector is None:
        _detector = ObjectDetector(model_name="yolov8n.pt")
    return _detector


# ── Schemas ─────────────────────────────────────────────────────────────
class FrameRequest(BaseModel):
    frame: str  # base64-encoded JPEG
    confidence_threshold: float = 0.5


# ── Endpoints ───────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    """Health check — confirms the model is loaded and device type."""
    detector = get_detector()
    device = str(detector.model.device) if hasattr(detector.model, "device") else "cpu"
    return {
        "status": "ok",
        "model": "yolov8n",
        "device": device,
        "classes_count": len(detector.class_names),
    }


@app.get("/classes")
async def get_classes():
    """Return the full list of detectable COCO class names."""
    detector = get_detector()
    return {"classes": detector.class_names}


@app.post("/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.5, ge=0.1, le=0.95),
):
    """
    Accept an uploaded image file, run YOLOv8 inference,
    and return the annotated image (base64) + detection JSON.
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    try:
        frame = read_upload_to_cv2(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    detector = get_detector()
    result = detector.predict(frame, confidence_threshold=confidence_threshold)

    annotated_b64 = encode_cv2_to_base64(result["annotated_frame"])

    return JSONResponse({
        "annotated_image": annotated_b64,
        "detections": result["detections"],
        "inference_time_ms": result["inference_time_ms"],
        "total_objects": result["total_objects"],
    })


@app.post("/detect/frame")
async def detect_frame(req: FrameRequest):
    """
    Accept a base64-encoded webcam frame, run inference,
    and return the annotated frame + detection list.
    """
    try:
        frame = decode_base64_to_cv2(req.frame)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid frame data: {e}")

    detector = get_detector()
    result = detector.predict(frame, confidence_threshold=req.confidence_threshold)

    annotated_b64 = encode_cv2_to_base64(result["annotated_frame"])

    return JSONResponse({
        "annotated_frame": annotated_b64,
        "detections": result["detections"],
        "inference_time_ms": result["inference_time_ms"],
        "total_objects": result["total_objects"],
    })
