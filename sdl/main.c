#include <SDL.h>
#include <stdarg.h>
#include <unistd.h>
#include "defs.h"

FILE *debug = NULL;

void fatal (char *format, ...)
{
  va_list ap;
  va_start (ap, format);
  vfprintf (stderr, format, ap);
  fprintf (stderr, "\n");
  va_end (ap);
  exit (1);
}

int main (int argc, char **argv)
{
  int opt;

  while ((opt = getopt (argc, argv, "d")) != -1)
    {
      switch (opt)
	{
	case 'd':
	  debug = stderr;
	  break;
	}
    }
  
  if (debug == NULL)
    debug = fopen ("/dev/null", "w");

  SDL_CreateThread (network, "Network", NULL);
  display ();
  return 0;
}
