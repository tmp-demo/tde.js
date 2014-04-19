precision lowp float;
uniform float time;
uniform float duration;
uniform float beat;
uniform vec2  resolution;
uniform sampler2D texture_0;
varying vec2 v_tex_coords;
//varying vec3 v_normals;

void main() {
  gl_FragColor = texture2D(texture_0, v_tex_coords);
  //gl_FragColor = vec4(v_tex_coords, 0.0, 1.0);
  //gl_FragColor = vec4(v_normals, 1.0);
}
