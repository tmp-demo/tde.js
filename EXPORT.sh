#!/bin/sh

. ./utils.sh

echo " -- preparing..."
rm -rf ./export
mkdir -p ./export
mkdir -p tools

echo " -- building shaders"
./BUILD_SHADERS.sh

echo " -- concatenating js files and stripping debug code..."

for f in  ./public/js/engine/*.js
do
    ./tools/opt.py $f >> ./export/demo.js
done
cat ./export/shaders/shaders.js >> ./export/demo.js
echo "window.onload=main;" >> ./export/demo.js

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

wc -c *.js ./export/shaders/shaders.js
wc -c ./export/demo.js
wc -c ./export/demo_min.js
wc -c ./export/demo.png.html
