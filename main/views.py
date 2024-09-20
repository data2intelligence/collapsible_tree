# main/views.py
from django.shortcuts import render

def home(request):
    return render(request, 'main/collapsible_tree.html')
