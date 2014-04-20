#!/bin/sh

echo " -- preparing..."
mkdir -p ./export/assets
rm -rf ./export/*.js
rm -rf ./export/*.fs
rm -rf ./export/*.vs
mkdir -p tools

echo " -- concatenating js files and stripping debug code..."

for f in  *.js
do
    ./opt.py $f >> ./export/demo.js
done
echo "window.onload=main;" >> ./export/demo.js

echo " -- copying assets..."
cp -r ./assets/*.fs ./export/assets/
cp -r ./assets/*.vs ./export/assets/
cp -r ./assets/*.png ./export/assets/
cp -r ./assets/*.jpg ./export/assets/
cp -r ./assets/*.ogg ./export/assets/

if [ ! -f tools/compiler.jar ]; then
    echo " -- tools/compiler.jar not found, now downloading it..."
    wget -O tools/compiler-latest.zip "http://dl.google.com/closure-compiler/compiler-latest.zip"
    cd tools && unzip compiler-latest.zip
fi

echo " -- running the clojure compiler..."
java -jar tools/compiler.jar --js=./export/demo.js --js_output_file=./export/demo_min.js --compilation_level=ADVANCED_OPTIMIZATIONS --externs ./export/externs

if [ ! -f tools/pnginator.rb ]; then
    echo " -- tools/pnginator.rb not found, now downloading it..."
    wget -O tools/pnginator.rb "https://gist.githubusercontent.com/gasman/2560551/raw/f589cb80cca2ad7a7169cb75a2b7f3e03be16c4d/pnginator.rb"
fi

echo " -- packing in a png..."
ruby tools/pnginator.rb export/demo_min.js export/demo.png.html

echo " -- done."
wc -c *.js
wc -c ./export/demo.js
wc -c ./export/demo_min.js
wc -c ./export/demo.png.html
