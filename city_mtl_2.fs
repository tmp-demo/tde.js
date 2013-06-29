#define shadowColor vec3(0.0,0.3,0.7)
#define buildingsColor vec3(1.0,1.0,1.0)
#define groundColor vec3(1.0,1.0,1.0)
#define skyColor vec3(0.9,1.0,1.0)
#define viewMatrix mat4(0.0)
#define fovyCoefficient 1.0
#define shadowHardness 7.0
#define defaultColor vec3(0.45,0.6,0.8)


void applyFog( in float distance, inout vec3 rgb ){

    float fogAmount = (1.0 - clamp(distance*0.0015,0.0,1.0) );
    vec3 fogColor = vec3(0.9,0.95,1);
    rgb = mix( skyColor, rgb, fogAmount );
}

float Softshadow(in vec3 landPoint, in vec3 lightVector, float mint, float maxt, float iterations)
{
    float penumbraFactor = 1.0;
    vec3 sphereNormal;
    float t = mint;
    for( int s = 0; s < 100; ++s )
    {
        if(t > maxt) break;
        float nextDist = BuildingsDistance(landPoint + lightVector * t);

        if( nextDist < 0.001 ){
            return 0.0;
        }
        penumbraFactor = min( penumbraFactor, iterations * nextDist / t );
        t += nextDist;
    }
    return penumbraFactor;
}

vec3 MaterialColor( int mtl )
{
    if(mtl==SKY_MTL) return skyColor;
    if(mtl==BUILDINGS_MTL) return buildingsColor;
    if(mtl==GROUND_MTL) return groundColor;

    return vec3(1.0,0.0,1.0); // means error
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

vec3 computeColor(vec3 eyePosition, vec3 hitPosition, vec3 direction, int material) {
    vec3 hitColor;
    if( material != SKY_MTL ) // has hit something
    {
        if(material == DEFAULT_MTL) {
            hitColor = defaultColor;
            applyFog(length(position-hitPosition)*2.0, hitColor);
            return hitColor;
        }

        vec3 lightpos = vec3(50.0 * sin(time*0.001), 10.0 + 40.0 *
        abs(cos(time*0.001)), (time * 0.2) + 100.0 );
        vec3 lightVector = normalize(lightpos - hitPosition);
        // soft shadows
        float shadow = Softshadow(hitPosition, lightVector, 0.1, 50.0, shadowHardness);
        // attenuation due to facing (or not) the light
        vec3 normal = ComputeNormal(hitPosition);
        float attenuation = clamp(dot(normal, lightVector),0.0,1.0)*0.6 + 0.4;
        shadow = min(shadow, attenuation);
        //material color
        vec3 mtlColor = MaterialColor(material);

        if(material == BUILDINGS_MTL){
          mtlColor = mix(shadowColor, mtlColor, clamp(hitPosition.y/9.0, 0.0, 1.0));
        }
        hitColor = mix(shadowColor, mtlColor, 0.4+shadow*0.6);
        float AO = AmbientOcclusion(hitPosition, normal, 0.35, 5.0);
        hitColor = mix(shadowColor, hitColor, AO);

        applyFog( length(position-hitPosition)*2.0, hitColor);
    }
    else // sky
    {
        float shade = direction.y;
        hitColor = mix(skyColor, vec3(0.3,0.3,0.7), shade);
    }
    return hitColor;
}
