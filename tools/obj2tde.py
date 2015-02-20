import os
import sys
import json

def load_materials(filename):
    materials = {}
    currentMaterial = None

    with open(filename) as materialFile:
        for line in materialFile:
            fragments = line.split()

            if len(fragments) < 2:
                continue

            if fragments[0] == "newmtl":
                currentMaterial = {}
                materials[fragments[1]] = currentMaterial
            elif fragments[0] == "Kd":
                currentMaterial["diffuse"] = (float(fragments[1]), float(fragments[2]), float(fragments[3]))

        return materials

def load_mesh(filename):
    with open(filename) as meshFile:
        materials = {}
        positions = []
        normals = []

        currentMaterial = None

        for line in meshFile:
            fragments = line.split()

            if len(fragments) < 2:
                continue

            if fragments[0] == "mtllib":
                materials = load_materials(os.path.join(os.path.dirname(filename), fragments[1]))
            elif fragments[0] == "v":
                positions.append((float(fragments[1]), float(fragments[3]), -float(fragments[2])))
            elif fragments[0] == "vn":
                normals.append((float(fragments[1]), float(fragments[3]), -float(fragments[2])))
            elif fragments[0] == "usemtl":
                currentMaterial = materials[fragments[1]]
            elif fragments[0] == "f":
                if len(fragments) > 4:
                    # make 2 triangles out of a quad
                    fragments[1:] = fragments[1:4] + fragments[2:5]
                    # todo: split on '/'

        return positions

if __name__ == "__main__":
    print(load_mesh("../data/particles/raw/TORI-GATETDF.obj"))
    #print(load_materials("../data/particles/raw/TORI-GATETDF.mtl"))

    #if len(sys.argv) < 3:
    #    print(sys.argv[0] + " <input obj> <output geom>")
