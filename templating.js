
/* exemple:
  shader_src = template(
    marcher_base_src,
    {
      "$define_colors": [default_colors],
      "$define_max": [default_max],
      "$scene": [scene_iss_src],
      "$camera": [camera_fixedTowardsX_src],
      "$functions" : [
        debug_src,
		drawstars_src,
        ""
      ],
      "$shading": [
        "debug_steps(num_steps, color);",
      ]
    }
  );
*/
function template(base, subs) {
  var result = base;
  for (var pat in subs) {
    var txt_cat = "";
    for (var j in subs[pat]) {
      txt_cat += subs[pat][j] + "\n";
    }
    result = result.replace(pat, txt_cat);
  }
  return result;
}
