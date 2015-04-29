//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_alpha_threshold() {
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib

void main_fs_alpha_threshold() {
  gl_FragColor = texture2D(u_texture_0, v_uv);
  float a = smoothstep(0.50, 0.6, gl_FragColor.a);

  gl_FragColor.a = a;
  gl_FragColor.rgb = mix(vec3(0.6, 0.7, 0.9), gl_FragColor.rgb, a);

  // noise
  gl_FragColor.rgb += vec3(rand2(v_uv + u_global_time)) * 0.1;
  
  // vignette
  gl_FragColor.rgb *= 1.0 - pow(length(v_uv - 0.5) * 1.3, 3.0);
}