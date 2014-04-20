#!/bin/sh

mkdir -p ./export/assets
rm -rf ./export/*.js
rm -rf ./export/*.fs
rm -rf ./export/*.vs
wc -c *.js
for f in  *.js
do
    ./opt.py $f >> ./export/demo.js
done
wc -c ./export/demo.js
cp -r ./assets/*.fs ./export/assets/
cp -r ./assets/*.vs ./export/assets/
