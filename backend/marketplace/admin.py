from django.contrib import admin
from .models import Job, Bid

# To show us the Job and Bid data in django admin
admin.site.register(Job)
admin.site.register(Bid)