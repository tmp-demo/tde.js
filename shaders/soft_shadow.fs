float soft_shadow(in vec3 landPoint,
                  in vec3 light_direction,
                  float mint, float maxt,
                  float iterations)
{
    float penumbraFactor = 1.0;
    vec3 sphereNormal;
    float t = mint; //(mint + rand(gl_FragCoord.xy) * 0.01);
    for( int s = 0; s < 100; ++s )
    {
      // TODO[nical] use DistanceField instead
        if(t > maxt) break;
        float nextDist = min(
            BuildingsDistance(landPoint + light_direction * t )
            , RedDistance(landPoint + light_direction * t )
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
