  precision lowp float;
  /* relative to scene start time */
  uniform float time;
  /* scene duration */
  uniform float duration;
  /* resolution */
  uniform vec2 res;

  void main() {
    float col = (duration - time) / duration;
    gl_FragColor = vec4(cos(gl_FragCoord.x * col * 65366.0 * col),
                        sin(gl_FragCoord.y * col * 65366.0 * col),
                        tan(gl_FragCoord.x * col * 65366.0),
                        1.0);
  }
