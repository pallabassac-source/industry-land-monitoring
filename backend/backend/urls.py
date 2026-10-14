import os
import redis
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse

_redis_client = None
def get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            redis_url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
            _redis_client = redis.Redis.from_url(redis_url)
        except Exception:
            _redis_client = False
    return _redis_client if _redis_client is not False else None

def cached_media_serve(request, path, document_root=None, show_indexes=False):
    is_tile = path.startswith('drone_tiles/') and path.endswith('.png')
    r = get_redis() if is_tile else None
    cache_key = f"tile_cache:{path}" if (r and is_tile) else None

    if cache_key:
        try:
            cached_data = r.get(cache_key)
            if cached_data:
                res = HttpResponse(cached_data, content_type='image/png')
                res['Cache-Control'] = 'public, max-age=31536000, immutable'
                res['Access-Control-Allow-Origin'] = '*'
                res['Timing-Allow-Origin'] = '*'
                res['X-Cache'] = 'HIT-REDIS'
                return res
        except Exception:
            pass

    response = serve(request, path, document_root=document_root, show_indexes=show_indexes)
    
    if path.startswith('drone_tiles/') or path.endswith(('.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff')):
        response['Cache-Control'] = 'public, max-age=31536000, immutable'
        response['Access-Control-Allow-Origin'] = '*'
        response['Timing-Allow-Origin'] = '*'
        response['X-Cache'] = 'MISS-DISK'

    if cache_key and response.status_code == 200:
        try:
            content = getattr(response, 'content', None)
            if content and len(content) < 500000:
                r.setex(cache_key, 86400 * 7, content)
        except Exception:
            pass

    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^media/(?P<path>.*)$', cached_media_serve, {'document_root': settings.MEDIA_ROOT}),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
