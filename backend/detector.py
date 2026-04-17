"""
detector.py — YOLOv8 inference wrapper.
Loads the Ultralytics YOLO model once and exposes a clean predict() interface
that returns annotated frames + structured detection JSON.
"""

import time
import cv2
import numpy as np
from ultralytics import YOLO

# Color palette for bounding boxes, mapped per-class-index (cycles).
# Matches the design system's class filter colors (blue, emerald, amber, purple, etc.)
BOX_COLORS = [
    (250, 160, 96),   # blue-400  (BGR)
    (153, 211, 52),   # emerald-400
    (80, 190, 245),   # amber-500
    (210, 120, 168),  # purple-400
    (100, 200, 200),  # teal
    (140, 140, 255),  # red-ish
    (255, 200, 100),  # light-blue
    (180, 230, 120),  # lime
]


class ObjectDetector:
    """Wraps an Ultralytics YOLO model for single-image / single-frame inference."""

    def __init__(self, model_name: str = "yolov8n.pt"):
        self.model = YOLO(model_name)
        self.class_names: list[str] = list(self.model.names.values())

    def predict(
        self,
        frame: np.ndarray,
        confidence_threshold: float = 0.5,
    ) -> dict:
        """
        Run inference on a single BGR frame.

        Returns:
            {
                "annotated_frame": np.ndarray (BGR with drawn boxes),
                "detections": [ { "class", "confidence", "bbox": {x1,y1,x2,y2} } ],
                "inference_time_ms": float,
                "total_objects": int,
            }
        """
        start = time.perf_counter()
        results = self.model.predict(
            source=frame,
            conf=confidence_threshold,
            verbose=False,
        )
        inference_ms = (time.perf_counter() - start) * 1000.0

        detections = []
        annotated = frame.copy()

        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                class_name = self.class_names[cls_id]

                detections.append({
                    "class": class_name,
                    "confidence": round(conf, 4),
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                })

                # Draw bounding box + label
                color = BOX_COLORS[cls_id % len(BOX_COLORS)]
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

                label = f"{class_name} {conf:.2f}"
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
                cv2.putText(
                    annotated, label,
                    (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (10, 10, 10), 1, cv2.LINE_AA,
                )

        return {
            "annotated_frame": annotated,
            "detections": detections,
            "inference_time_ms": round(inference_ms, 2),
            "total_objects": len(detections),
        }
