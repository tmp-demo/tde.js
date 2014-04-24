#!/bin/sh

echo " -- preparing..."
rm -rf ./export
mkdir -p ./export/assets
mkdir -p tools

echo " -- concatenating js files and stripping debug code..."

for f in  *.js
do
    ./opt.py $f >> ./export/demo.js
done
echo "window.onload=main;" >> ./export/demo.js

echo " -- copying assets..."
cp -r ./assets/*.* ./export/assets/

if [ ! -f tools/compiler.jar ]; then
    echo " -- tools/compiler.jar not found, now downloading it..."
    wget -O tools/compiler-latest.zip "http://dl.google.com/closure-compiler/compiler-latest.zip"
    cd tools && unzip compiler-latest.zip
fi

echo " -- running the closure compiler..."
java -jar tools/compiler.jar --js=./export/demo.js --js_output_file=./export/demo_min.js --compilation_level=ADVANCED_OPTIMIZATIONS --externs ./externs/w3c_audio.js

echo " -- packing in a png..."
ruby tools/pnginator.rb export/demo_min.js export/demo.png.html

echo " -- done."

cp minified.html export/minified.html

wc -c *.js
wc -c ./export/demo.js
wc -c ./export/demo_min.js
wc -c ./export/demo.png.html
