//! VERTEX

void main_vs_city() {
  gl_Position = view_proj_mat * vec4(position
    + vec3(0.0, sin(position.x * position.z / 100000.0)*20.0, 0.0),
   1.0);
  v_position = position;
  v_normals = normals;
  v_tex_coords = tex_coords;
}

//! FRAGMENT
//! INCLUDE scattering.glsllib
//! INCLUDE rand.glsllib

void main_fs_city() {

  vec4 texture = texture2D(texture_0, v_tex_coords);

  vec2 uv2 = v_tex_coords * 200.0;
  vec3 fakeNormalMap = (noise3(uv2) - 0.5) * (1.0 - texture.a) * 0.1;
  vec3 normal = normalize(normalize(v_normals) + fakeNormalMap);
  vec3 diffuse = dot(normal, light) * skyColor(normal) * texture.rgb;

  vec3 eye = normalize(cam_pos - v_position);
  vec3 half = normalize(eye + light);
  vec3 specular = pow(dot(half, normal), 100.0) * vec3(noise(uv2) * 2.0) * texture.a;

  /*vec3 radiance = mix(
    texture.rgb,
    clamp(diffuse + specular, 0.0, 1.0),
    0.5
  );*/
  
  vec3 radiance = clamp(diffuse + specular, 0.0, 1.0);
  gl_FragColor = vec4(applyFog(normal, radiance), 1.0);
  //gl_FragColor = vec4(normal, 1.0);
}
