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

  vec3 diffuse = mix(
    texture.rgb,
    dot(normalize(v_normals), light) * skyColor(v_normals),
    0.2
  );
  // XXX make use of the reflectance, my BRDFs are a bit rusty...
  float reflect =
    max(0.0, dot(normalize(v_normals), normalize(light) - normalize(cam_pos - v_position))) * texture.a;
//    * dot(normalize(v_normals), );
  gl_FragColor = vec4(applyFog(v_normals, diffuse) + vec3(reflect, reflect, reflect), 1.0);
}
