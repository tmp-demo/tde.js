
// -----------------
// ISS scene

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}

float sdCylinderY( vec3 p, vec3 c )
{
  return length(p.xz)-c.z;
}

float sdCylinderZ( vec3 p, vec3 c )
{
  return length(p.xy)-c.z;
}

float sdCylinderX( vec3 p, vec3 c )
{
  return length(p.yz)-c.z;
}
float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

/*float opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;

}
*/

vec3 opTx( vec3 p, mat4 m )
{
	return vec3(0.,0.,0.);
    return (m*vec4(p,1)).xyz;
 
}


float PlaneDistance(in vec3 point, in vec3 normal, in float pDistance)
{
return dot(point - (normal * pDistance), normal);
}

float GroundDistance(in vec3 position)
{
    return PlaneDistance(position, vec3(0.0,1.0,0.0), 0.0);
}

float CoreDistance(in vec3 position, float s)
{
	return length(position) - s + 0.7 * cos(position.x * 3.) * sin(position.y * 3.) * sin(position.z * 3.) * cos(time / 10.);
 


}

float MainStaPart(in vec3 position)
{
    // this is just the main 3 axes. intersection of an infinite cylinder and a sphere
	
	
	return 
	min(
		min(
			max(
				max(
					min(
						sdCylinderY(position, vec3(0.0, 0.0, 3.0))
						,min(
							sdCylinderZ(position, vec3(0.0, 0.0, 3.0))
							,sdCylinderX(position, vec3(0.0, 0.0, 3.0))
						)
					)
					, sdSphere(position, 25.0)//external boundaries
				)
				,-sdSphere(position, 6.0) //internal boundaries of a cylinders
			)
			,CoreDistance(position,4.0)  //core, will reauire noise
		)  
		,sdTorus(position,vec2(25.0,6.0))//consider reducing first param to link torus to cylinders
	)	;
}


float distance_field(in vec3 position)
{
//   return min(RedDistance(position),
  //       min (BuildingsDistance(position),
    //      GroundDistance(position)));
	
	//return min(MainStaPart(position), GroundDistance(position));
	//return min(
	//	GroundDistance(position)
	//	,MainStaPart(position)
	//	
	//)	;
	return MainStaPart(position);
}

// scene
// -----------------

