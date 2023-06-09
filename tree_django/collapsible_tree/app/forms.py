from django import forms
import csv

class CSVUploadForm(forms.Form):
    csv_file = forms.FileField(label='CSV File')

    def clean_csv_file(self):
        csv_file = self.cleaned_data['csv_file']

        # form validation
        try:
            reader = csv.reader(csv_file)
            unique_values = set()
            has_duplicates = False

            for i, row in enumerate(reader):
                if i == 0:
                    # check header row
                    continue

                else:
                    parent = row['parent'].strip()
                    child_id = row['id'].strip()
                    size = row['size'].strip()
                    # value = row['Value'].strip()

                    if not parent and child != 'Root':
                        raise forms.ValidationError(f"Parent column is required in row {i+1}")
                     
                    if not size.isdigit():
                        raise forms.ValidationError(f"Invalid size in row {i+1}, it should be an integer.")

                    if child_id in unique_values:
                        has_duplicates = True
                        break
                    unique_values.add(child_id)

                    excluded_col_list = ['parent','id','size']


                    # if not value.isdigit():
                    #     raise forms.ValidationError(f"Invalid value in row {i+1}")
            if has_duplicates:
                raise forms.ValidationError("Id column shouldn't have duplicates")


        except csv.Error as e:
            raise forms.ValidationError("Error processing CSV file")

        return csv_file
