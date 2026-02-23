from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('marketplace.urls')), # This connects your marketplace to /api/
]