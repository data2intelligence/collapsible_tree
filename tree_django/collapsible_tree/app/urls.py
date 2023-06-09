
from django.urls import path
from .views import ProcessInput

urlpatterns = [
    path('', ProcessInput.as_view(),name='ProcessInput'),
]
