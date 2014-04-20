#!/usr/bin/python

# reads the file passed as argument and writes it into stdout
# omitting lines that contain #debug

import sys

if len(sys.argv) < 2:
	print("bad arguments"+sys.argv)
	exit

input_file = open(sys.argv[1], "r")
if len(sys.argv) == 3:
	output_file = open(sys.argv[2], "w")
else:
	output_file = sys.stdout

lines = input_file.readlines()
debug = 0
for line in lines:
	if "#debug{{" in line:
		debug = 1
	if "#debug}}" in line:
		debug = 0
	if debug == 0 and not "#debug" in line:
		output_file.write(line)

input_file.close()
output_file.close()
