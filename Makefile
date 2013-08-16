all: blob2png

blob2png: blob2png.c
	gcc -Wall -O2 blob2png.c -o blob2png
