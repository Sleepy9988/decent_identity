import requests, logging, re, json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger('rest_api')

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
