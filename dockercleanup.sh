#!/bin/bash

# Delete all containers
echo "Deleting all containers"
docker rm $(docker ps -aq)

# Delete all untagged images
echo "Deleting all untagged images"
docker rmi $(docker images -q --filter "dangling=true")
