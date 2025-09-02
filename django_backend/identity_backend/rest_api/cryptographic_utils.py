import os, base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes 
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_fernet_key(signature, salt):
    """
    Derive Fernet key from Ethereum wallet signature + salt.
    Salt is unique per user-identity and stored in the DB. 
    PBKDF2 with SHA256 and 1.2M iterations is recommended to prevent brute-force attacks. 
    Documentation:
        https://cryptography.io/en/latest/
    """
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
    """
    Encrypt data using Fernet key derived from Ethereum wallet signature + salt.
    Data input in bytes. 
    Returns the ciphertext. 
    """
    f = get_fernet_key(signature, salt)
    return f.encrypt(data)


def decrypt(data, signature, salt):
    """
    Decrypt the data encrypted with encrypt() function.
    """
    f = get_fernet_key(signature, salt)
    return f.decrypt(data)


# --- Envelope Encryption ----
# https://medium.com/@tarangchikhalia/envelope-encryption-a-secure-approach-to-secrets-management-c8abce5b24d2


def generate_encKey():
    """
    Generate random 32-byte Data Encryption Key (DEK)
    """
    return os.urandom(32)


def fernet_encKey(encKey):
    """
    Convert raw encryption key into Fernet instance.
    Used to encrypt & decrypt data. 
    """
    key = base64.urlsafe_b64encode(encKey)
    return Fernet(key)


def derive_kek_from_signature(signature, salt):
    """
    Derive Key Encryption Key (KEK) from signature + salt.
    Encrypts the encryption key not data.
    """
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
    """
    Encrypt the DEK with the KEK
    """
    kek = derive_kek_from_signature(signature, salt)
    kek_b64url = base64.urlsafe_b64encode(kek)
    f_kek = Fernet(kek_b64url)
    return f_kek.encrypt(enc_key)


def unwrap_key_w_signature(enc_key_wrapped, signature, salt):
    """
    Decrypt the DEK using the KEK
    """
    kek = derive_kek_from_signature(signature, salt)
    kek_b64url = base64.urlsafe_b64encode(kek)
    f_kek = Fernet(kek_b64url)
    return f_kek.decrypt(enc_key_wrapped)