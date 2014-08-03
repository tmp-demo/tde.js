//! COMMON

precision lowp float;

uniform mat4 view_proj_mat;

uniform vec2 resolution;

uniform float near;
uniform float far;
uniform float focus;

uniform vec3 light;

uniform sampler2D texture_0;
uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform sampler2D texture_3;
uniform sampler2D texture_4;

uniform vec2 step;

uniform float clip_time;

// x: center x
// y: center y
// z: width
// w: height
uniform vec4 text_params;

uniform vec4 mask;

varying vec2 v_tex_coords;
varying vec3 v_normals;
varying vec3 v_position;

//! VERTEX
attribute vec3 position;
attribute vec3 normals;
attribute vec2 tex_coords;
