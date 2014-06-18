//! COMMON

// TODO the hard-coded far plane is a bit lame
#define FAR_DIST 50.0

precision lowp float;

uniform mat4 view_proj_mat;

uniform vec2 resolution;

uniform sampler2D texture_0;
uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform sampler2D texture_3;
uniform sampler2D texture_4;

uniform vec2 step;

uniform float demo_time;
uniform float clip_time;

varying vec2 v_tex_coords;
varying vec3 v_normals;
varying vec3 v_position;

//! VERTEX
attribute vec3 position;
attribute vec3 normals;
attribute vec2 tex_coords;

//! FRAGMENT
#extension GL_EXT_draw_buffers : require
#define NB_BLUR_TAPS 10.0
