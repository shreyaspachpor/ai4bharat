"""Aadhaar QR parser – wraps decode1.AadhaarSecureQr + json_creation.

This module is a direct port of the user's control/aadhar_qr_parser.py.
It depends on control/decode1.py (AadhaarSecureQr) and
control/json_creation.py (get_json_data).

TODO: Place your original decode1.py and json_creation.py files at:
  - backend/app/control/decode1.py
  - backend/app/control/json_creation.py
"""

import os
import json


def get_aadhaar_info_qr(secured_qr_data: str) -> dict:
    """Parse Aadhaar secure QR numeric payload into structured JSON."""
    try:
        output_file_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "data", "output.json"
        )

        # Ensure data directory exists
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

        # Create default output.json if missing
        if not os.path.exists(output_file_path):
            with open(output_file_path, "w") as f:
                json.dump({}, f)

        # Read the JSON template
        with open(output_file_path, "r") as f:
            json_data = json.load(f)

        # Decode the secure QR data
        from app.control.decode1 import AadhaarSecureQr
        from app.control.json_creation import get_json_data

        obj = AadhaarSecureQr(int(secured_qr_data))
        output_json = get_json_data(json_data, obj)

        # Flatten the nested structure for frontend consumption
        # Frontend expects flat structure with top-level fields like 'name', 'dob', etc.
        if "msgdata" in output_json and "userdata" in output_json["msgdata"]:
            userdata = output_json["msgdata"]["userdata"]
            # Return flat structure with essential fields
            return {
                "name": userdata.get("name", ""),
                "dob": userdata.get("dob", ""),
                "gender": userdata.get("gender", ""),
                "address": f"{userdata.get('house', '')} {userdata.get('street', '')} {userdata.get('location', '')}".strip(),
                "district": userdata.get("district", ""),
                "state": userdata.get("state", ""),
                "pincode": userdata.get("pincode", ""),
                "mobile": userdata.get("mobile", False),
                "email": userdata.get("email", False),
                "aadhaar_last_4": userdata.get("aadhaar_last_4_digit", ""),
                "referenceid": userdata.get("referenceid", ""),
                "image": userdata.get("image", None),
                "raw_data": output_json  # Include full data for debugging
            }
        
        return output_json
    except Exception as e:
        return {
            "status": "Failure",
            "code": "1001",
            "message": str(e),
        }
