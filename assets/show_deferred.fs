precision lowp float;
uniform sampler2D texture_0;
uniform sampler2D texture_1;
varying vec2 v_tex_coords;

void main() {
  vec4 tex0 = texture2D(texture_0, v_tex_coords);
  vec4 tex1 = texture2D(texture_1, v_tex_coords);
  float v = v_tex_coords.y;
  if (v < 0.25) {
    gl_FragColor = vec4(tex0.xyz, 1.0);
  } else if (v < 0.50) {
    gl_FragColor = vec4(tex1.xyz, 1.0);
  } else if (v < 0.75) {
    gl_FragColor = vec4(tex1.w, tex1.w, tex1.w, 1.0);
  } else {
    gl_FragColor = vec4(tex0.xyz, 1.0);
  }
}
