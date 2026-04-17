"""
utils.py — Image encoding/decoding helpers for the detection pipeline.
Handles Base64 ↔ NumPy/OpenCV conversions and Pillow I/O.
"""

import base64
import io
import numpy as np
import cv2
from PIL import Image


def decode_base64_to_cv2(base64_string: str) -> np.ndarray:
    """Decode a base64-encoded JPEG/PNG string into an OpenCV BGR ndarray."""
    img_bytes = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Failed to decode base64 image data.")
    return frame


def encode_cv2_to_base64(frame: np.ndarray, fmt: str = ".jpg") -> str:
    """Encode an OpenCV BGR ndarray into a base64-encoded string."""
    success, buffer = cv2.imencode(fmt, frame)
    if not success:
        raise ValueError(f"Failed to encode frame to {fmt}.")
    return base64.b64encode(buffer).decode("utf-8")


def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    """Convert a PIL Image (RGB) to an OpenCV ndarray (BGR)."""
    rgb = np.array(pil_image)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def read_upload_to_cv2(file_bytes: bytes) -> np.ndarray:
    """Read raw uploaded file bytes into an OpenCV BGR ndarray."""
    np_arr = np.frombuffer(file_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Uploaded file could not be decoded as an image.")
    return frame
