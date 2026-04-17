/**
 * app.js — DetectArch Frontend Logic
 *
 * Handles:
 *   - Webcam capture via getUserMedia, frame-by-frame POST to /detect/frame
 *   - Static image upload via /detect/image
 *   - Dynamic UI updates: stats, latency chart, detection log, class filters
 */

(() => {
  "use strict";

  // ── Configuration ──────────────────────────────────────────────────
  const API_BASE = "http://127.0.0.1:8000";
  const MAX_LOG_ROWS = 50;
  const LATENCY_HISTORY_SIZE = 20;

  // ── DOM References ─────────────────────────────────────────────────
  const $webcamVideo     = document.getElementById("webcam-video");
  const $resultCanvas    = document.getElementById("result-canvas");
  const $idleZone        = document.getElementById("idle-zone");
  const $btnWebcam       = document.getElementById("btn-webcam-toggle");
  const $btnUpload       = document.getElementById("btn-upload");
  const $fileInput       = document.getElementById("image-upload-input");
  const $btnSnapshot     = document.getElementById("btn-snapshot");
  const $btnClearLog     = document.getElementById("btn-clear-log");
  const $confSlider      = document.getElementById("conf-slider");
  const $confValue       = document.getElementById("conf-value");
  const $detectionsLog   = document.getElementById("detections-log");
  const $latencyChart    = document.getElementById("latency-chart");
  const $classFilterList = document.getElementById("class-filter-list");
  const $classFilterCnt  = document.getElementById("class-filter-count");
  const $liveDot         = document.getElementById("live-dot");
  const $liveLabel       = document.getElementById("live-label");
  const $loadingBar      = document.getElementById("loading-bar");
  const $loadingBarWrap  = document.getElementById("loading-bar-container");

  // Stats elements
  const $statInferenceMs   = document.getElementById("stat-inference-ms");
  const $statFps           = document.getElementById("stat-fps");
  const $statTotalObjects  = document.getElementById("stat-total-objects");
  const $statResolution    = document.getElementById("stat-resolution");
  const $statFpsOverlay    = document.getElementById("stat-fps-overlay");
  const $analyticsAvgLat   = document.getElementById("analytics-avg-latency");
  const $barInference      = document.getElementById("bar-inference");
  const $barFps            = document.getElementById("bar-fps");
  const $apiStatusDot      = document.getElementById("api-status-dot");
  const $apiStatusText     = document.getElementById("api-status-text");
  const $sidebarStatusDot  = document.getElementById("sidebar-status-dot");
  const $sidebarStatusLbl  = document.getElementById("sidebar-status-label");

  // ── State ──────────────────────────────────────────────────────────
  let webcamStream = null;
  let isStreaming = false;
  let frameLoopId = null;
  let totalObjectsSession = 0;
  let latencyHistory = [];
  let allClasses = [];
  let enabledClasses = new Set();
  let lastFrameTime = performance.now();
  let fpsSmooth = 0;

  // ── Class Color Map ────────────────────────────────────────────────
  const CLASS_COLORS = [
    "#60a5fa", "#34d399", "#f59e0b", "#a78bfa",
    "#14b8a6", "#f87171", "#38bdf8", "#84cc16",
    "#e879f9", "#fb923c", "#22d3ee", "#a3e635",
  ];
  function classColor(index) {
    return CLASS_COLORS[index % CLASS_COLORS.length];
  }

  // ── Loading Bar ────────────────────────────────────────────────────
  function showLoading() {
    $loadingBarWrap.classList.remove("hidden");
    $loadingBar.style.width = "0%";
    requestAnimationFrame(() => { $loadingBar.style.width = "70%"; });
  }
  function hideLoading() {
    $loadingBar.style.width = "100%";
    setTimeout(() => {
      $loadingBarWrap.classList.add("hidden");
      $loadingBar.style.width = "0%";
    }, 350);
  }

  // ── Health Check ───────────────────────────────────────────────────
  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApiOnline(true);
      return data;
    } catch {
      setApiOnline(false);
      return null;
    }
  }

  function setApiOnline(online) {
    if (online) {
      $apiStatusDot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
      $apiStatusText.textContent = "API Online";
      $sidebarStatusDot.className = "absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface-container-lowest rounded-full animate-pulse";
      $sidebarStatusLbl.textContent = "Status: Operational";
    } else {
      $apiStatusDot.className = "w-2 h-2 rounded-full bg-red-500";
      $apiStatusText.textContent = "API Offline";
      $sidebarStatusDot.className = "absolute bottom-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-surface-container-lowest rounded-full";
      $sidebarStatusLbl.textContent = "Status: Offline";
    }
  }

  // ── Load Classes ───────────────────────────────────────────────────
  async function loadClasses() {
    try {
      const res = await fetch(`${API_BASE}/classes`);
      const data = await res.json();
      allClasses = data.classes || [];
      enabledClasses = new Set(allClasses);
      renderClassFilters();
    } catch {
      $classFilterList.innerHTML = `<div class="flex items-center justify-center h-full text-on-surface-variant font-mono text-xs">API unavailable</div>`;
    }
  }

  function renderClassFilters() {
    $classFilterList.innerHTML = "";
    allClasses.forEach((cls, i) => {
      const color = classColor(i);
      const isActive = enabledClasses.has(cls);
      const el = document.createElement("label");
      el.className = "flex items-center justify-between p-2 hover:bg-surface-container-low rounded cursor-pointer transition-colors group";
      el.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full shadow-sm border border-white/20" style="background:${color}"></div>
          <span class="font-mono text-xs text-on-surface font-semibold">${cls}</span>
        </div>
        <div class="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
          <input type="checkbox" ${isActive ? "checked" : ""} class="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer" style="border-color:${isActive ? color : '#e1e9ee'};${isActive ? 'right:0' : ''}" data-class="${cls}" />
          <span class="toggle-label block overflow-hidden h-4 rounded-full cursor-pointer" style="background:${isActive ? color + '44' : '#e8eff3'}"></span>
        </div>`;
      const checkbox = el.querySelector("input");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          enabledClasses.add(cls);
          checkbox.style.borderColor = color;
          checkbox.style.right = "0";
          checkbox.nextElementSibling.style.background = color + "44";
        } else {
          enabledClasses.delete(cls);
          checkbox.style.borderColor = "#e1e9ee";
          checkbox.style.right = "auto";
          checkbox.nextElementSibling.style.background = "#e8eff3";
        }
        updateClassCount();
      });
      $classFilterList.appendChild(el);
    });
    updateClassCount();
  }

  function updateClassCount() {
    $classFilterCnt.textContent = `${enabledClasses.size} ACTIVE`;
  }

  // ── Confidence Slider ──────────────────────────────────────────────
  $confSlider.addEventListener("input", () => {
    $confValue.textContent = (parseInt($confSlider.value) / 100).toFixed(2);
  });

  function getConfidence() {
    return parseInt($confSlider.value) / 100;
  }

  // ── Webcam ─────────────────────────────────────────────────────────
  $btnWebcam.addEventListener("click", async () => {
    if (isStreaming) {
      stopWebcam();
    } else {
      await startWebcam();
    }
  });

  async function startWebcam() {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" }
      });
      $webcamVideo.srcObject = webcamStream;
      $webcamVideo.classList.remove("hidden");
      $resultCanvas.classList.add("hidden");
      $idleZone.classList.add("hidden");

      isStreaming = true;
      $btnWebcam.innerHTML = `<span class="material-symbols-outlined text-[16px]">videocam_off</span> Stop Webcam`;
      $btnWebcam.classList.replace("bg-primary", "bg-error");
      $btnWebcam.classList.replace("hover:bg-primary-dim", "hover:bg-error-dim");
      $liveDot.className = "w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      $liveLabel.textContent = "LIVE INFERENCE";

      // Wait for video to be ready
      await new Promise(resolve => { $webcamVideo.onloadedmetadata = resolve; });
      $statResolution.textContent = `${$webcamVideo.videoWidth}x${$webcamVideo.videoHeight}`;

      streamFrames();
    } catch (err) {
      console.error("Webcam error:", err);
      alert("Could not access webcam. Please grant camera permission.");
    }
  }

  function stopWebcam() {
    isStreaming = false;
    if (frameLoopId) cancelAnimationFrame(frameLoopId);
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      webcamStream = null;
    }
    $webcamVideo.classList.add("hidden");
    $resultCanvas.classList.add("hidden");
    $idleZone.classList.remove("hidden");
    $btnWebcam.innerHTML = `<span class="material-symbols-outlined text-[16px]">videocam</span> Start Webcam`;
    $btnWebcam.classList.replace("bg-error", "bg-primary");
    $btnWebcam.classList.replace("hover:bg-error-dim", "hover:bg-primary-dim");
    $liveDot.className = "w-2.5 h-2.5 bg-on-surface-variant rounded-full";
    $liveLabel.textContent = "IDLE";
    $statResolution.textContent = "—";
    $statFpsOverlay.textContent = "—";
  }

  // Capture & send frames continuously
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");
  let isSending = false;

  function streamFrames() {
    if (!isStreaming) return;

    if (!isSending) {
      isSending = true;
      captureAndSend().finally(() => { isSending = false; });
    }

    frameLoopId = requestAnimationFrame(streamFrames);
  }

  async function captureAndSend() {
    captureCanvas.width = $webcamVideo.videoWidth;
    captureCanvas.height = $webcamVideo.videoHeight;
    captureCtx.drawImage($webcamVideo, 0, 0);
    const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.7);
    const base64 = dataUrl.split(",")[1];

    try {
      const res = await fetch(`${API_BASE}/detect/frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: base64, confidence_threshold: getConfidence() }),
      });
      const data = await res.json();
      handleDetectionResult(data, true);
    } catch {
      // silently skip failed frames
    }
  }

  // ── Image Upload ───────────────────────────────────────────────────
  $btnUpload.addEventListener("click", () => $fileInput.click());
  $fileInput.addEventListener("change", async () => {
    const file = $fileInput.files[0];
    if (!file) return;

    showLoading();
    stopWebcam();
    $liveLabel.textContent = "PROCESSING";
    $liveDot.className = "w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("confidence_threshold", getConfidence());

    try {
      const res = await fetch(`${API_BASE}/detect/image?confidence_threshold=${getConfidence()}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      handleDetectionResult(data, false);
      $liveLabel.textContent = "UPLOAD RESULT";
      $liveDot.className = "w-2.5 h-2.5 bg-primary rounded-full";
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to process image. Is the API running?");
      $liveLabel.textContent = "ERROR";
      $liveDot.className = "w-2.5 h-2.5 bg-red-500 rounded-full";
    } finally {
      hideLoading();
      $fileInput.value = "";
    }
  });

  // ── Handle Detection Result ────────────────────────────────────────
  function handleDetectionResult(data, isStream) {
    const imgField = isStream ? data.annotated_frame : data.annotated_image;
    if (imgField) {
      showAnnotatedImage(imgField);
    }

    const inferMs = data.inference_time_ms || 0;
    const detections = (data.detections || []).filter(d => enabledClasses.has(d.class));
    const objCount = detections.length;
    totalObjectsSession += objCount;

    // FPS calculation
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    if (isStream && delta > 0) {
      const instantFps = 1000 / delta;
      fpsSmooth = fpsSmooth * 0.8 + instantFps * 0.2;
    }

    // Update stats
    $statInferenceMs.textContent = `${inferMs.toFixed(1)} ms`;
    $barInference.style.width = `${Math.min(inferMs / 200 * 100, 100)}%`;
    if (isStream) {
      $statFps.textContent = fpsSmooth.toFixed(1);
      $statFpsOverlay.textContent = fpsSmooth.toFixed(1);
      $barFps.style.width = `${Math.min(fpsSmooth / 30 * 100, 100)}%`;
    }
    $statTotalObjects.textContent = `${totalObjectsSession} total this session`;

    // Latency chart
    latencyHistory.push(inferMs);
    if (latencyHistory.length > LATENCY_HISTORY_SIZE) latencyHistory.shift();
    renderLatencyChart();
    const avgLat = latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length;
    $analyticsAvgLat.textContent = `${avgLat.toFixed(1)} ms`;

    // Detection log
    const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false }) +
      "." + String(Date.now() % 1000).padStart(3, "0").slice(0, 2);
    detections.forEach(det => addLogRow(timestamp, det));
  }

  function showAnnotatedImage(base64) {
    const img = new Image();
    img.onload = () => {
      $resultCanvas.width = img.width;
      $resultCanvas.height = img.height;
      const ctx = $resultCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      $resultCanvas.classList.remove("hidden");
      $webcamVideo.classList.add("hidden");
      $idleZone.classList.add("hidden");
      $statResolution.textContent = `${img.width}x${img.height}`;
    };
    img.src = "data:image/jpeg;base64," + base64;
  }

  // ── Latency Chart ──────────────────────────────────────────────────
  function renderLatencyChart() {
    const maxVal = Math.max(...latencyHistory, 50);
    $latencyChart.innerHTML = latencyHistory.map(v => {
      const pct = (v / maxVal) * 100;
      const isSpike = v > maxVal * 0.75;
      return `<div class="w-full ${isSpike ? 'bg-error-container' : 'bg-primary/70'} rounded-t-sm transition-all duration-200" style="height:${pct}%"></div>`;
    }).join("");
  }

  // ── Detection Log ──────────────────────────────────────────────────
  function addLogRow(time, det) {
    const cls = det.class;
    const conf = det.confidence;
    const isLow = conf < getConfidence();
    const colorIdx = allClasses.indexOf(cls);
    const color = colorIdx >= 0 ? classColor(colorIdx) : "#566166";

    const row = document.createElement("tr");
    row.className = `hover:bg-surface-container-low transition-colors border-b border-surface-container/50 ${isLow ? 'bg-error-container/10' : ''}`;
    row.innerHTML = `
      <td class="p-2 text-on-surface-variant">${time}</td>
      <td class="p-2 font-bold" style="color:${color}">${cls}</td>
      <td class="p-2 text-right ${isLow ? 'text-error font-bold' : 'text-on-surface'}">${conf.toFixed(2)}</td>`;

    $detectionsLog.prepend(row);
    // Limit log size
    while ($detectionsLog.children.length > MAX_LOG_ROWS) {
      $detectionsLog.removeChild($detectionsLog.lastChild);
    }
  }

  $btnClearLog.addEventListener("click", () => {
    $detectionsLog.innerHTML = "";
  });

  // ── Snapshot ───────────────────────────────────────────────────────
  $btnSnapshot.addEventListener("click", () => {
    if ($resultCanvas.classList.contains("hidden")) return;
    const link = document.createElement("a");
    link.download = `detectarch_snapshot_${Date.now()}.png`;
    link.href = $resultCanvas.toDataURL("image/png");
    link.click();
  });

  // ── Init ───────────────────────────────────────────────────────────
  async function init() {
    await checkHealth();
    await loadClasses();
    // Periodic health check every 15s
    setInterval(checkHealth, 15000);
  }

  init();
})();
