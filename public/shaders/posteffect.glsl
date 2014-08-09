//! VERTEX

void main_vs_posteffect() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

void main_fs_posteffect() {
  
  vec2 uv = v_tex_coords;
  /*uv += vec2(floor(rand(clip_time * 0.0001) * 2.0) * 0.57 + rand(clip_time * 0.00001) * 0.4 + sin(v_tex_coords.x * 200.0 * cos(floor(clip_time * .20))), 1.0);
  
  // logo and background
  vec3 color = texture2D(texture_0, uv).rgb * 0.5;
  color += texture2D(texture_0, v_tex_coords).rgb;
  
  // chromatic aberration
  color += vec3(0.0, 0.0, texture2D(texture_0, v_tex_coords + rand(clip_time) * 0.01).b);
  
  // scanlines
  color *= mod(v_tex_coords.y, 0.001) * 1000.0;
  
  // fade to black
  color *= clamp(mod(rand(clip_time * 0.0003), 1.0) * 1.8, 0.0, 1.0);
  
  gl_FragColor = vec4(color, 1.0);*/
  
  // block displacement
  float glitchFactor = floor(noise(vec2(clip_time * 4.0, 0.0)) * 2.0);
  float offset0 = rand(floor(uv.y * 30.0) + glitchFactor * 50.0 * clip_time) - 0.5;
  vec2 uv2 = floor(uv * 5.0 + vec2(offset0 * 2.0 * glitchFactor, 0.0) * floor(glitch * 20.0) / 100.0) / 5.0;
  float offset1 = floor(rand2(uv2 + floor(clip_time * 10.0))) / 2.0;
  float offset2 = floor(uv.y * 20.0 + rand2(uv2) * 100.0) / 100.0;
  vec3 color = texture2D(texture_0, uv + vec2(offset1 + offset2, offset1) * glitch).rgb;
  
  // noise
  color += vec3(rand2(uv + clip_time)) * glitch * 0.3;
  
  // vignette
  color *= 1.0 - pow(length(uv - 0.5) * 1.2, 4.0);
  
  // gamma
  //color = sqrt(color);
  
  gl_FragColor = vec4(color, 1.0);
}
