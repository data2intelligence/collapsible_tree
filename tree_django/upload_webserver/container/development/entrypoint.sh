#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/../..

export DJANGO_SETTINGS_MODULE=upload_example.settings

while true ; do
    # if the server crashed due to a syntax error or something, restart it in
    # this loop
    python3 manage.py runserver 0.0.0.0:8000;
    sleep 3;
done
