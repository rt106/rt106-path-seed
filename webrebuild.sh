#!/bin/bash
# Copyright (c) General Electric Company, 2017.  All rights reserved.

echo ""
echo "Removing web container."
docker rm rt106pathseed_seed_1

echo ""
echo "Removing web image."
docker rmi rt106/rt106-path-seed

echo ""
echo "Building web image."
docker build -t rt106/rt106-path-seed  --build-arg http_proxy=$http_proxy --build-arg https_proxy=$https_proxy  .

echo ""
docker images
