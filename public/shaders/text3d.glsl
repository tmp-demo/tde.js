//! VERTEX

void main_vs_text3d() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT
uniform vec2 textDim_hw;

void main_fs_text3d() {

  vec2 uv = vec2( (gl_FragCoord.x + clip_time /8. - 1000.) / textDim_hw.x, (gl_FragCoord.y + 60.*cos(gl_FragCoord.x/150.) - 100.)/ textDim_hw.y) ;
 vec3 color = texture2D(texture_0, uv ).rgb;   
 //
 //uv = vec2( (gl_FragCoord.x + clip_time /8. + mod(gl_FragCoord.y- 50.,textDim_hw.y) *cos(clip_time/1000.*2.) - 1000.) / textDim_hw.x, (gl_FragCoord.y - 50.)/ textDim_hw.y) ;
 //color += texture2D(texture_0, uv ).rgb; 

  uv = vec2( (gl_FragCoord.x - 500.) / textDim_hw.x,( gl_FragCoord.y -500.) / textDim_hw.y) ;
  color += texture2D(texture_0, uv ).rgb; 
  
    
  gl_FragData[0] = vec4(color, 1.0);
  
  
}
