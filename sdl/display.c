#include <SDL.h>
#include <stdlib.h>
#include "defs.h"

struct line {
  int x1, y1, x2, y2;
};

SDL_Window *window;
SDL_Renderer *renderer;
SDL_Texture *texture;
Uint32 user_event;
char *title = "Vectotron Terminal 3000";
int width = 1024, height = 1024;

static void clear (void)
{
  SDL_SetRenderDrawColor (renderer, 0, 0, 0, 255);
  SDL_RenderClear (renderer);
  SDL_RenderPresent (renderer);
}

static void decay (void)
{
  SDL_Rect rect;
  rect.x = 0;
  rect.y = 0;
  rect.w = width;
  rect.h = height;
  SDL_SetRenderDrawColor (renderer, 0, 0, 0, 33);
  SDL_SetRenderDrawBlendMode (renderer, SDL_BLENDMODE_BLEND);
  SDL_RenderFillRect (renderer, &rect);
  SDL_RenderPresent (renderer);
}

static Uint32 timer (Uint32 x, void *y)
{
  SDL_Event ev;
  SDL_memset (&ev, 0, sizeof ev);
  ev.type = user_event;
  ev.user.code = EVENT_DECAY;
  SDL_PushEvent (&ev);
  return 1000/30;
}

static void point (struct line *line)
{
  SDL_SetRenderDrawColor (renderer, 0, 255, 0, 255);
  SDL_RenderDrawPoint (renderer, line->x1, line->y1);
  free (line);
}

static void line (struct line *line)
{
  SDL_SetRenderDrawColor (renderer, 0, 255, 0, 255);
  SDL_RenderDrawLine (renderer, line->x1, line->y1, line->x2, line->y2);
  free (line);
}

void draw_line (int x1, int y1, int x2, int y2)
{
  struct line *line;
  SDL_Event ev;

  fprintf (debug, "[Line %d,%d - %d,%d]\n", x1, y1, x2, y2);

  SDL_memset (&ev, 0, sizeof ev);
  ev.type = user_event;
  ev.user.code = EVENT_LINE;
  line = malloc (sizeof (struct line));
  if (line == NULL)
    return;
  line->x1 = x1;
  line->y1 = y1;
  line->x2 = x2;
  line->y2 = y2;
  ev.user.data1 = line;
  SDL_PushEvent (&ev);
}

void draw_point (int x, int y)
{
  struct line *line;
  SDL_Event ev;

  SDL_memset (&ev, 0, sizeof ev);
  ev.type = user_event;
  ev.user.code = EVENT_POINT;
  line = malloc (sizeof (struct line));
  if (line == NULL)
    return;
  line->x1 = x;
  line->y1 = y;
  ev.user.data1 = line;
  SDL_PushEvent (&ev);
}

static void handle_user_event (SDL_UserEvent *ev)
{
  switch (ev->code)
    {
    case EVENT_DECAY:
      decay ();
      break;
    case EVENT_POINT:
      point (ev->data1);
      break;
    case EVENT_LINE:
      line (ev->data1);
      break;
    }
}

void display (void)
{
  SDL_Event ev;

  SDL_Init (SDL_INIT_EVERYTHING);
  if (SDL_CreateWindowAndRenderer (width, height, 0, &window, &renderer) < 0)
    fatal ("SDL_CreateWindowAndRenderer () failed: %s\n", SDL_GetError ());
  SDL_SetWindowTitle (window, title);

  SDL_SetHint (SDL_HINT_RENDER_SCALE_QUALITY, "linear");
  SDL_SetHint ("SDL_VIDEO_MINIMIZE_ON_FOCUS_LOSS", "0");

  texture = SDL_CreateTexture (renderer, SDL_PIXELFORMAT_RGBA8888,
			      SDL_TEXTUREACCESS_TARGET, width, height);
  clear ();

  user_event = SDL_RegisterEvents (1);
  SDL_AddTimer (1000/30, timer, NULL);

  SDL_SetTextureBlendMode (texture, SDL_BLENDMODE_BLEND);
  SDL_SetRenderDrawBlendMode (renderer, SDL_BLENDMODE_BLEND);

  while (SDL_WaitEvent (&ev) >= 0){
    switch (ev.type){
    case SDL_QUIT:
      SDL_Quit ();
      exit (0);

    case SDL_KEYDOWN:
      break;
    case SDL_KEYUP:
      break;

    case SDL_USEREVENT:
      handle_user_event (&ev.user);
      break;

    case SDL_WINDOWEVENT:
      switch (ev.window.event){
      case SDL_WINDOWEVENT_MOVED:
      case SDL_WINDOWEVENT_ENTER:
      case SDL_WINDOWEVENT_LEAVE:
      case SDL_WINDOWEVENT_FOCUS_GAINED:
      case SDL_WINDOWEVENT_FOCUS_LOST:
#if (SDL_MAJOR_VERSION > 2) || (SDL_MAJOR_VERSION == 2 &&	\
    (SDL_MINOR_VERSION > 0) || (SDL_PATCHLEVEL > 4))
      case SDL_WINDOWEVENT_TAKE_FOCUS:
#endif
	break;
      default:
	break;
      }
      break;
    }
  }
}
