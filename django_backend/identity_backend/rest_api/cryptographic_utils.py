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


# new 
def generate_encKey():
    return os.urandom(32)

def fernet_encKey(encKey):
    key = base64.urlsafe_b64encode(encKey)
    return Fernet(key)


def derive_kek_from_signature(signature, salt):
    if isinstance(signature, str):
        signature = signature.encode('utf-8')

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32, 
        salt=salt,
        iterations=1_200_000
    )
    return kdf.derive(signature)


def wrap_key_w_signature(enc_key, signature, salt):
    kek = derive_kek_from_signature(signature, salt)
    kek_b64url = base64.urlsafe_b64encode(kek)
    f_kek = Fernet(kek_b64url)
    return f_kek.encrypt(enc_key)

def unwrap_key_w_signature(enc_key_wrapped, signature, salt):
    kek = derive_kek_from_signature(signature, salt)
    kek_b64url = base64.urlsafe_b64encode(kek)
    f_kek = Fernet(kek_b64url)
    return f_kek.decrypt(enc_key_wrapped)