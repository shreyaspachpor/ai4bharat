"""Aadhaar QR code extraction & decoding utilities."""

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


def decode_qr_text_pyzbar(img) -> str | None:
    """Attempt QR decode using pyzbar (zbar wrapper)."""
    try:
        from pyzbar.pyzbar import decode
        decoded = decode(img)
        if not decoded:
            return None
        data = decoded[0].data.decode("utf-8", errors="ignore").strip()
        return data or None
    except Exception:
        return None


def decode_qr_text(img) -> str | None:
    """Best-effort QR decode from a numpy image array."""
    try:
        import cv2
        import numpy as np  # noqa: F401
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Missing dependency. Install: pip install opencv-python numpy",
        )

    if img is None:
        return None

    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    for candidate in (img, gray):
        text = decode_qr_text_opencv(candidate) or decode_qr_text_pyzbar(candidate)
        if text:
            return text

    h, w = gray.shape[:2]
    scale = 2 if max(h, w) < 1200 else 1
    if scale != 1:
        resized = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
        text = decode_qr_text_opencv(resized) or decode_qr_text_pyzbar(resized)
        if text:
            return text

    try:
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = decode_qr_text_opencv(thresh) or decode_qr_text_pyzbar(thresh)
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

    if largest_contour is not None and largest_area > 10000:
        x, y, w, h = cv2.boundingRect(largest_contour)
        expand = 0.05
        x_exp = int(w * expand)
        y_exp = int(h * expand)
        x = max(0, x - x_exp)
        y = max(0, y - y_exp)
        w = min(gray_img.shape[1] - x, w + 2 * x_exp)
        h = min(gray_img.shape[0] - y, h + 2 * y_exp)
        return gray_img[y : y + h, x : x + w]

    return None


def extract_images_from_pdf(pdf_path: str = None, password: str = "", pdf_bytes: bytes = None) -> list:
    """Extract images from specific pages of an Aadhaar PDF."""
    try:
        import fitz  # PyMuPDF
        import cv2
        import numpy as np
        import pyzbar.pyzbar as pyzbar
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="Missing dependency. Install: pip install pymupdf opencv-python numpy pyzbar",
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
    target_pages = [0, 8]

    for page_num in target_pages:
        if page_num < len(pdf_document):
            page = pdf_document.load_page(page_num)
            image_list = page.get_images(full=True)

            for img_index in range(len(image_list)):
                xref = image_list[img_index][0]
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_np_array = np.frombuffer(image_bytes, np.uint8)
                image_bgr = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)

                if image_count == 1:
                    image_type = "QR Code"
                elif image_count == 8:
                    image_type = "Photo"
                else:
                    decoded_objects = pyzbar.decode(image_bgr)
                    image_type = "QR Code" if decoded_objects else "Photo"

                images.append((image_count, image_bgr, image_type))
                image_count += 1

    return images


def extract_qr_data_pyzbar(img) -> str | None:
    """Decode QR data from image using pyzbar."""
    try:
        from pyzbar.pyzbar import decode
        decoded_objects = decode(img)
        if decoded_objects:
            return decoded_objects[0].data.decode("utf-8")
    except Exception:
        pass
    return None
