from hashlib import sha256
from app.control import decode1


def SHAGenerator(string, n):
    tmp_sha = str(string)
    if int(n) == 0 or int(n) == 1:
        return sha256(tmp_sha.encode()).hexdigest()
    for i in range(int(n)):
        tmp_sha = sha256(tmp_sha.encode()).hexdigest()
    return tmp_sha


def isSecureQr(sample):
    try:
        int(sample)
        return True
    except ValueError:
        return False


def AadhaarQrAuto(data):
    if isSecureQr(data):
        return decode1.AadhaarSecureQr(int(data))
    else:
        return decode1.AadhaarOldQr(data)


def Qr_img_to_text(file):
    import cv2
    from pyzbar.pyzbar import decode

    img = cv2.imread(file)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    code = decode(gray)
    totaldata = []
    for i in code:
        decodeddata = i.data.decode("utf-8")
        totaldata.append(decodeddata)
    return totaldata
