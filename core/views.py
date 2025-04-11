from django.shortcuts import render
from django.views.generic import TemplateView, View
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import os
import pytesseract # Import for exception handling

from .models import ProcessedImage
from .services import preprocess_image, perform_ocr, enhance_with_gemini, merge_results

class UploadView(TemplateView):
    template_name = 'core/upload.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Enhanced OCR Upload (Sync)'
        return context

@method_decorator(csrf_exempt, name='dispatch')
class ProcessImagesView(View):
    def post(self, request, *args, **kwargs):
        if not request.FILES:
            return HttpResponseBadRequest("No files were uploaded.")

        uploaded_files = request.FILES.getlist('images')
        results = []

        for uploaded_file in uploaded_files:
            image_instance = None # Ensure instance is defined for finally block
            try:
                # 1. Create DB record (initially PENDING)
                image_instance = ProcessedImage.objects.create(
                    image=uploaded_file,
                    original_filename=uploaded_file.name,
                    status=ProcessedImage.StatusChoices.PENDING
                )

                image_path = image_instance.image.path
                print(f"Processing image ID {image_instance.id} at path {image_path}")

                if not os.path.exists(image_path):
                    raise FileNotFoundError(f"Image file not found at {image_path}")

                # --- Start Synchronous Processing ---
                preprocessed_data = preprocess_image(image_path)
                tesseract_text = perform_ocr(preprocessed_data)
                gemini_text = enhance_with_gemini(image_path, tesseract_text)
                final_text = merge_results(tesseract_text, gemini_text)
                # --- End Synchronous Processing ---

                # Update instance with results
                image_instance.tesseract_text = tesseract_text
                image_instance.gemini_text = gemini_text
                image_instance.final_text = final_text
                image_instance.status = ProcessedImage.StatusChoices.COMPLETED
                image_instance.processed_at = timezone.now()
                image_instance.save()

                results.append({
                    'id': image_instance.id,
                    'status': image_instance.status,
                    'imageUrl': image_instance.image.url,
                    'filename': image_instance.original_filename,
                    'finalText': image_instance.final_text,
                    'error': None
                })
                print(f"Successfully processed image ID {image_instance.id}")

            except (FileNotFoundError, pytesseract.TesseractNotFoundError, Exception) as e:
                print(f"Error processing file {uploaded_file.name}: {e}")
                error_message = f"Processing failed: {e}"
                status = ProcessedImage.StatusChoices.FAILED

                # If instance was created, update it with error status
                if image_instance and image_instance.pk:
                    image_instance.status = status
                    image_instance.final_text = error_message # Store error in final_text
                    image_instance.processed_at = timezone.now()
                    image_instance.save()
                    results.append({
                        'id': image_instance.id,
                        'status': status,
                        'imageUrl': image_instance.image.url if image_instance.image else None,
                        'filename': image_instance.original_filename,
                        'finalText': None,
                        'error': error_message
                    })
                else:
                    # If instance creation failed or happened before error
                    results.append({
                        'id': None, # No ID if instance creation failed
                        'status': status,
                        'imageUrl': None,
                        'filename': uploaded_file.name,
                        'finalText': None,
                        'error': error_message
                    })

        return JsonResponse({'results': results}) # Return all results at once