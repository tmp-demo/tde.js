precision lowp float;
uniform sampler2D texture_0;
uniform sampler2D texture_1;

uniform float time;
uniform float duration;
uniform float beat;
uniform vec2 resolution;

//uniform vec3 u_color;
#define u_color vec3(0.7,0.0,0.0)

varying vec2 v_tex_coords;
varying vec3 v_position;
varying vec3 v_normals;

float edgeDetection(in vec2 coords){
  float dxtex = 1.0 / resolution.x;
  float dytex = 1.0 / resolution.y;

  float depth0 = texture2D(texture_1, coords).a;
  float depth1 = texture2D(texture_1, coords + vec2(dxtex,0.0)).a;
  float depth2 = texture2D(texture_1, coords + vec2(0.0,-dytex)).a;
  float depth3 = texture2D(texture_1, coords + vec2(-dxtex,0.0)).a;
  float depth4 = texture2D(texture_1, coords + vec2(0.0,dytex)).a;

  float ddx = abs((depth1 - depth0) - (depth0 - depth3));
  float ddy = abs((depth2 - depth0) - (depth0 - depth4));
  return clamp(
    clamp((ddx + ddy - 0.5) * 0.5, 0.0, 1.0)/(depth0 * 0.02),
    -1.0, 1.0
  );
}

void main (void){
  gl_FragColor = mix(
    texture2D(texture_0, v_tex_coords),
    vec4(u_color, 1.0),
    edgeDetection(v_tex_coords)
  );
}
