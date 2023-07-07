from django.db import models
from django.core.validators import FileExtensionValidator

# Create your models here.

class CSVUpload(models.Model):
    dataset_title = models.CharField(max_length=150,  null=True)
    search_gene = models.CharField(max_length=25, null= False)
    csv_file = models.FileField(null=True,
                                blank=True,
                                validators=[FileExtensionValidator(['csv'])])

    def __str__(self):
        return self.dataset_title

