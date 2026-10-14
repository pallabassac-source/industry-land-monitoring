import threading
import logging
from .utils_drone import process_drone_geotiff

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
    
    @shared_task(name="process_drone_geotiff_task")
    def process_drone_geotiff_task(layer_id, tif_path, delete_source=False):
        """
        Celery shared task to process GeoTIFF into multi-resolution XYZ tiles.
        """
        logger.info(f"Celery worker processing drone survey layer ID: {layer_id}")
        return process_drone_geotiff(layer_id, tif_path, delete_source)

except Exception:
    shared_task = None


def dispatch_drone_tiling_job(layer_id, tif_path, delete_source=False):
    """
    Dispatches tiling job via Celery if available, otherwise runs in background thread.
    """
    try:
        if shared_task:
            process_drone_geotiff_task.delay(layer_id, tif_path, delete_source)
            logger.info(f"Dispatched Celery task for drone layer {layer_id}")
            return "celery"
    except Exception as e:
        logger.warning(f"Could not dispatch via Celery ({e}), falling back to background thread.")

    # Fallback to threading
    thread = threading.Thread(
        target=process_drone_geotiff,
        args=(layer_id, tif_path, delete_source),
        daemon=True
    )
    thread.start()
    logger.info(f"Started background thread for drone layer {layer_id}")
    return "thread"
