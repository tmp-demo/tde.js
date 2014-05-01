//! VERTEX

void main_vs_show_deferred() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

void main_fs_show_deferred() {
  vec4 tex0 = texture2D(texture_0, v_tex_coords);
  vec4 tex1 = texture2D(texture_1, v_tex_coords);
  
  vec3 albedo = tex0.xyz;
  vec3 normal = tex1.xyz;
  float depth = 50.0 * (tex0.w + tex1.w / 255.0);
  
  vec3 position = vec3(v_tex_coords * 2.0 - 1.0, 1.0) * depth;
  
  float v = v_tex_coords.y;
  if (v < 0.25) {
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = clamp(dot(normal, lightDirection), 0.0, 1.0);
	float fogFactor = exp(-depth);
	vec3 fogColor = mix(vec3(1.0, 1.0, 0.7), vec3(0.8, 0.9, 1.0), dot(v_tex_coords.xy, vec2(0.707, 0.707)));
	vec3 color = mix(fogColor, diffuse * albedo, fogFactor);
    gl_FragData[0] = vec4(color, 1.0);
  } else if (v < 0.50) {
    gl_FragData[0] = vec4(normal, 1.0);
  } else if (v < 0.75) {
    gl_FragData[0] = vec4(vec3(depth / 50.0), 1.0);
  } else {
    gl_FragData[0] = vec4(albedo, 1.0);
  }
}
