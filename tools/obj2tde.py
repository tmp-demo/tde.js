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
                currentMaterial["diffuse"] = fragments[1:4]

        return materials

def load_mesh(filename):
    with open(filename) as meshFile:
        for line in meshFile:
            fragments = line.split()

            if len(fragments) < 2:
                continue

            materials = {}
            vertices = []

            if fragments[0] == "mtllib":
                materials = load_materials(os.path.join(os.path.dirname(filename), fragments[1]))
                print(materials)

        return None

if __name__ == "__main__":
    print(load_mesh("../data/particles/raw/TORI-GATETDF.obj"))
    #print(load_materials("../data/particles/raw/TORI-GATETDF.mtl"))

    #if len(sys.argv) < 3:
    #    print(sys.argv[0] + " <input obj> <output geom>")
