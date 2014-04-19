precision lowp float;
uniform sampler2D texture_0;
varying vec2 v_tex_coords;
varying vec3 v_normals;

void main() {
  gl_FragColor = vec4(0.5*v_normals+vec3(0.5,0.5,0.5), 1.0);
}
