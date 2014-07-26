//! VERTEX

void main_vs_noise() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*57.0;

    float res = mix(mix( rand(n+  0.0), rand(n+  1.0),f.x),
                    mix( rand(n+ 57.0), rand(n+ 58.0),f.x),f.y);

    return res;
}

void main_fs_noise() {
  gl_FragColor = vec4(vec3(1.0,1.0,1.0)*noise(v_tex_coords*100.0), 1.0);
}
