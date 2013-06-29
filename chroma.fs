precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* beat */
uniform float beat;
/* resolution */
uniform vec2 res;

uniform sampler2D u_image;
uniform vec2 u_textureSize;
varying vec2 v_texCoord;

void main(void)
{
  vec2 uv = v_texCoord.xy;

  vec4 narmol = texture2D(u_image,vec2(uv.x, uv.y));

  float displaced = 0.0;
  if (beat > 0.60) {
    displaced = beat;
  }

  vec4 redmoved = texture2D(u_image, vec2(uv.x + 4.0 * displaced / res.x, uv.y));

  gl_FragColor = vec4(redmoved.r, narmol.g, narmol.b, 1.0);
}
