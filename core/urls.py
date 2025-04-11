from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.UploadView.as_view(), name='upload'),
    path('api/upload/', views.ProcessImagesView.as_view(), name='api_upload'),
    # No result polling URL needed
]