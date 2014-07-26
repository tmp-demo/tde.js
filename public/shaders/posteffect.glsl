//! VERTEX

void main_vs_posteffect() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

void main_fs_posteffect() {
  //gl_FragColor = vec4(texture2D(texture_0, v_tex_coords).rgba);
  
  vec2 uv = gl_FragCoord.xy / resolution;
  uv += vec2(floor(rand(clip_time * 0.0000001) * 2.0) * 0.57 + rand(clip_time * 0.00000001) * 0.4 + sin(gl_FragCoord.x / resolution.x * 200.0 * cos(floor(clip_time * .00020))), 1.0);
  
  // logo and background
  vec3 color = texture2D(texture_0, uv).rgb * 0.5;
  color += texture2D(texture_0, gl_FragCoord.xy /resolution).rgb;
  
  // chromatic aberration
  color += vec3(0.0, 0.0, texture2D(texture_0, (gl_FragCoord.xy + rand(clip_time) * 4.) / resolution ).b);
  
  // scanlines
  color *= mod(gl_FragCoord.y, 3.0);
  
  // fade to black
  color *= clamp(mod(rand(clip_time * 0.0000003), 1.0) * 1.8, 0.0, 1.0);
  
  gl_FragColor = vec4(color, 1.0);
}
