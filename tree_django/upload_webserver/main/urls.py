from django.urls import path
from . import views

app_name = 'main'

urlpatterns = [
    path('', views.upload_page, name='upload_page'),
    path('doc/', views.markdown_view, name ='markdown_view'),

]
