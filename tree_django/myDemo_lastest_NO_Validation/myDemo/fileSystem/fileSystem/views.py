# -*- coding:utf-8 -*-

import csv
from django.shortcuts import render
from io import StringIO

def upload_csv(request):
    if request.method == 'POST':
        csv_file = request.FILES.get('csv_file')
        if csv_file:
            data = []
            decoded_file = csv_file.read().decode('utf-8')
            IO_file = StringIO(decoded_file)
            for row in csv.DictReader(IO_file):
                data.append(dict(row))
            print(data)  # [{'id': '11', 'name': 'andy', 'age': '18'}, {'id': '22', 'name': 'jay', 'age': '23'}]
            return render(request, 'tree_visualization.html', {'data': data})
    return render(request, 'upload_csv.html')


