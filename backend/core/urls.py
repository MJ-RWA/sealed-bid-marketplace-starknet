from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView # Add this

urlpatterns = [
    # Map the root domain directly to /admin/
    path('', RedirectView.as_view(url='admin/', permanent=True)),
    
    path('admin/', admin.site.urls),
    path('api/', include('marketplace.urls')),
]