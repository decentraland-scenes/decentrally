import bpy
from mathutils import geometry

count = 16

# Acquire a reference to the bezier points.
bez_curve = bpy.context.active_object
bez_points = bez_curve.data.splines[0].bezier_points
    
bez_len = len(bez_points)
i_range = range(1, bez_len-1, 1) 

print("export let",bez_curve.name,":Vector3[] = [")
for i in i_range:
    
    # Get a list of points distributed along the curve.
    points_on_curve = geometry.interpolate_bezier(
    bez_points[i].co,
    bez_points[i].handle_right,
    bez_points[i+1].handle_left,
    bez_points[i+1].co,
    count)
    
    points_len = len(points_on_curve)
    j_range = range(0, points_len, 1)   

    for j in j_range:
        x = points_on_curve[j].x
        y = points_on_curve[j].y
        if(abs(x) < 0.01):
            x = 0
        if(abs(y) < 0.01):
            y = 0
        print('\tnew Vector3(',x, ", 0" , ', ', y, '),' )        

print("]")