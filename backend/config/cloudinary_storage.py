"""
Lightweight Cloudinary Django Storage backend (zero extra pip packages).
Supports images, audio voice notes, and videos permanently via Cloudinary /auto/upload.
Activated automatically when CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> is set.
"""

import hashlib
import os
import time
import urllib.parse
import requests
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class CloudinaryAutoStorage(Storage):
    def __init__(self, cloudinary_url=None):
        raw_url = (cloudinary_url or os.getenv('CLOUDINARY_URL', '')).strip()
        parsed = urllib.parse.urlparse(raw_url)
        self.cloud_name = parsed.hostname or ''
        self.api_key = urllib.parse.unquote(parsed.username or '')
        self.api_secret = urllib.parse.unquote(parsed.password or '')

    def _save(self, name, content):
        if not (self.cloud_name and self.api_key and self.api_secret):
            raise RuntimeError('CLOUDINARY_URL is not properly configured.')

        timestamp = str(int(time.time()))
        folder = 'manakbae'
        to_sign = f'folder={folder}&timestamp={timestamp}{self.api_secret}'
        signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()

        if hasattr(content, 'seek'):
            content.seek(0)
        file_bytes = content.read()
        filename = os.path.basename(name) or 'upload.bin'

        upload_url = f'https://api.cloudinary.com/v1_1/{self.cloud_name}/auto/upload'
        resp = requests.post(
            upload_url,
            data={
                'api_key': self.api_key,
                'timestamp': timestamp,
                'folder': folder,
                'signature': signature,
            },
            files={'file': (filename, file_bytes)},
            timeout=60,
        )
        resp.raise_for_status()
        payload = resp.json()

        # Store compact path (< 100 chars) so it always fits Django FileField(max_length=100)
        resource_type = payload.get('resource_type', 'auto')
        version = payload.get('version')
        public_id = payload.get('public_id', '')
        fmt = payload.get('format', '')
        suffix = f'.{fmt}' if fmt and not public_id.endswith(f'.{fmt}') else ''
        version_part = f'v{version}/' if version else ''
        return f'{resource_type}/upload/{version_part}{public_id}{suffix}'

    def url(self, name):
        if not name:
            return ''
        if name.startswith('http://') or name.startswith('https://'):
            return name
        if '/upload/' in name and self.cloud_name:
            return f'https://res.cloudinary.com/{self.cloud_name}/{name}'
        return f'/media/{name.lstrip("/")}'

    def exists(self, name):
        return False

    def delete(self, name):
        # Keep media safe; no-op on delete unless explicitly cleaned in Cloudinary dashboard
        pass
