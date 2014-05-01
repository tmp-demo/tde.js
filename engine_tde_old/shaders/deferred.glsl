//! VERTEX

void main_vs_deferred() {
  gl_Position = view_proj_mat * vec4(position, 1.0);
  v_position = gl_Position.xyz;
  v_normals = normals;
  v_tex_coords = tex_coords;
}

//! FRAGMENT

void main_fs_deferred() {
  float depth = v_position.z / FAR_DIST;
  gl_FragData[0] = vec4(texture2D(texture_0, v_tex_coords).rgb, floor(depth * 255.0) / 255.0);
  //gl_FragData[0] = vec4(v_tex_coords, 0.0, 1.0);
  gl_FragData[1] = vec4(0.5*v_normals+vec3(0.5,0.5,0.5), fract(depth * 255.0));
}
