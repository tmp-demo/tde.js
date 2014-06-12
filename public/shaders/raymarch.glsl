//! VERTEX

void main_vs_raymarch() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

float SphereDistance(vec3 point, vec3 center, float radius)
{
  point = mod(point, 10.0)- 5.;
  return length(point - center) - radius;
}

float distance_field(in vec3 position)
{
    return SphereDistance(position, vec3(0., 0., 0.), 1.);
}

vec3 ray_march(in vec3 position, in vec3 direction, out float steps)
{
    float next_distance = 1.0;
    for (int i = 0; i < 200 ; ++i)
    {
        next_distance = distance_field(position);
        
        if (next_distance < 0.01)
        {
            steps = float(i);
            return position;
        }
        position += direction * next_distance;
    }
  steps = float(200);

  return position;
}


void main_fs_raymarch() {

  
  float an = 0.0;
  vec3 ta = vec3(0.0,0.0,1.0); //where do we look at? assuming camera at 0,0,0. 
  vec3 ro = vec3(0.,0.,5.);//vec3(3.5*sin(an),-5.,3.5*cos(an)); //where is the camera ?
  
  // camera matrix //obscure part no need to touch this, unless you wan to tilt your head sideways
  vec3 ww = normalize( ta - ro ); //looking direction
  vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) ); //vector going to the viewer's right  // change the constant vector to fefine another top vector
  vec3 vv = normalize( cross(uu,ww)); //vector to the top

	// create view ray
  vec2 p = vec2(v_tex_coords.x *2. -1., v_tex_coords.y *2. -1.);
	vec3 dir = normalize( p.x*uu + p.y*vv + 2.0*ww ); //constant is fov. 2.0 = 90° vertical, 90° horizontal.
    
  float steps = 0.;
  vec3 pos = ray_march(vec3(0.,0.,5.), dir, steps);

  gl_FragData[0] = vec4( vec3(steps / 200.,steps / 200.,steps / 200.), 1.0);
}
