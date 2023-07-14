from django.db import models
from django.core.validators import FileExtensionValidator


class CSVUpload(models.Model):
    dataset_title = models.CharField(max_length=150, null= True)
    search_gene = models.CharField(verbose_name = 'Column name', help_text = 'Enter the column name of which value you want to display.',max_length=25)
    icon_folder = models.CharField(verbose_name = 'URL to icon folder (Optional)',max_length=250, blank=True)

    csv_file = models.FileField(null = True,
                                blank=True,
                                validators=[FileExtensionValidator(['csv'])])

    def __str__(self):
        return self.dataset_title

