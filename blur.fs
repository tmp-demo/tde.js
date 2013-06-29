precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* resolution */
uniform vec2 res;

uniform sampler2D u_image;
uniform vec2 u_textureSize;

varying vec2 v_texCoord;

void main() {

  float col = (duration - time) / duration;
  float coef = 4.0;
  vec4 result = vec4(0.0,0.0,0.0,0.0);
  result = result + texture2D(u_image,v_texCoord );
  gl_FragColor= result / coef; 
	
  
}

