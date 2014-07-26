//! VERTEX

void main_vs_raymarch() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy;
}

//! FRAGMENT

float SphereDistance(vec3 point, vec3 center, float radius)
{
  point = mod(point, 10.0)- 5.;
  return length(point - center) - radius;
}

float distance_field(in vec3 position)
{
  return SphereDistance(position, vec3(0., 0., 0.), 2.);
}

vec3 ray_march(vec3 position, vec3 direction, out float steps)
{
  float next_distance = 1.0;
  for (int i = 0; i < 80 ; ++i)
  {
      next_distance = distance_field(position);
      
      if (next_distance < 0.01)
      {
          steps = float(i);
          return position;
      }
      position += direction * next_distance;
  }
  steps = 80.0;

  return position;
}


void main_fs_raymarch()
{
  vec3 pos = vec3(cos(clip_time) * 2.0, 0.0, clip_time * 20.0);
	vec3 dir = normalize(vec3(v_tex_coords.x * resolution.x / resolution.y, v_tex_coords.y + sin(clip_time * 0.2) * 0.2, 1.0)); //constant is fov. 1.0 = 90° vertical
  
  float steps;
  pos = ray_march(pos, dir, steps);

  steps /= 80.0;
  gl_FragColor = vec4( vec3(steps, steps, steps), 1.0);
}
