
float DistanceField(in vec3 point_pos, out int mtl )
{
    float bldDistance = BuildingsDistance(point_pos);
    float gndDistance = GroundDistance(point_pos);
    float closest = gndDistance;
    mtl = GROUND_MTL;
    if ( bldDistance < closest )
    {
        closest = bldDistance;
        mtl = BUILDINGS_MTL;
    }
    return closest;
}

vec3 RayMarch(in vec3 point_pos, in vec3 direction, out int mtl)
{
    float nextDistance = 1.0;
    for (int i = 0; i < MAX_STEPS ; ++i)
    {
        nextDistance = DistanceField(point_pos,mtl);
        
        if ( nextDistance < 0.01)
        {
            return point_pos;
        }
        point_pos += direction * nextDistance;
    }
    // out of steps
    if (direction.y < 0.0 ) {
        mtl = DEFAULT_MTL;
    } else {
        mtl = SKY_MTL;
    }
    return point_pos;
}

vec3 ComputeNormal(vec3 pos)
{
    int dummy;
    return normalize(
        vec3(
          DistanceField( vec3(pos.x + epsilon, pos.y, pos.z), dummy ) - DistanceField( vec3(pos.x - epsilon, pos.y, pos.z), dummy )
        , DistanceField( vec3(pos.x, pos.y + epsilon, pos.z), dummy ) - DistanceField( vec3(pos.x, pos.y - epsilon, pos.z), dummy )
        , DistanceField( vec3(pos.x, pos.y, pos.z + epsilon), dummy ) - DistanceField( vec3(pos.x, pos.y, pos.z - epsilon), dummy )
        )
    );
}
