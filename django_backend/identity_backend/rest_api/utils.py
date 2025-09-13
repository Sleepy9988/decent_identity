import os, requests, logging, re 
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings

logger = logging.getLogger('rest_api')

def verify_with_veramo(endpoint, json_data):
    """
    Helper to call a Veramo backend service (running at :3003).
    Posts JSON payloads to the specified endpoint and returns the response.

    Args:
        endpoint (str): API endpoint path (e.g., 'verify-presentation').
        json_data (dict): JSON body to send in the request.

    Returns:
        dict: Parsed JSON response from Veramo backend.

    Raises:
        HTTPError / RequestException if the request fails.
    """
    base = settings.VERAMO_URL
    endpoint = endpoint.lstrip("/")
    veramo_service_url = f"{base}/{endpoint}"

    try: 
        response = requests.post(veramo_service_url, json=json_data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error: {e}")
        raise
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {e}")
        raise
    

def notify_did(did, payload):
    """
    Sends a real-time notification to all WebSocket clients subscribed to a DID group.

    Uses Django Channels' channel layer to send messages.

    Args:
        did (str): The DID to notify (used to build group name).
        payload (dict): The message payload to send to the WebSocket group.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    
    sanitized_did = re.sub(r'[^a-zA-Z0-9-._]+', '_', did)
    group_name = f"user_{sanitized_did}"
    
    logger.info(f"notify_did called for DID: {sanitized_did}")
    logger.debug(f"Payload: {group_name}")

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notify",          
            "message": payload,         
        }
    )


def to_bytes(v):
    if v is None:
        return None
    if isinstance(v, memoryview):
        return v.tobytes()
    if isinstance(v, bytearray):
        return bytes(v)
    if isinstance(v, str):
        return v.encode('utf-8')
    return v