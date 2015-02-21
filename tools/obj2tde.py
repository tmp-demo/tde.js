import os
import sys
import json
import itertools

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

        outputPositions = []
        outputNormals = []
        outputColors = []

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
                    fragments[1:] = fragments[1:4] + [fragments[3], fragments[1], fragments[4]]
                outputPositions.extend([positions[int(indices.split('/')[0]) - 1] for indices in fragments[1:]])
                outputNormals.extend([normals[int(indices.split('/')[1]) - 1] for indices in fragments[1:]])
                outputColors.extend([(currentMaterial["diffuse"]) for indices in fragments[1:]])

        # flatten tuples
        outputPositions = list(itertools.chain.from_iterable(outputPositions))
        outputNormals = list(itertools.chain.from_iterable(outputNormals))
        outputColors = list(itertools.chain.from_iterable(outputColors))

        return {
            "type": "buffers",
            "positions": outputPositions,
            "normals": outputNormals,
            "colors": outputColors,
            "mode": "gl.TRIANGLES",
            "vertex_count": int(len(outputPositions) / 3)
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(sys.argv[0] + " <input obj> <output geom>")
        sys.exit(1)

    mesh_data = load_mesh(sys.argv[1])
    with open(sys.argv[2], "w") as outFile:
        outFile.write(json.dumps(mesh_data))
