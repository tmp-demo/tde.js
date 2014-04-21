#extension GL_EXT_draw_buffers : require
precision lowp float;
uniform float time;
uniform float duration;
uniform float beat;
uniform vec2  resolution;

void main() {
    gl_FragData[0] = vec4(0.0, 1.0, 0.0, 1.0);
    gl_FragData[1] = vec4(1.0, 0.0, 0.0, 1.0);
}
