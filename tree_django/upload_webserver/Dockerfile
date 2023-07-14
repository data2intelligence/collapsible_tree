FROM rockylinux:8

RUN yum -y install epel-release; yum clean all
RUN dnf module -y install python38; dnf -y install which python38-devel gcc-c++; yum clean all

RUN pip3.8 install --upgrade pip setuptools wheel
RUN pip3.8 install pipenv

# this makes Pipenv happy
ENV LANG en_US.UTF-8

RUN mkdir -p /var/www/webapps
RUN mkdir /db

WORKDIR /var/www/webapps/upload_example

ADD Pipfile Pipfile.lock ./

# -- Install dependencies:
# --deploy will fail the build if the Pipfile.lock is out-of-date.
# --system will tell Pipenv to install the Pipfile's contents into the
# system Python installation.
RUN pipenv install --deploy --system --dev

ADD . ./

# run Django migrations
RUN python3.8 manage.py migrate

EXPOSE 8000
