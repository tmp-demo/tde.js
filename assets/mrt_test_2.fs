precision lowp float;
uniform float time;
uniform float duration;
uniform float beat;
uniform vec2  resolution;

uniform sampler2D texture_0;
uniform sampler2D texture_1;
varying vec2 v_tex_coords;

void main() {
    vec2 uv = v_tex_coords.xy;
    gl_FragColor = mix(texture2D(texture_0, uv),
                       texture2D(texture_1, uv),
                       uv.x);
}
