# azure_blob_service.py
import os
from datetime import datetime, timedelta
from azure.storage.blob import generate_container_sas, ContainerSasPermissions

class AzureBlobService:
    def __init__(self):
        # Prefer using the connection string if provided.
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.container_name = os.getenv("AZURE_CONTAINER_NAME")
        
        if connection_string:
            parts = connection_string.split(';')
            conn_dict = {}
            for part in parts:
                if '=' in part:
                    key, value = part.split('=', 1)
                    conn_dict[key.strip()] = value.strip()
            self.account_name = conn_dict.get("AccountName")
            self.account_key = conn_dict.get("AccountKey")
        else:
            # Fallback to individual environment variables.
            self.account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
            self.account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
        
        if not all([self.account_name, self.account_key, self.container_name]):
            raise ValueError("Azure storage connection details and container name must be set in the environment.")

    def get_container_sas_url(self, expiry_minutes=60):
        """Generates a SAS URL for the container valid for expiry_minutes."""
        sas_token = generate_container_sas(
            account_name=self.account_name,
            container_name=self.container_name,
            account_key=self.account_key,
            permission=ContainerSasPermissions(read=True, write=True, list=True, create=True),
            expiry=datetime.utcnow() + timedelta(minutes=expiry_minutes)
        )
        # Construct URL: https://<account>.blob.core.windows.net/<container>?<sas_token>
        url = f"https://{self.account_name}.blob.core.windows.net/{self.container_name}?{sas_token}"
        return url
