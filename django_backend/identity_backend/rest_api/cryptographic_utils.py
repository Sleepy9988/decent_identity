import os 
import base64
from cryptography.fernet import Fernet # type: ignore
from cryptography.hazmat.primitives import hashes # type: ignore
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_fernet_key(signature, salt):
    if isinstance(signature, str):
        signature = signature.encode()
        
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=1_200_000,
    )

    key = base64.urlsafe_b64encode(kdf.derive(signature))

    return Fernet(key)

def encrypt(data, signature, salt):
    f = get_fernet_key(signature, salt)
    return f.encrypt(data)

def decrypt(data, signature, salt):
    f = get_fernet_key(signature, salt)
    return f.decrypt(data)


