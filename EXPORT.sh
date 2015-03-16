#!/bin/bash

if [ $# -lt "1" ]; then
  echo "Usage: $0 <project name>"
  exit 1
fi

PROJECT=$1
PROJECT_ROOT=./data/$PROJECT
EXPORT_ROOT=./export/$PROJECT

. ./utils.sh

echo " -- preparing..."
rm -rf "$EXPORT_ROOT"
mkdir -p "$EXPORT_ROOT"
mkdir -p tools

echo " -- building shaders"
./BUILD_SHADERS.sh $PROJECT

echo " -- concatenating js files and stripping debug code..."

for f in  ./public/engine/*.js
do
    ./tools/opt.py $f >> $EXPORT_ROOT/demo.js
done

echo " -- checking config file"
CONFIG=($PROJECT_ROOT/config.js)
if [ -f $CONFIG ]; then
  echo " -- found config file:"
  cat $CONFIG
  cat $CONFIG >> $EXPORT_ROOT/demo.js
fi

cat $EXPORT_ROOT/shaders/shaders.js >> $EXPORT_ROOT/demo.js

echo " -- exporting texture assets"
echo "function load_textures() {" >> $EXPORT_ROOT/demo.js
TEXTURES=($PROJECT_ROOT/*.tex)
if [ -f $TEXTURES ]; then
  "$NODE" ./tools/export-textures.js $PROJECT_ROOT/*.tex >> $EXPORT_ROOT/demo.js
fi
echo "} // load_textures" >> $EXPORT_ROOT/demo.js

echo " -- exporting geometry assets"
echo "function load_geometries() {" >> $EXPORT_ROOT/demo.js
GEOMETRIES=($PROJECT_ROOT/*.geom)
if [ -f $GEOMETRIES ]; then
  "$NODE" ./tools/export-geometries.js $PROJECT_ROOT/*.geom >> $EXPORT_ROOT/demo.js
fi
echo "}" >> $EXPORT_ROOT/demo.js

echo " -- exporting scene assets"
echo "function load_scenes() {" >> $EXPORT_ROOT/demo.js
SCENES=($PROJECT_ROOT/*.scene)
if [ -f $GEOMETRIES ]; then
  "$NODE" ./tools/export-scenes.js $PROJECT_ROOT/*.scene >> $EXPORT_ROOT/demo.js
fi
echo "}" >> $EXPORT_ROOT/demo.js

echo " -- exporting sequence assets"
SEQUENCES=($PROJECT_ROOT/*.seq)
if [ -f $SEQUENCES ]; then
  "$NODE" ./tools/export-sequences.js $PROJECT_ROOT/*.seq >> $EXPORT_ROOT/demo.js
fi

echo " -- exporting ogg tracks"
cp $PROJECT_ROOT/*.ogg $EXPORT_ROOT

# for f in  $PROJECT_ROOT/*.song
# do
#     ./tools/opt.py $f | sed "s/'\\(SND\\.[A-Za-z]*\\)'/\\1/g" >> $EXPORT_ROOT/demo.js
# done

#cat $PROJECT_ROOT/song.song >> $EXPORT_ROOT/demo.js

echo "onload=main;" >> $EXPORT_ROOT/demo.js

if [ ! -f tools/compiler.jar ]; then
    echo " -- tools/compiler.jar not found, now downloading it..."
    wget -O tools/compiler-latest.zip "http://dl.google.com/closure-compiler/compiler-latest.zip"
    (cd tools && unzip compiler-latest.zip compiler.jar)
fi

echo " -- running the closure compiler..."
java -jar tools/compiler.jar --js=$EXPORT_ROOT/demo.js --js_output_file=$EXPORT_ROOT/demo.min.js --create_source_map $EXPORT_ROOT/demo.min.js.map --compilation_level=ADVANCED_OPTIMIZATIONS --externs ./externs/w3c_audio.js
"$NODE" ./tools/unminify-from-source-map.js $EXPORT_ROOT/demo.min.js.map > $EXPORT_ROOT/demo.unmin.js

echo " -- packing expensive symbols"
#"$NODE" ./tools/symbol-minifier $EXPORT_ROOT/demo.min.js > $EXPORT_ROOT/demo.min2.js
#cp $EXPORT_ROOT/demo.min.js $EXPORT_ROOT/demo.min2.js

echo " -- compressing some keywords"
# for some reason replacing '@' by 'function ' breaks the demo while 'function' (without the space) works
#sed -i 's/function(/function (/g' $EXPORT_ROOT/demo.min2.js
#sed -i 's/function/@/g' $EXPORT_ROOT/demo.min2.js
#sed -i 's/return/`/g' $EXPORT_ROOT/demo.min2.js
#sed -i 's/var/~/g' $EXPORT_ROOT/demo.min2.js

#cat $EXPORT_ROOT/demo.min2.js | egrep -o '[a-zA-Z0-9]{2,}' | sort | uniq -c | sort -nr > $EXPORT_ROOT/word_frequencies

#echo " -- packing in a png..."
ruby tools/pnginator.rb $EXPORT_ROOT/demo.min.js $EXPORT_ROOT/demo.png.html

echo " -- creating runner"
echo "<script src='demo.min.js'></script>" > $EXPORT_ROOT/demo.min.html

echo " -- done."

wc -c *.js $EXPORT_ROOT/shaders/shaders.js
wc -c $EXPORT_ROOT/demo.js
#wc -c $EXPORT_ROOT/demo.min.js
#wc -c $EXPORT_ROOT/demo.png.html
