#include <SDL.h>
#include <SDL_net.h>
#include "defs.h"

static int current_x, current_y;

static TCPsocket connect (char *host, int port)
{
  IPaddress address;
  TCPsocket s;
  if (SDLNet_ResolveHost (&address, host, port) == -1)
    fatal ("Error resolving host name %s: %s\n",
           host, SDLNet_GetError());
  s = SDLNet_TCP_Open (&address);
  if (s == 0)
    fatal ("Error connecting to %s: %s\n",
           host, SDLNet_GetError());
  return s;
}

static int
receive (TCPsocket s, void *data, int n)
{
  int m;

  /* The documentation claims a successful call to SDLNet_TCP_Recv
   * should always return n, and that anything less is an error.
   * This doesn't appear to be true, so this loop is necessary
   * to collect the full buffer. */

  while (n > 0) {
    m = SDLNet_TCP_Recv (s, data, n);
    if (m <= 0)
      return -1;
    data += m;
    n -= m;
  }

  return 0;
}

int network (void *ignore)
{
  unsigned char command[10];
  TCPsocket sock;
  int x, y;

  sock = connect ("localhost", 12345);

  for (;;) {
    receive (sock, command, 1);
    switch (command[0]) {
    case EVENT_POINT:
      receive (sock, command, 4);
      current_x = (command[0] << 8) | command[1];
      current_y = (command[2] << 8) | command[3];
      draw_point (current_x, current_y);
      break;
    case EVENT_LINE:
      receive (sock, command, 8);
      x = (command[0] << 8) | command[1];
      y = (command[2] << 8) | command[3];
      current_x = (command[4] << 8) | command[5];
      current_y = (command[6] << 8) | command[7];
      draw_line (x, y, current_x, current_y);
      break;
    case EVENT_SHORT:
      receive (sock, command, 2);
      x = current_x;
      y = current_y;
      current_x += (command[0] ^ 0x80) - 0x80;
      current_y += (command[1] ^ 0x80) - 0x80;
      draw_line (x, y, current_x, current_y);
      break;
    }
  }
}
