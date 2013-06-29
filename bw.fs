precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
uniform float beat;
/* resolution */
uniform vec2 res;

void main() {
  float col = (duration - time) / duration;
  gl_FragColor = vec4(beat * cos(gl_FragCoord.x * col * 65366.0 * col),
                      beat * sin(gl_FragCoord.y * col * 65366.0 * col),
                      beat * tan(gl_FragCoord.x * col * 65366.0),
                      1.0 - beat * 0.5);
}

