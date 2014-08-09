//! COMMON

/** IMPORTANT **/
/** Please maintain the lists in gfx.js if you update this file **/

precision lowp float;

uniform vec3 cam_pos;
uniform mat4 view_proj_mat;
uniform mat4 view_proj_mat_inv;

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

/*
badge:
	x: center x
	y: center y
	z: half size
	w: angle

text:
	x: center x
	y: center y
	z: half height
	w: aspect ratio
*/
uniform vec4 text_params;

uniform vec4 mask;

uniform float glitch;

varying vec2 v_tex_coords;
varying vec3 v_normals;
varying vec3 v_position;

//! VERTEX
attribute vec3 position;
attribute vec3 normals;
attribute vec2 tex_coords;
