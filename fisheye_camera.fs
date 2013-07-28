 
  // ------------
  // fisheye_camera 

  //    vec2 screen_position
  //    float ratio
  //    float fovy_coef
  //    mat4 transform
  //    out vec3 position
  //    out vec3 direction

  vec2 cam_sp = screen_position;
  cam_sp.y -= 0.2;
  cam_sp *= vec2(PI*0.5,PI*0.5/ratio)/fovy_coef;
  direction = vec3(
        sin(cam_sp.y+PI*0.5)*sin(cam_sp.x)
      , -cos(cam_sp.y+PI*0.5)
      , sin(cam_sp.y+PI*0.5)*cos(cam_sp.x)
  );
  position = vec3(5.0*sin(time*0.01), 15.0, time);

  // fisheye_camera
  // ------------
