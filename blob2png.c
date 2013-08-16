#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

/**
 * From a blob composed of png images stiched togeter (arg[1]), create a
 * directory, and split the blob to individual images.
 *
 * First line of output on stdout is the name of the directory created.
 */

void usage(char * path)
{
  fprintf(stderr, "Usage: %s blob\n", path);
}

int matches_png_header(uint8_t * rbuf)
{
  //printf("%x %x %x %x\n", rbuf[0], rbuf[1], rbuf[2], rbuf[3]);
  return rbuf[0] == 0x89 &&
         rbuf[1] == 'P' &&
         rbuf[2] == 'N' &&
         rbuf[3] == 'G';
}

int main(int argc, char * argv[])
{
  struct stat statbuf;
  uint8_t * rbuf;
  FILE * file;
  int rv;
  int i;
  int last_matched_header;
  int index_frames;

  if (argc != 2) {
    usage(argv[0]);
    return -1;
  }

  if (stat(argv[1], &statbuf)) {
    perror("stat");
    return -1;
  }

  rbuf = malloc(statbuf.st_size);

  file = fopen(argv[1], "r");
  if (!file) {
    perror("fopen");
    return -1;
  }

  if (fread(rbuf, statbuf.st_size, 1, file) != 1) {
    perror("fread");
    return -1;
  }

  {
    i = 0;
    char path[256];
    do {
      sprintf(path, "frames-dump-%05d", i++);
      rv = mkdir(path, 0755);
    } while (rv != 0);

    printf("%s\n", path);

    if (chdir(path)) {
      perror("chdir");
      return -1;
    }
  }

  for(i = index_frames = last_matched_header = 0; i < statbuf.st_size; i++) {
    if (i != 0 && matches_png_header(&rbuf[i])) {
      char path[256];
      FILE * dump;

      printf("Found png header at %d\n", i);

      sprintf(path, "frame-%05d.png", index_frames++);
      if (!(dump = fopen(path, "w"))) {
        perror("fopen/dump");
        return -1;
      }

      if (fwrite(&rbuf[last_matched_header], i - last_matched_header, 1, dump) != 1) {
        perror("fwrite/dump");
        return -1;
      }

      last_matched_header = i;

      fclose(dump);
    }
  }

  fclose(file);
  free(rbuf);

  return 0;
}
