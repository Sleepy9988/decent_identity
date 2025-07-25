import requests 
import logging

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
    
    