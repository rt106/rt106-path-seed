# rt106-path-seed
Seed application for pathology.

_Copyright (c) General Electric Company, 2017.  All rights reserved._

### To build the Docker image

To build the docker container for the path seed:

    $ docker build -t rt106/rt106-path-seed:latest .

If you use HTTP proxies in your environment, you may need to build using

    $ docker build -t rt106/rt106-path-seed:latest  --build-arg http_proxy=$http_proxy --build-arg https_proxy=$https_proxy  --build-arg no_proxy=$no_proxy .

### Configuring a database

The file-based Rt. 106 datastore (rt106-datastore-local) uses a prescribed
directory structure:

* datastore *(or a directory name of your choice)*
  - Slides
    * _(slide name)_
      * _(region name)_
        * Source
          * _(channel name)_
            * _(image file)_
        * _(analysis / pipeline identifier)_
          * _(execution identifier)_
            * _(result file)_

If you organize your image files according to this directory hierarchy, specifically, the ```Slides/(slide name)/(region_name)/Source/(channel name)/(image file)``` paths, then Rt 106 can serve your data using a rt106-datastore-local. Algorithm results data will be added automatically to the ```Slides/(slide name)/(region_name)/(analysis identifier)/(execution identifier)/(result file)``` paths when algorithms are run.

### Downloading demo data (optional)

A preconfigured datastore for pathology with a directory structure rt106-datastore-local expects can be downloaded from the [THRIVE website](http://www.csb.pitt.edu/ith/data.html). Simply download and expand the archive *pathology_sample_data.zip*.

### Configuring local environment

Create a file called ```.env``` and set the path to your local datastore

```
LOCAL_DATA_DIR=/PathToLocalDatastore
```

### To run the path seed application

To run the path seed application

```
$ docker-compose up
```

Web pages for the application are served on port 81
