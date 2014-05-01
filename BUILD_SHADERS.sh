#!/bin/sh

echo " -- concatenating all shader programs"
rm -rf ./export/shaders
mkdir -p ./export/shaders

# common glsl code
for f in  ./public/shaders/*.glsllib
do
    cp $f ./export/shaders
done

# programs
for f in  ./public/shaders/*.glsl
do
    cat $f >> ./export/shaders/all.glsl
done

# uncomment when working on the minifier
#(cd 'D:/proj/glsl-unit/' && ./BUILD.sh) && cp 'D:/proj/glsl-unit/bin/custom_template_glsl_compiler.js' ./tools

echo " -- minifying"
node ./tools/custom_template_glsl_compiler --input=export/shaders/all.glsl --variable_renaming=INTERNAL --output=export/shaders/all.min.glsl > ./export/shaders/loading_code.js

echo " -- exporting js code"

echo "var vs_shader_source='"`cat export/shaders/all.min.glsl | head -3 | tail -1`"'" >> ./export/shaders/shaders.js
echo "var fs_shader_source='"`cat export/shaders/all.min.glsl | head -5 | tail -1`"'" >> ./export/shaders/shaders.js
echo "programs = {}" >> ./export/shaders/shaders.js
echo "function load_shaders()" >> ./export/shaders/shaders.js
echo "{" >> ./export/shaders/shaders.js
cat ./export/shaders/loading_code.js >> ./export/shaders/shaders.js
echo "}" >> ./export/shaders/shaders.js

wc -c ./export/shaders/shaders.js
