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

void main_fs_city() {

  vec4 texture = texture2D(texture_0, v_tex_coords);

  vec3 normal = normalize(v_normals);
  vec3 diffuse = dot(normalize(normal), light) * skyColor(normal) * texture.rgb;

  vec3 eye = normalize(cam_pos - v_position);
  vec3 half = normalize(eye + light);
  vec3 specular = pow(dot(half, normal), 50.0) * vec3(100.0);// * texture.a;

  vec3 radiance = mix( // cartoonify
    texture.rgb,
    clamp(diffuse + specular, 0.0, 1.0),
    0.5
  );

  float reflect =
    max(0.0, dot(normalize(v_normals), normalize(light) - normalize(cam_pos - v_position))) * texture.a;
  gl_FragColor = vec4(applyFog(v_normals, diffuse) + vec3(reflect, reflect, reflect), 1.0);
}
