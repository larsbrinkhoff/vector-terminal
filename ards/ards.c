#include <stdio.h>
#include <stdint.h>

static uint8_t args[4];
static int length;
static void (*process) (uint8_t c);

static int coord (uint8_t *data)
{
  int x = (data[0] & 076) >> 1;
  x |= (data[1] & 037) << 5;
  if (data[0] & 1)
    x = -x;
  return x;
}

static void character (uint8_t c)
{
}

static void set_point (uint8_t c)
{
  if (length < 4)
    args[length++] = c;
  else {
    move_point (coord (args), coord (args + 2));
    args = 0;
  }
}

static void long_vector (uint8_t c)
{
  if (length < 4)
    args[length++] = c;
  else {
#if 0
		      if (data[2] & 040)
			; //fprintf (stderr, "[INVISIBLE]");
		      else
			draw_vector(cr, cr2);
		      if (data[0] & 040)
			; //fprintf (stderr, "[DOTTED]");
#endif

    draw_vector (coord (args), coord (args + 2));
    args = 0;
  }
}

static void short_vector (uint8_t c)
{
  if (length < 2)
    ;
  else {
    int x, y;
    x = (data[0] & 076) >> 1;
    if (data[0] & 1)
      x = -x;
    y = (data[1] & 076) >> 1;
    if (data[1] & 1)
      y = -y;
  }
}




		      args = 2;
		      draw_vector(cr, cr2);
		      //fprintf (stderr, "[S VEC @ %d,%d - %d,%d]", x0, y0, x2, y2);
		      x0 = x2;
		      y0 = y2;
		      break;
		    }

static void mode (void (*new) (uint8_t))
{
  length = 0;
  memset (args, 0, sizeof args);
  process = new;
}  

int main (int argc, char **argv)
{
  int c;

  process = character;

  for (;;) {
    c = getchar ();
    if (c == EOF)
      exit (1);

    process (c);

  switch (c) {

  case 000: case 001: case 002: case 003: case 004: case 005:
  case 006: case 016: case 017: case 020: case 021: case 022:
  case 023: case 024: case 025: case 026: case 027: case 030:
  case 031: case 032: case 033: case 034:
    mode (character);
    break;
  case 007:
    mode (character);
    // bell
    break;
  case 010:
    mode (character);
    // backspace
    break;
  case 011:
    mode (character);
    // tab
    break;
  case 012:
    mode (character);
    // linefeed
    break;
  case 013:
    mode (character);
    //
    break;
  case 014:
    mode (character);
    // clear screen
    break;
  case 015:
    mode (character);
    // carriage return
    break;
  case 035:
    mode (set_point);
    break;
  case 036:
    mode (long_vector);
    break;
  case 037:
    mode (vector);
    break;
  default:
    process (c);
    break;
  }

    switch (c) {
    case 034:
    default:
      // leave graphcis mode
      break;
    case 035:
      //fprintf (stderr, "[POINT]");
      mode = 1;
      args = 4;
      break;
    case 036:
      //fprintf (stderr, "[E VEC]");
      mode = 2;
      args = 4;
      break;
    case 037:
      //fprintf (stderr, "[S VEC]");
      mode = 3;
      args = 2;
      break;
    }
  }
}
