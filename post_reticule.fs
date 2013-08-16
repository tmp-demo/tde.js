#define PI_4 0.78539816339
#define sqrt2by2 0.707106781

float IsWithinCircleStar(vec2 xy, vec2 star, float time, float delai, float finalRadius, float epsilon){
	
	// one shall compare the squre of the distance to the star from the pixel to the allowed saure of radius at ti;e t
	
	
	//co;pute distance to star
	float sqrdist = (xy.x - star.x) * (xy.x - star.x) + (xy.y - star.y) * (xy.y - star.y);
	
	//co;pute expected radius
	float sqrradius = max((delai - time) / delai ,0.) * (90000. - finalRadius) + finalRadius;
	
	//float sqrradius = 100.;
	
	if( abs(sqrdist - sqrradius) <epsilon * epsilon)
		return 2.;
	else
		return 0.;
	
	 
}

float IsOnLegendStar(vec2 xy, vec2 star, float time, float delai, float finalRadius, float epsilon){
	
	//on shall wait for for the delai to be reached
	
	if( time < delai ) return 0.;
	
	float dist = (star.x - xy.x) * (star.x - xy.x) + (star.y - xy.y) * (star.y - xy.y); 
	float r1 = finalRadius;
	float r2 = finalRadius+3000.0;
	float r3 = finalRadius+50000.0;
	
	if( dist > r1 && dist < r2 && abs(xy.x - star.x - xy.y + star.y )<  5.) return 2.;
	   
	if( (dist) > r2 && (dist) < r3 && 
	   ( abs( xy.y  - star.y - sqrt(r2)*sqrt2by2   ) < 3.0 && xy.x > star.x  
      || abs( xy.y  - star.y + sqrt(r2)*sqrt2by2   ) < 3.0 && xy.x < star.x  
	   )) return 2.;
	   
	return 0.;
	 
}


void main(void)
{
	

	gl_FragColor = texture2D(iChannel0,  vec2(gl_FragCoord.x/iChannelResolution[0].x,gl_FragCoord.y/iChannelResolution[0].y) ) - vec4 (0.0,0.0,0.0,0.001);
	
	//float timeInSeconds = time /1000.0;
	
	//vec2 uv = gl_FragCoord.xy / res.xy;
	if(IsWithinCircleStar(gl_FragCoord.xy, vec2(400.,200.), iGlobalTime, 5., 1000., 10.) > 1.)
	   gl_FragColor = vec4(1., 0.0, 0.0, 1.0);
	
	if(IsOnLegendStar(gl_FragCoord.xy, vec2(400.,200.), iGlobalTime, 5., 1000., 10.) > 1.)
	   gl_FragColor = vec4(1., 0.0, 0.0, 1.0);
	

	

}