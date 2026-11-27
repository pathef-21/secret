"""
Range-aware Django media view for Man Ak Bae ❤️:
- Full HTTP Range (206 Partial Content / Accept-Ranges: bytes) support required by iPhone Safari for <audio> & <video>.
- Automatic PostgreSQL fallback (MessageAttachment.file_data) so voice messages NEVER 404 after Render restarts.
"""

import mimetypes
import os
import re
from django.conf import settings
from django.http import Http404, HttpResponse, StreamingHttpResponse
from django.utils._os import safe_join

RANGE_RE = re.compile(r'bytes=(\d+)-(\d*)')

EXTRA_MIME_TYPES = {
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.webm': 'audio/webm',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
}


def _guess_mime(path, fallback='application/octet-stream'):
    ext = os.path.splitext(path)[1].lower()
    if ext in EXTRA_MIME_TYPES:
        return EXTRA_MIME_TYPES[ext]
    guessed, _ = mimetypes.guess_type(path)
    return guessed or fallback


def _build_range_response(request, data_bytes, content_type):
    total_len = len(data_bytes)
    range_header = request.META.get('HTTP_RANGE', '').strip()
    match = RANGE_RE.match(range_header) if range_header else None

    if match:
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else total_len - 1
        if start >= total_len:
            resp = HttpResponse(status=416)
            resp['Content-Range'] = f'bytes */{total_len}'
            return resp
        end = min(end, total_len - 1)
        chunk = data_bytes[start : end + 1]
        resp = HttpResponse(chunk, status=206, content_type=content_type)
        resp['Content-Length'] = str(len(chunk))
        resp['Content-Range'] = f'bytes {start}-{end}/{total_len}'
    else:
        resp = HttpResponse(data_bytes, status=200, content_type=content_type)
        resp['Content-Length'] = str(total_len)

    resp['Accept-Ranges'] = 'bytes'
    resp['Cache-Control'] = 'public, max-age=86400'
    resp['Access-Control-Allow-Origin'] = '*'
    return resp


def serve_media_with_range(request, path):
    normalized = path.lstrip('/')
    try:
        full_path = safe_join(str(settings.MEDIA_ROOT), normalized)
    except ValueError:
        raise Http404('Invalid media path')

    # 1. Serve directly from local disk if present (with full HTTP Range support for iOS Safari)
    if os.path.isfile(full_path):
        file_size = os.path.getsize(full_path)
        content_type = _guess_mime(full_path)
        range_header = request.META.get('HTTP_RANGE', '').strip()
        match = RANGE_RE.match(range_header) if range_header else None

        if match:
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else file_size - 1
            if start >= file_size:
                resp = HttpResponse(status=416)
                resp['Content-Range'] = f'bytes */{file_size}'
                return resp
            end = min(end, file_size - 1)
            length = end - start + 1

            def file_iterator(p, offset, remaining, chunk_size=65536):
                with open(p, 'rb') as f:
                    f.seek(offset)
                    while remaining > 0:
                        chunk = f.read(min(chunk_size, remaining))
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk

            resp = StreamingHttpResponse(file_iterator(full_path, start, length), status=206, content_type=content_type)
            resp['Content-Length'] = str(length)
            resp['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        else:
            def full_iterator(p, chunk_size=65536):
                with open(p, 'rb') as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk

            resp = StreamingHttpResponse(full_iterator(full_path), status=200, content_type=content_type)
            resp['Content-Length'] = str(file_size)

        resp['Accept-Ranges'] = 'bytes'
        resp['Cache-Control'] = 'public, max-age=86400'
        resp['Access-Control-Allow-Origin'] = '*'
        return resp

    # 2. Permanent PostgreSQL fallback for voice notes (survives Render ephemeral disk wipes!)
    from apps.messaging.models import MessageAttachment

    att = MessageAttachment.objects.filter(file=normalized).exclude(file_data__isnull=True).first()
    if att and att.file_data:
        content_type = att.mime_type or _guess_mime(normalized, 'audio/mp4')
        return _build_range_response(request, bytes(att.file_data), content_type)

    raise Http404('Media file not found')
