#!/bin/sh

# args: list of programs to check for. If the command is found, print its name,
# and return 0. Otherwise, print an error message and exits with status code 1
check_cmd() {
  for i in "$@"; do
    cmd=`which $i`
    if [ $? -eq 0 ]; then
      echo "$cmd"
      return 0
    fi
  done
  echo "could not fine any of $@, install it and put it in the path. exiting."
  exit 1
}

# need ruby for the png minifier
check_cmd ruby
# need java for the closure compiler
check_cmd java
# need node for shader minification and the editor. it's called nodejs on debian-like, node on other
NODE=`check_cmd node nodejs`
