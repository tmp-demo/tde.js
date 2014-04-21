
// -----------------
// scene


float PlaneDistance(in vec3 point, in vec3 normal, in float pDistance)
{
return dot(point - (normal * pDistance), normal);
}
float SphereDistance(vec3 point, vec3 center, float radius)
{
  point.z = mod(point.z+15.0, 230.0)-15.0;
  point.x = mod(point.x+15.0, 230.0)-15.0;
  //point.y = mod(point.y, 30.0);
  return length(point - center) - radius;
}
float CubeDistance2 (in vec3 point, in vec3 size) {

  return length(max(abs(point)-size, 0.0));
}
vec3 DistanceRepetition(in vec3 point, in vec3 repetition ) {
  vec3 q = mod(point, repetition)-0.5*repetition;
  return q;
}
float CubeRepetition(in vec3 point, in vec3 repetition ) {
    vec3 q = mod(point, repetition)-0.5*repetition;
    q.y = point.y;
    return CubeDistance2 ( q, vec3 (2.0, 4.0, 2.0));
}

float RedDistance(in vec3 position)
{
    return SphereDistance(position, vec3(0.0, 3.0, 5.0), 5.0);
}

float BuildingsDistance(in vec3 position)
{
    return min(
      CubeRepetition(position, vec3(17.0, 0.0, 20.0))
      , CubeRepetition(position+vec3(350.0,-2.0,0.0), vec3(23.0, 0.0, 23.0))
    );
}

float GroundDistance(in vec3 position)
{
    return PlaneDistance(position, vec3(0.0,1.0,0.0), 0.0);
}



float distance_field(in vec3 position)
{
    return min(RedDistance(position),
         min (BuildingsDistance(position),
          GroundDistance(position)));
}

// scene
// -----------------

