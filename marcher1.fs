#ifdef GL_ES
precision highp float;
#endif

uniform float time;
#define time time / 10.0

uniform float duration;
/* beat */
uniform float beat;
/* resolution */
uniform vec2 res;

uniform mat4 mvmat;
uniform vec3 position;

#define MAX_STEPS 100

#define shadowColor vec3(0.0,0.3,0.7)
#define buildingsColor vec3(1.0,1.0,1.0)
#define groundColor vec3(1.0,1.0,1.0)
#define redColor vec3(1.0,0.1,0.1)
#define skyColor vec3(0.9,1.0,1.0)
#define viewMatrix mat4(0.0)
#define fovyCoefficient 1.0
#define shadowHardness 7.0

#define epsilon 0.01
#define PI 3.14159265

#define NO_HIT 0
#define HAS_HIT 1
// materials
#define SKY_MTL 0
#define GROUND_MTL 1
#define BUILDINGS_MTL 2
#define RED_MTL 3


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



float RedDistance(in vec3 point_pos) {
    return SphereDistance(point_pos, vec3(0.0, 3.0, 5.0), 5.0);
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

void applyFog( in float distance, inout vec3 rgb ){

    float fogAmount = (1.0 - clamp(distance*0.0015,0.0,1.0) );
    //float fogAmount = exp( -distance* 0.006 );
    vec3 fogColor = vec3(0.9,0.95,1);
    //if( fogAmount < 0.6 )
    // rgb = vec3(1.0,1.0,0.0);
    //else
    //rgb = clamp( rgb, 0.0, 1.0);
    rgb = mix( skyColor, rgb, fogAmount );
}

float DistanceField(in vec3 point_pos, out int mtl )
{
    //float redDistance = RedDistance(point_pos);
    float bldDistance = BuildingsDistance(point_pos);
    float gndDistance = GroundDistance(point_pos);
    float closest = gndDistance;
    mtl = GROUND_MTL;
    if ( bldDistance < closest )
    {
        closest = bldDistance;
        mtl = BUILDINGS_MTL;
    }
/*
    if ( redDistance < closest )
    {
        closest = redDistance;
        mtl = RED_MTL;
    }
*/
    return closest;
}


float Softshadow(in vec3 landPoint, in vec3 lightVector, float mint, float maxt, float iterations)
{
    float penumbraFactor = 1.0;
    vec3 sphereNormal;
    float t = mint; //(mint + rand(gl_FragCoord.xy) * 0.01);
    for( int s = 0; s < 100; ++s )
    {
        if(t > maxt) break;
        float nextDist = min(
            BuildingsDistance(landPoint + lightVector * t )
            , RedDistance(landPoint + lightVector * t )
        );

        if( nextDist < 0.001 ){
            return 0.0;
        }
        //float penuAttenuation = mix (1.0, 0.0, t/maxt);
        penumbraFactor = min( penumbraFactor, iterations * nextDist / t );
        t += nextDist;
    }
    return penumbraFactor;
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
    if (direction.y < 0.0 )
    {
        mtl = GROUND_MTL;
    }
    else
    {
        mtl = SKY_MTL;
    }
    return point_pos;
}

vec3 MaterialColor( int mtl )
{
    if(mtl==SKY_MTL) return skyColor;
    if(mtl==BUILDINGS_MTL) return buildingsColor;
    if(mtl==GROUND_MTL) return groundColor;
    if(mtl==RED_MTL) return redColor;

    return vec3(1.0,0.0,1.0); // means error
}

vec3 ComputeNormal(vec3 pos, int material)
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

void FishEyeCamera(vec2 screenPos, float ratio, float fovy, mat4 transform, out vec3 direction)
{
    screenPos.y -= 0.2;
    screenPos *= vec2(PI*0.5,PI*0.5/ratio)/fovy;
    
    float px = screenPos.x / 2.0;
    float py = screenPos.y / 2.0;

    direction = vec3(
           sin(py+PI*0.5)*sin(px)
        , -cos(py+PI*0.5)
        , sin(py+PI*0.5)*cos(px)
    );
    direction = (mvmat * vec4(direction,0.0)).xyz;
}


float AmbientOcclusion(vec3 point, vec3 normal, float stepDistance, float samples)
{
  float occlusion = 1.0;
  int tempMaterial;
  
  for (int i = 0; i < 15; ++i )
  {
    if(--samples < 0.0) break;
    occlusion -= (samples * stepDistance - (DistanceField( point + normal * samples * stepDistance, tempMaterial))) / pow(2.0, samples);
  }
  return occlusion;
}

void main(void)
{
    float ratio = res.x / res.y;
    // position on the screen
    vec2 screenPos;
    screenPos.x = (gl_FragCoord.x/res.x - 0.5);
    screenPos.y = gl_FragCoord.y/res.y - 0.5;

    vec3 direction;
    FishEyeCamera(screenPos, ratio, fovyCoefficient, viewMatrix, direction);
    int material;
    vec3 hitposition = RayMarch(position, direction, material);

    if( material == SKY_MTL && direction.y < 0.0 )
    {
       material = GROUND_MTL;
       gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }


    vec3 hitColor;
    if( material != SKY_MTL ) // has hit something
    {
        vec3 lightpos = vec3(50.0 * sin(time*0.001), 10.0 + 40.0 *
        abs(cos(time*0.001)), (time * 0.2) + 100.0 );
        vec3 lightVector = normalize(lightpos - hitposition);
        // soft shadows
        float shadow = Softshadow(hitposition, lightVector, 0.1, 50.0, shadowHardness);
        // attenuation due to facing (or not) the light
        vec3 normal = ComputeNormal(hitposition, material);
        float attenuation = clamp(dot(normal, lightVector),0.0,1.0)*0.6 + 0.4;
        shadow = min(shadow, attenuation);
        //material color
        vec3 mtlColor = MaterialColor(material);

        if(material == BUILDINGS_MTL){
          mtlColor = mix(shadowColor, mtlColor, clamp(hitposition.y/9.0, 0.0, 1.0));
        }
        hitColor = mix(shadowColor, mtlColor, 0.4+shadow*0.6);
        vec3 hitNormal = ComputeNormal(hitposition, 0);
        float AO = AmbientOcclusion(hitposition, hitNormal, 0.35, 5.0);
        hitColor = mix(shadowColor, hitColor, AO);

        float foo = length(hitposition - vec3(50.0, 0.0, 150.0));
        float bar = sin(foo/1000.0 - time/3000.0);
        if (bar > 0.0 && bar < 0.01) {
            hitColor = vec3(1.0, 0.0, 0.0);
        } else if (bar > 0.01 && bar < 0.02) {
            hitColor = vec3(1.0, 1.0, 0.0);
        } else if (bar > 0.02 && bar < 0.03) {
            hitColor = vec3(0.0, 1.0, 1.0);
        }
        applyFog( length(position-hitposition)*2.0, hitColor);
        gl_FragColor = vec4(hitColor, 1.0);

    }
    else // sky
    {
        float shade = direction.y;
        vec3 hitColor = mix(skyColor, vec3(0.3,0.3,0.7), shade);
        gl_FragColor = vec4(hitColor, 1.0);
    }
}
