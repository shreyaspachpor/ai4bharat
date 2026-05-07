"""Aadhaar QR code extraction & decoding utilities (no pyzbar / no system deps)."""

from fastapi import HTTPException


def decode_qr_text_opencv(img) -> str | None:
    """Attempt QR decode using OpenCV's built-in detector."""
    try:
        import cv2
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(img)
        data = (data or "").strip()
        return data or None
    except Exception:
        return None


def decode_qr_text(img) -> str | None:
    """Best-effort QR decode from a numpy image array using OpenCV only."""
    try:
        import cv2
        import numpy as np  # noqa: F401
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Missing dependency. Install: pip install opencv-python-headless numpy",
        )

    if img is None:
        return None

    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # 1. Try color image directly
    text = decode_qr_text_opencv(img)
    if text:
        return text

    # 2. Try grayscale
    text = decode_qr_text_opencv(gray)
    if text:
        return text

    # 3. Upscale small images
    h, w = gray.shape[:2]
    for scale in [2, 3, 4]:
        resized = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
        text = decode_qr_text_opencv(resized)
        if text:
            return text

    # 4. Binarize with Otsu
    try:
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = decode_qr_text_opencv(thresh)
        if text:
            return text
        # Upscale binarized too
        h2, w2 = thresh.shape[:2]
        for scale in [2, 3]:
            resized = cv2.resize(thresh, (w2 * scale, h2 * scale), interpolation=cv2.INTER_NEAREST)
            text = decode_qr_text_opencv(resized)
            if text:
                return text
    except Exception:
        pass

    # 5. Adaptive threshold
    try:
        adaptive = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        text = decode_qr_text_opencv(adaptive)
        if text:
            return text
    except Exception:
        pass

    return None


def extract_qr_region(gray_img):
    """Extract the largest QR-code-like region from a grayscale image."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        return None

    if gray_img is None:
        return None

    enhanced = cv2.convertScaleAbs(gray_img, alpha=1.5, beta=0)
    _, thresh = cv2.threshold(enhanced, 100, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    kernel = np.ones((3, 3), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    largest_area = 0
    largest_contour = None
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > largest_area:
            largest_area = area
            largest_contour = contour

    if largest_contour is None:
        return None

    x, y, w, h = cv2.boundingRect(largest_contour)
    padding = 10
    x = max(0, x - padding)
    y = max(0, y - padding)
    w = min(gray_img.shape[1] - x, w + 2 * padding)
    h = min(gray_img.shape[0] - y, h + 2 * padding)

    if w > 0 and h > 0:
        return gray_img[y : y + h, x : x + w]

    return None


def _render_page_to_cv2(page, dpi: int = 300):
    """Render a PyMuPDF page to a numpy/cv2 BGR image at the given DPI."""
    import numpy as np
    import cv2

    zoom = dpi / 72.0
    mat = __import__("fitz").Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img_bgr


def decode_qr_from_pdf_bytes(pdf_bytes: bytes, password: str = "") -> str | None:
    """
    Primary extraction path: render each PDF page at 300 DPI and scan for QR codes.
    This is far more reliable than extracting embedded sub-images.
    """
    try:
        import fitz
    except ImportError:
        return None

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        return None

    if doc.is_encrypted:
        if not doc.authenticate(password):
            return None

    for page_num in range(min(len(doc), 10)):  # check first 10 pages
        page = doc.load_page(page_num)
        try:
            img_bgr = _render_page_to_cv2(page, dpi=300)
            text = decode_qr_text(img_bgr)
            if text and text.strip().isdigit():
                return text.strip()
        except Exception:
            continue

    return None


def extract_images_from_pdf(pdf_path: str = None, password: str = "", pdf_bytes: bytes = None) -> list:
    """
    Extract images from an Aadhaar PDF.
    Primary: full-page render at 300 DPI (most reliable for QR decoding).
    Fallback: embedded image extraction.
    """
    try:
        import fitz
        import cv2
        import numpy as np
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="Missing dependency. Install: pip install pymupdf opencv-python-headless numpy",
        ) from e

    if pdf_bytes is not None:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    elif pdf_path is not None:
        pdf_document = fitz.open(pdf_path)
    else:
        raise HTTPException(status_code=400, detail="Either pdf_path or pdf_bytes must be provided")

    if pdf_document.is_encrypted:
        if not pdf_document.authenticate(password):
            raise HTTPException(status_code=400, detail="Incorrect PDF password")

    images = []
    image_count = 1

    # --- Primary: render full pages at 300 DPI ---
    for page_num in range(min(len(pdf_document), 10)):
        page = pdf_document.load_page(page_num)
        try:
            img_bgr = _render_page_to_cv2(page, dpi=300)
            img_type = "QR Code" if page_num == 0 else "Page"
            images.append((image_count, img_bgr, img_type))
            image_count += 1
        except Exception:
            continue

    # --- Fallback: embedded image extraction ---
    if not images:
        target_pages = [0, min(8, len(pdf_document) - 1)]
        for page_num in target_pages:
            if page_num < len(pdf_document):
                page = pdf_document.load_page(page_num)
                image_list = page.get_images(full=True)
                for img_info in image_list:
                    xref = img_info[0]
                    base_image = pdf_document.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_np_array = np.frombuffer(image_bytes, np.uint8)
                    image_bgr = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)
                    if image_bgr is not None:
                        images.append((image_count, image_bgr, "QR Code"))
                        image_count += 1

    return images


def decode_qr_text_opencv_only(img) -> str | None:
    """Alias for compatibility."""
    return decode_qr_text_opencv(img)
