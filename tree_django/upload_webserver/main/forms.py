from django import forms
from .models import CSVUpload
import csv


# Create your forms here.
class CSVUploadForm(forms.ModelForm):
        class Meta:
            model = CSVUpload
            fields = ('dataset_title','search_gene','icon_folder','csv_file')
        