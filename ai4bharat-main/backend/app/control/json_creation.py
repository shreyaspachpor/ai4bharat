from io import BytesIO
from base64 import b64encode

def img_conversion(imge_data):
    in_mem_file = BytesIO()
    imge_data.save(in_mem_file, format="PNG")
    in_mem_file.seek(0)
    img_bytes = in_mem_file.read()
    base64_encoded_result_bytes = b64encode(img_bytes)
    base64_encoded_result_str = base64_encoded_result_bytes.decode('ascii')
    return base64_encoded_result_str

def get_json_data(json_obj, aadhar_obj):
    if "msgdata" not in json_obj:
        json_obj["msgdata"] = {}
    if "userdata" not in json_obj["msgdata"]:
        json_obj["msgdata"]["userdata"] = {}

    json_obj["msgdata"]["userdata"]["email_mobile_status"] = aadhar_obj.data.get('email_mobile_status', "")
    json_obj["msgdata"]["userdata"]["referenceid"] = aadhar_obj.data.get('referenceid', "")
    json_obj["msgdata"]["userdata"]["name"] = aadhar_obj.data.get('name', "")
    json_obj["msgdata"]["userdata"]["dob"] = aadhar_obj.data.get('dob', "")
    json_obj["msgdata"]["userdata"]["gender"] = aadhar_obj.data.get('gender', "")
    json_obj["msgdata"]["userdata"]["careof"] = aadhar_obj.data.get('careof', "")
    json_obj["msgdata"]["userdata"]["district"] = aadhar_obj.data.get('district', "")
    json_obj["msgdata"]["userdata"]["landmark"] = aadhar_obj.data.get('landmark', "")
    json_obj["msgdata"]["userdata"]["house"] = aadhar_obj.data.get('house', "")
    json_obj["msgdata"]["userdata"]["location"] = aadhar_obj.data.get('location', "")
    json_obj["msgdata"]["userdata"]["pincode"] = aadhar_obj.data.get('pincode', "")
    json_obj["msgdata"]["userdata"]["postoffice"] = aadhar_obj.data.get('postoffice', "")
    json_obj["msgdata"]["userdata"]["state"] = aadhar_obj.data.get('state', "")
    json_obj["msgdata"]["userdata"]["street"] = aadhar_obj.data.get('street', "")
    json_obj["msgdata"]["userdata"]["subdistrict"] = aadhar_obj.data.get('subdistrict', "")
    json_obj["msgdata"]["userdata"]["vtc"] = aadhar_obj.data.get('vtc', "")
    json_obj["msgdata"]["userdata"]["aadhaar_last_4_digit"] = aadhar_obj.data.get('aadhaar_last_4_digit', "")
    json_obj["msgdata"]["userdata"]["aadhaar_last_digit"] = aadhar_obj.data.get('aadhaar_last_digit', "")
    json_obj["msgdata"]["userdata"]["email"] = aadhar_obj.data.get('email', False)
    json_obj["msgdata"]["userdata"]["mobile"] = aadhar_obj.data.get('mobile', False)

    image_b64 = None
    try:
        if hasattr(aadhar_obj, "contains_image") and aadhar_obj.contains_image():
            img = aadhar_obj.image()
            if img is not None:
                image_b64 = img_conversion(img)
    except Exception:
        image_b64 = None

    json_obj["msgdata"]["userdata"]["image"] = image_b64

    json_obj["msgdata"]["availabledetails"] = getattr(aadhar_obj, 'details', [])
    try:
        json_obj["msgdata"]["signature"] = b64encode(aadhar_obj.signature()).decode('ascii')
    except Exception:
        pass
    try:
        json_obj["msgdata"]["hashofemail"] = aadhar_obj.sha256hashOfEMail()
    except Exception:
        pass
    try:
        json_obj["msgdata"]["hashofmobile"] = aadhar_obj.sha256hashOfMobileNumber()
    except Exception:
        pass
    try:
        json_obj["msgdata"]["isemailreg"] = aadhar_obj.isEmailRegistered()
    except Exception:
        pass
    try:
        json_obj["msgdata"]["ismobilereg"] = aadhar_obj.isMobileNoRegistered()
    except Exception:
        pass

    return json_obj
