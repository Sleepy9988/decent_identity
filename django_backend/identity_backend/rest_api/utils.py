import requests 
import logging
from hashlib import sha256
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

def verify_with_veramo(endpoint, json_data):

    # URL of the Veramo backend agent 
    veramo_service_url = f'http://localhost:3003/{endpoint}'

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

    channel_layer = get_channel_layer()
    
    if channel_layer is None:
        return
    
    group_name = sha256(did.encode('utf-8')).hexdigest()

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notify",          
            "message": payload,         
        }
    )
