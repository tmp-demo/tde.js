#!/bin/sh

echo " -- preparing..."
mkdir -p ./export/assets
rm -rf ./export/*.js
rm -rf ./export/*.fs
rm -rf ./export/*.vs

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

echo " -- running the clojure compiler..."
#java -jar compiler.jar --js=./export/demo.js --js_output_file=./export/demo_min.js --compilation_level=ADVANCED_OPTIMIZATIONS --externs ./export/externs
java -jar compiler.jar --js=./export/demo.js --js_output_file=./export/demo_min.js --externs ./export/externs

echo " -- packing in a png..."
ruby pnginator.rb export/demo_min.js export/demo.png.html

echo " -- done."
wc -c *.js
wc -c ./export/demo.js
wc -c ./export/demo_min.js
wc -c ./export/demo.png.html
