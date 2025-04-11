import os
from django.db import models
from django.utils import timezone
from uuid import uuid4

def get_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid4()}.{ext}"
    return os.path.join('uploads/', filename)

class ProcessedImage(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending' # Initial state before processing starts in view
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.AutoField(primary_key=True)
    image = models.ImageField(upload_to=get_upload_path)
    original_filename = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
        db_index=True
    )
    tesseract_text = models.TextField(blank=True, null=True)
    gemini_text = models.TextField(blank=True, null=True)
    final_text = models.TextField(blank=True, null=True) # Merged result or error message
    uploaded_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(blank=True, null=True) # Set when processing finishes

    def __str__(self):
        return f"Image {self.id} ({self.original_filename}) - {self.status}"

    def save(self, *args, **kwargs):
        if self.pk is None and self.image:
             if not self.original_filename:
                 self.original_filename = os.path.basename(self.image.name)
        super().save(*args, **kwargs)