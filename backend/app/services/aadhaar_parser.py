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

        return output_json
    except Exception as e:
        return {
            "status": "Failure",
            "code": "1001",
            "message": str(e),
        }
