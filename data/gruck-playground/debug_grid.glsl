//! VERTEX
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib


void main_vs_debug_grid() {
  vec3 pos = a_position ;

  v_uv = pos.xy / 2. + vec2(0.5);
  v_uv *= vec2(1.,-1.);

  pos *= vec3( 2./3.,3./2., 0);
  pos *= vec3( 16./9.,9./16.,0);
  gl_Position = u_view_proj_mat *
                vec4(pos + vec3(25.0, 0.0, 0.0) * u_object_id /* as long there is only one object, =0*/+ vec3(noise3(u_global_time * pos.xy).xy - vec2(0.5),0.)*0.1         , 1.0);

  v_position = pos;
  v_triangle_id = a_triangle_id;

}
 
//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_debug_grid() {
  float a = v_triangle_id / 50.;
 
  gl_FragColor = texture2D(u_texture_0, v_uv);
  
  
  
  //gl_FragColor = mix(
//    vec4(0.,0.,0., 1.0),
//    vec4(1.,1.,1., 1.0),
//    a
//  );
}
