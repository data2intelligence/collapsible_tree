from django.shortcuts import render
from django.views.generic import View
from .forms import CSVUploadForm
import json

class ProcessInput(View):
    # def upload_view(request):
    #     form = UploadForm()
    #     return render(request, 'upload.html', {'form': form})
    def post(request):
        if request.method == 'POST':
            form = CSVUploadForm(request.POST, request.FILES)
            if form.is_valid():
                csv_file = form.cleaned_data['csv_file']
                json_data= json.dumps(csv_file)

                return render(request, 'tree_visualization.html', {'json_data':json_data})
        else:
            form = CSVUploadForm()

        return render(request, 'upload.html',{'form':form})

