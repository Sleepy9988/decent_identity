import os 
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_fernet_key(did, salt):
    if isinstance(did, str):
        did = did.encode()
        
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=1_200_000,
    )

    key = base64.urlsafe_b64encode(kdf.derive(did))

    return Fernet(key)

def encrypt(data, did, salt):
    f = get_fernet_key(did, salt)
    return f.encrypt(data)

def decrypt(data, did, salt):
    f = get_fernet_key(did, salt)
    return f.decrypt(data)