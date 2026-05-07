from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/aadhaar", tags=["aadhaar"])


class AadharQr(BaseModel):
    aadhaarqrdata: str


@router.post("/getaadhaarinfo/qrdata/")
async def post_aadhaar_qr_data(payload: AadharQr):
    qr_text = (payload.aadhaarqrdata or "").strip()
    if not qr_text:
        raise HTTPException(status_code=400, detail="aadhaarqrdata is required")

    # The parser expects Aadhaar *secure QR* numeric payload.
    if not qr_text.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Expected Aadhaar secure QR data as digits only (numeric payload).",
        )

    from app.services.aadhaar_parser import get_aadhaar_info_qr

    result = get_aadhaar_info_qr(qr_text)
    
    # Check for parser errors
    if result.get("status") == "Failure":
        raise HTTPException(status_code=422, detail=result.get("message", "Failed to parse Aadhaar QR"))
    
    return result


@router.post("/getaadhaarinfo/qrimage/")
async def post_aadhaar_qr_image(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        import cv2
        import numpy as np
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="Missing dependency for image decoding. Install: pip install opencv-python numpy",
        ) from e

    np_bytes = np.frombuffer(content, dtype=np.uint8)
    img = cv2.imdecode(np_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image. Upload a JPG/PNG.")

    from app.services.aadhaar_service import decode_qr_text, extract_qr_region

    qr_text = decode_qr_text(img)
    if not qr_text:
        # Try extracting probable QR region then decode.
        try:
            qr_crop = extract_qr_region(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        except Exception:
            qr_crop = None

        qr_text = decode_qr_text(qr_crop)

    if not qr_text:
        raise HTTPException(status_code=422, detail="Could not decode a QR code from the image")

    qr_text = qr_text.strip()
    if not qr_text.isdigit():
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Decoded QR text is not a numeric Aadhaar secure-QR payload.",
                "decoded": qr_text,
            },
        )

    from app.services.aadhaar_parser import get_aadhaar_info_qr

    result = get_aadhaar_info_qr(qr_text)
    
    # Check for parser errors
    if result.get("status") == "Failure":
        raise HTTPException(status_code=422, detail=result.get("message", "Failed to parse Aadhaar QR"))
    
    return result


@router.get("/getaadhaarinfo/qrdata/")
async def get_aadhar_data(pdf_path: str, password: str):
    from app.services.aadhaar_service import extract_images_from_pdf, extract_qr_data_pyzbar
    from app.services.aadhaar_parser import get_aadhaar_info_qr

    try:
        images_from_pdf = extract_images_from_pdf(pdf_path, password)
        
        qr_data = None
        for img_num, img_bgr, img_type in images_from_pdf:
            data = extract_qr_data_pyzbar(img_bgr)
            if not data:
                from app.services.aadhaar_service import decode_qr_text
                data = decode_qr_text(img_bgr)
            if data and data.isdigit():
                qr_data = data
                break
                
        if not qr_data:
            return {"error": "No valid numeric QR data found in PDF images."}

        qr_data_str = qr_data.strip() if isinstance(qr_data, str) else str(qr_data)

        value = get_aadhaar_info_qr(qr_data_str)
        
        # Check for parser errors
        if value.get("status") == "Failure":
            return {"error": value.get("message", "Failed to parse Aadhaar QR")}
        
        return value
    except HTTPException as e:
        raise e
    except Exception as e:
         return {"error": str(e)}

@router.post("/getaadhaarinfo/pdf/")
async def post_aadhaar_pdf(file: UploadFile = File(...), password: str = Form("")):
    from app.services.aadhaar_service import extract_images_from_pdf, extract_qr_data_pyzbar
    from app.services.aadhaar_parser import get_aadhaar_info_qr

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        images_from_pdf = extract_images_from_pdf(pdf_bytes=content, password=password)
        
        qr_data = None
        for img_num, img_bgr, img_type in images_from_pdf:
            data = extract_qr_data_pyzbar(img_bgr)
            if not data:
                from app.services.aadhaar_service import decode_qr_text
                data = decode_qr_text(img_bgr)
            if data and data.isdigit():
                qr_data = data
                break
                
        if not qr_data:
            raise HTTPException(status_code=422, detail="No valid numeric QR data found in PDF images.")

        qr_data_str = qr_data.strip() if isinstance(qr_data, str) else str(qr_data)

        value = get_aadhaar_info_qr(qr_data_str)
        
        # Check for parser errors
        if value.get("status") == "Failure":
            raise HTTPException(status_code=422, detail=value.get("message", "Failed to parse Aadhaar QR"))
        
        return value
    except HTTPException as e:
        raise e
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

