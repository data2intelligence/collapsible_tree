from django.shortcuts import render, redirect
from django.conf import settings
from .models import CSVUpload
from .forms import CSVUploadForm
from django import forms
from django.contrib import messages
import csv
from io import TextIOWrapper, StringIO
import markdown
import os


def upload_page(request):
    csv_form = CSVUploadForm()  # Assign an initial value to csv_form
    csv_file = forms.FileField()

    if request.method == "POST":
        CSVUpload.objects.all().delete()
        csv_form = CSVUploadForm(request.POST, request.FILES)

        if csv_form.is_valid():  
            dataset_title = csv_form.cleaned_data['dataset_title']
            search_column = csv_form.cleaned_data['search_column']
            icon_folder = csv_form.cleaned_data['icon_folder']
            csv_file = request.FILES['csv_file']
            decoded_file = csv_file.read().decode('utf-8')
            IO_file = StringIO(decoded_file)
            reader = csv.DictReader(IO_file)

            unique_values = []
            has_duplicates = False
            error_count = 0
            data = []

            for i, row in enumerate(reader):

                parent = row['parent'].strip()
                child_id = row['id'].strip()
                size = row['celltype_size'].strip()

                if not parent and child_id != 'Root':
                    messages.error(request, "Error: Root node should have 'null' for 'parent' column.")
                    error_count+=1
                
                if size and not is_number(size):
                        messages.error(request, f"Error: Invalid value for column 'size' in row {i+1}. We expect a number for this column.")
                        error_count+=1

                if child_id in unique_values:
                    has_duplicates = True

                    if has_duplicates:
                        messages.error(request, f"Error: 'id' column shouldn't have duplicates. Duplicates found in row {i+1}")
                        error_count+=1
         
                unique_values.append(child_id)
                data.append(dict(row))

            if error_count == 0:
                messages.success(request, (f"Congradualations! \n Your data file named '{dataset_title}' was successfully added!"))
                return render(request, 'main/tree_visualization.html',
                 {'dataset_title':dataset_title, 'search_column':search_column, 'icon_folder':icon_folder,'data': data})
                
            else:
                return render(request=request, template_name="main/upload.html", context={'csv_form': csv_form, 'csv_file': csv_file})
    

    return render(request=request, template_name="main/upload.html", context={'csv_form': csv_form, 'csv_file': csv_file})

def markdown_view(request):
    path_to_md = os.path.join(settings.STATICFILES_DIRS[0], 'markdown/help_doc.md')
    with open(path_to_md, 'r') as file:  
        markdown_content = file.read()
        html_content = markdown.markdown(markdown_content)
    return render(request, 'main/markdown_view.html', {'content': html_content})


def is_number(value):
    try:
        int_value = int(value)
        return True
    except ValueError:
        try:
            float_value = float(value)
            return True
        except ValueError:
            return False