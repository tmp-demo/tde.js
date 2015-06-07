#!/bin/sh

if [ $# -lt "1" ]; then
  echo "Usage: $0 <project name>"
  exit 1
fi

PROJECT=$1
PROJECT_ROOT=./data/$PROJECT
SHADER_EXPORT_ROOT=./export/$PROJECT/shaders

. ./utils.sh

echo " -- concatenating all shader programs"
rm -rf "$SHADER_EXPORT_ROOT"
mkdir -p "$SHADER_EXPORT_ROOT"

# common glsl code
for f in  $PROJECT_ROOT/*.glsllib
do
    cp $f $SHADER_EXPORT_ROOT
done

USED_SHADER_PROGRAMS=`"$NODE" ./tools/parse-rendergraph-dependencies $PROJECT_ROOT/demo.rg`

# programs
for f in  $USED_SHADER_PROGRAMS
do
    echo $f
    echo "//" $f >> $SHADER_EXPORT_ROOT/all.glsl
    cat $PROJECT_ROOT/$f >> $SHADER_EXPORT_ROOT/all.glsl
done

# uncomment when working on the minifier
# (cd 'D:/proj/glsl-unit/' && ./BUILD.sh) && cp 'D:/proj/glsl-unit/bin/custom_template_glsl_compiler.js' ./tools

echo " -- minifying"
"$NODE" ./tools/custom_template_glsl_compiler --input=$SHADER_EXPORT_ROOT/all.glsl --variable_renaming=INTERNAL --output=$SHADER_EXPORT_ROOT/all.min.glsl > $SHADER_EXPORT_ROOT/loading_code.js

echo " -- exporting js code"

# vertex shader
echo -n "var vs_shader_source='" >> $SHADER_EXPORT_ROOT/shaders.js
cat $SHADER_EXPORT_ROOT/all.min.glsl | head -3 | tail -1 | tr -d '\r\n' >> $SHADER_EXPORT_ROOT/shaders.js
echo "'" >> $SHADER_EXPORT_ROOT/shaders.js

# fragment shader
echo -n "var fs_shader_source='" >> $SHADER_EXPORT_ROOT/shaders.js
cat $SHADER_EXPORT_ROOT/all.min.glsl | head -5 | tail -1 | tr -d '\r\n' >> $SHADER_EXPORT_ROOT/shaders.js
echo "'" >> $SHADER_EXPORT_ROOT/shaders.js

# loading code
echo "function load_shaders()" >> $SHADER_EXPORT_ROOT/shaders.js
echo "{" >> $SHADER_EXPORT_ROOT/shaders.js
cat $SHADER_EXPORT_ROOT/loading_code.js >> $SHADER_EXPORT_ROOT/shaders.js
echo "}" >> $SHADER_EXPORT_ROOT/shaders.js

wc -c $SHADER_EXPORT_ROOT/shaders.js
