//! VERTEX

void main_vs_scrolltext() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT
uniform vec2 textDim_scroll;

void main_fs_scrolltext() {

  vec2 uv = vec2( (gl_FragCoord.x + clip_time /8. - 1000.) / textDim_scroll.x, (gl_FragCoord.y + 60.*cos(gl_FragCoord.x/150.) - 500.)/ textDim_scroll.y) ;
  
  vec3 color = texture2D(texture_0, uv ).rgb;
    
    
  gl_FragColor = vec4(color, 1.0);
}
