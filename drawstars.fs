
float IsWithinCircleStar2(vec3 direction, vec3 stardirection, float correlation, float epsi){
	float dotprod = dot ( normalize(direction), normalize(stardirection));
	if(dotprod > correlation - epsi && dotprod < correlation + epsi){
	//if(dotprod > correlation){
		
		return 2.;
	}
	
	return 0.;
	
	
	
	 
}

float IsOnDiagLegendStar2(vec3 direction, vec3 stardirection, float correlation, float epsi){
	float dotprod = dot ( normalize(direction), normalize(stardirection));
	if(dotprod < correlation && dotprod > correlation *correlation){//defines lenght of cross
	//if(dotprod > correlation){
		float dotprodx = dot ( normalize(vec3(direction.xz,0.)), normalize(vec3(stardirection.xz,0.)));
		float dotprody = dot ( normalize(vec3(direction.yz,0.)), normalize(vec3(stardirection.yz,0.)));
		if(abs(dotprodx - dotprody) < epsi)
		//if(abs(dotprodx) > 1. - epsi || abs(dotprody) > 1. - epsi)
			return 2.;
		return 0.;
		
	}
	
	return 0.; 
}
#define sqrt2by2 0.707106781

float IsOnHoriLegendStar2(vec3 direction, vec3 stardirection, float correlation, float epsi){
	float dotprod = dot ( normalize(direction), normalize(stardirection));
	float dotprodx = dot ( normalize(vec3(direction.xz,0.)), normalize(vec3(stardirection.xz,0.)));
	float dotprody = dot ( normalize(vec3(direction.yz,0.)), normalize(vec3(stardirection.yz,0.)));
				
	
	if( dotprod < correlation *correlation  && dotprod > correlation * 0.9){
		//if( abs(dotprody) < correlation + epsi && abs(dotprody) > correlation  - epsi ){	
        if( abs(dotprody * dotprody) < correlation * correlation + epsi && abs(dotprody * dotprody ) > correlation *correlation - epsi ){		
		//if( abs(dotprody / sqrt2by2) < correlation / sqrt2by2  + epsi && abs(dotprody / sqrt2by2) > correlation /sqrt2by2 - epsi ){		
			
	
			if(direction.x > stardirection.x && direction.y > stardirection.y)
				return 2.0;
			if(direction.x < stardirection.x && direction.y < stardirection.y)
				return 2.0;
				
		//if(dotprodx - dotprod > correlation - 0.01) {
		//	return 2.;
		//}
		}
	}
	
	return 0.; 
}

void stars_drawreticule(vec3 direction, vec3 stardirection,  vec3 reticulecolor, float correlation, inout vec3 color)
{

	if(IsWithinCircleStar2(direction, stardirection, correlation, 0.001) > 1.)
	   color = reticulecolor;
	
	if(IsOnDiagLegendStar2(direction, stardirection, correlation, 0.002) > 1.)
	   color = reticulecolor;
	   
	if(IsOnHoriLegendStar2(direction, stardirection, correlation, 0.002) > 1.)
	   color = reticulecolor;
	
}



void stars_drawstar(vec3 direction, vec3 stardirection, float steps, float correlation, vec3 starcolor, vec3 skycolor, inout vec3 color) {
	if(steps >= float(MAX_STEPS) && color == skycolor){ // there could be a star to be redered.
		//compute correlation of the directions : take the dot product of direction and stardirection both nor;alized. compare to correlation
		float dotprod = dot ( normalize(direction), normalize(stardirection));
		if(dotprod > correlation){
			color = starcolor;
		}
	}
}

void stars_drawemptysky( float steps, vec3 skycolor, inout vec3 color)
{
	if(steps >= float(MAX_STEPS)){ // there could be a star to be redered.
			color = skycolor;
	}

}

