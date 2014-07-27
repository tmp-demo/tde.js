//! VERTEX

void main_vs_posteffect() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

void main_fs_posteffect() {
  
  vec2 uv = v_tex_coords;
  uv += vec2(floor(rand(clip_time * 0.0001) * 2.0) * 0.57 + rand(clip_time * 0.00001) * 0.4 + sin(v_tex_coords.x * 200.0 * cos(floor(clip_time * .20))), 1.0);
  
  // logo and background
  vec3 color = texture2D(texture_0, uv).rgb * 0.5;
  color += texture2D(texture_0, v_tex_coords).rgb;
  
  // chromatic aberration
  color += vec3(0.0, 0.0, texture2D(texture_0, v_tex_coords + rand(clip_time) * 0.01).b);
  
  // scanlines
  color *= mod(v_tex_coords.y, 0.001) * 1000.0;
  
  // fade to black
  color *= clamp(mod(rand(clip_time * 0.0003), 1.0) * 1.8, 0.0, 1.0);
  
  gl_FragColor = vec4(color, 1.0);
}
