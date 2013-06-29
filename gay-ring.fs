precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* resolution */
uniform vec2 res;

uniform float beat;

uniform sampler2D u_image;
uniform vec2 u_textureSize;

varying vec2 v_texCoord;

//float DistanceToFunc(vec2 xy, float time, float phi){
//	// y = cos(t)*cos(x) +x	=> x = y - cost
//	
//	float t = mod(time,6.28);
//	float t2 = 3.5*time*1000.0/duration - 1.3;//mod(time*0.2, 4.0)-1.0;
//	float t3 = mod(time*0.2,6.28);
//	
//	float disty = abs(xy.y +t2 - xy.x + 0.1*cos(t+phi)*cos(10.0*xy.x));
//	float distx = 9999.0;
//	
//	return min(disty, distx);
//	
//}
	
	
mat4 rotationMatrix(vec3 ax, float angle)
{
  vec3 axis = normalize(ax);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat4(oc * axis.x * axis.x + c         , oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c , oc * axis.y * axis.z - axis.x * s        , 0.0,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c         , 0.0,
      0.0, 0.0, 0.0, 1.0);
}


float DistanceToFunc(vec2 xy, vec2 center, float radius){
	
	
	//return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.05*cos(mod(abs(xy.x*xy).y*time,6.28));
	//return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.05*cos(mod(abs(xy.x*xy).y*time/100.0,6.28));
	
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.3*sin(acos((xy.x-0.5)/(xy.y-0.5)));
	
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - abs(0.05*atan(mod(abs((xy.x-0.5)*(xy.y-0.5))*time/20.0,6.28)));
	
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - abs(0.05*cos(mod(abs((xy.x-0.5)*(xy.y-0.5))*time/20.0,6.28)));
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.05*cos(mod(abs((xy.x-0.5)*(xy.y-0.5))*time/10.0,6.28));
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.05*tan(mod(abs((xy.x-0.5)*(xy.y-0.5))*time,6.28));
	return abs(sqrt((xy.x-center.x)*(xy.x-center.x)+(xy.y-center.y)*(xy.y-center.y)) - radius) - 0.05*cos(mod(abs(xy.x*xy).y*time,6.28));
	
	
	
}



void main(void)
{

	float timeInSeconds = time /1000.0;
	
	vec2 center = vec2(0.5, 0.5);
	
		
	
	gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	
	
	vec2 uv = gl_FragCoord.xy / res.xy;
	
	
	
	if(DistanceToFunc(uv,center,0.10) < 0.015+ 0.1*beat)
	   gl_FragColor = gl_FragColor + vec4(0.93, 0.0, 0.0, 1.0);
	if(DistanceToFunc(uv,center,0.13) < 0.03 + 0.1*beat&& gl_FragColor.w != 1.0)
	   gl_FragColor = gl_FragColor + vec4(1.0, 0.5, 0.0, 1.0);
	if(DistanceToFunc(uv,center,0.16) < 0.03 + 0.1*beat&& gl_FragColor.w != 1.0)
	   gl_FragColor = gl_FragColor + vec4(1.0, 1.0, 0.0, 1.0);
	if(DistanceToFunc(uv,center,0.19) < 0.03 + 0.1*beat&& gl_FragColor.w != 1.0)
	   gl_FragColor = gl_FragColor + vec4(0.0, 0.47, 0.25, 1.0);
	if(DistanceToFunc(uv,center,0.22) < 0.03 + 0.1*beat && gl_FragColor.w != 1.0)
	   gl_FragColor = gl_FragColor + vec4(0.25, 0.25, 1.0, 1.0);
	if(DistanceToFunc(uv,center,0.25) < 0.03 + 0.1*beat && gl_FragColor.w != 1.0)
	   gl_FragColor = gl_FragColor + vec4(0.62, 0.0, 0.75, 1.0);

	

}