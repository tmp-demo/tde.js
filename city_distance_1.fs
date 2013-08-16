float PlaneDistance(in vec3 point, in vec3 normal, in float pDistance) {
    return dot(point - (normal * pDistance), normal);
}

float SphereDistance(vec3 point, vec3 center, float radius)
{
    point.z = mod(point.z+15.0, 230.0)-15.0;
    point.x = mod(point.x+15.0, 230.0)-15.0;
    return length(point - center) - radius;
}


float CubeDistance2 (in vec3 point, in vec3 size) {
    return length(max(abs(point)-size, 0.0));
}

vec3 DistanceRepetition(in vec3 point, in vec3 repetition ) {
    vec3 q = mod(point, repetition)-0.5*repetition;
    return q;
}


float CubeRepetition(in vec3 point, in vec3 size, in vec3 repetition ) {
    vec3 q = mod(point, repetition)-0.5*repetition;
    q.y = point.y;
    return CubeDistance2 ( q, size);
}


float blocIndex(in float point, in float repetition) {
    return floor(point / repetition);
}

float randomize(float co, float seed) {
    return 0.5 + 0.5 * cos(fract(co * seed * 12.9898) * 43758.5453);
//    return mod(fract(co * seed * 12.9898) * 43758.5453, 1.0);
//    return 0.5 + 0.5 * cos(fract(sin(co * seed * 12.9898)) * 43758.5453);
}

float RandomBuildingDistance(in vec3 point_pos, in vec2 repeat, in vec2 offset, float yCoef) {
    point_pos.x += offset.x;
    point_pos.z += offset.y;
    float rep_x = repeat.x;
    float rep_z = repeat.y;
    float bidx = blocIndex(point_pos.x, rep_x) + 100.0;
    float bidz = blocIndex(point_pos.z, rep_z) + 100.0;
    return CubeRepetition(point_pos,
                       // size
                       vec3(0.7 + 2.0 * randomize(bidx * bidz, 1.0)
                            , (1.0 + 3.2 * randomize(bidx, 11.0)
                                   + 3.2 * randomize(bidz, 17.0)) * yCoef
                            , 0.7 + 2.0 * randomize(bidx * bidz, 2.0)),
                       // repeat
                       vec3(rep_x, 0.0, rep_z));
}

float BuildingsDistance(in vec3 point_pos)
{
    return min(
        min(
            min(
                // ------------------- position -- repeat ---------- offset --------- coef
                RandomBuildingDistance(point_pos, vec2(20.0, 20.0), vec2(0.0,0.0),    0.8),
                RandomBuildingDistance(point_pos, vec2(20.0, 20.0), vec2(110.0,10.0), 1.0)
            ), min (
                RandomBuildingDistance(point_pos, vec2(20.0, 20.0), vec2(105.0,0.0),  0.9),
                RandomBuildingDistance(point_pos, vec2(20.0, 20.0), vec2(0.0,5.0),    0.9)
            )
        ),
        RandomBuildingDistance(        point_pos, vec2(120.0, 120.0), vec2(2.0,3.0), 1.7)
    );
}

float GroundDistance(in vec3 point_pos)
{
    return PlaneDistance(point_pos, vec3(0.0,1.0,0.0), 0.0);
}
