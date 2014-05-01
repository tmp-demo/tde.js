void ambient_occlusion (vec3 point, vec3 normal, float stepDistance, float samples, inout vec3 color) 
{
  float occlusion = 1.0;
  
  for (int i = 0; i < 20; ++i ) 
  {
    if(--samples < 0.0) break;
    occlusion -= (samples * stepDistance - (distance_field( point + normal * samples * stepDistance))) / pow(2.0, samples);
  }
  color = mix(shadowColor, color, occlusion);
}
