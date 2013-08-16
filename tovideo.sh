#!/bin/sh

usage() {
  echo "$0 /path/to/blob [gif|webm]"
  exit 1
}

check_program() {
  [ -z $(which $1) ] && echo "Need $1 in \$PATH to continue" && exit 1
}

test -z $1 && usage $0
test -z $2 && usage $0
check_program ffmpeg
check_program convert
check_program parallel
check_program gifsicle


# first line of blob2png is the name of the dir containing the frames.
dir=$(./blob2png $1 | head -n1)

cd $dir

if [ $2 = "gif" ]
then
  ls *.png | parallel --gnu --eta 'convert {} {.}.gif'
  time gifsicle --delay=16 --loop -O2 *.gif > ../output.gif
  exit 0
fi

if [ $2 = "webm" ]
then
   ffmpeg -i frame-%5d.png -threads 8 -g 120 -level 216 -profile 2 -rc_buf_aggressivity 0.95 -vb 2M ../output.webm
   exit 0
fi
