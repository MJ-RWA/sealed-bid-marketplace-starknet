from django.apps import AppConfig

class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'
    
    def ready(self):
        pass # We moved the logic to wsgi.py