//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_postfx1() {
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib

void main_fs_postfx1() {
  vec2 uv = v_uv;
  /*uv += vec2(floor(rand(clip_time * 0.0001) * 2.0) * 0.57 + rand(clip_time * 0.00001) * 0.4 + sin(v_uv.x * 200.0 * cos(floor(clip_time * .20))), 1.0);
  
  // logo and background
  vec3 color = texture2D(u_texture_0, uv).rgb * 0.5;
  color += texture2D(u_texture_0, v_uv).rgb;
  
  // chromatic aberration
  color += vec3(0.0, 0.0, texture2D(u_texture_0, v_uv + rand(clip_time) * 0.01).b);
  
  // scanlines
  color *= mod(v_uv.y, 0.001) * 1000.0;
  
  // fade to black
  color *= clamp(mod(rand(clip_time * 0.0003), 1.0) * 1.8, 0.0, 1.0);
  
  gl_FragColor = vec4(color, 1.0);*/
  // block displacement
  float glitchFactor = floor(noise(vec2(u_global_time * 4.0, 0.0)) * 2.0);
  float offset0 = rand(floor(uv.y * 30.0) + glitchFactor * 50.0 * u_global_time) - 0.5;
  vec2 uv2 = uv;//floor(uv * 5.0 + vec2(offset0 * 2.0 * glitchFactor, 0.0) * floor(glitch * 20.0) / 100.0) / 5.0;
  float offset1 = floor(rand2(uv2 + floor(u_global_time * 10.0))) / 2.0;
  float offset2 = floor(uv.y * 20.0 + rand2(uv2) * 100.0) / 100.0;
  vec3 color = texture2D(u_texture_0, uv).xyz;

  // noise
  color.rgb += vec3(rand2(uv + u_global_time)) * u_glitch * 0.3;
  
  // vignette
  color.rgb *= 1.0 - pow(length(uv - 0.5) * 1.2, 4.0);
  
  // gamma
  //color.rgb = sqrt(color.rgb);
  
  gl_FragColor = vec4(color, 1.0);
}
