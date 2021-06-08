#!/bin/bash

set -e # exit on error

print(){
  printf "\033[1;95m%s\033[0m\n" "$1"
}


if [ -z $1 ]; then
  print "Error: username not provided"
  print "Usage: $0 username"
  exit 1
fi

print "Changing directory to ${0%/*}"
cd "${0%/*}"

USERNAME=$1
print "Using username $1"

URL_PREFIX="https://cs.hmc.edu/~$USERNAME/jsLDA/"
printf "Website will be deployed under \033[1;95m%s\033[0m\n" "$URL_PREFIX"

if [ -d build ]; then
  print "Removing previous build directory"
  rm -r build/
fi

print "Running react-scripts build"
PUBLIC_URL=$URL_PREFIX "$(npm bin)/react-scripts" build

print "Deploying to server"
rsync -rauv build/ "$USERNAME@cs.hmc.edu:~/public_html/jsLDA/"

print "Removing build directory"
rm -r build/

print "Restoring previous working directory"
cd - > /dev/null

print "Done"
