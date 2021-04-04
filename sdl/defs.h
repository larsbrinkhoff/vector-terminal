#include <stdio.h>

enum event {
  EVENT_DECAY = 1,
  EVENT_POINT = 2,
  EVENT_LINE = 3
};

extern void display (void);
extern int network (void *);
extern void draw_line (int x1, int y1, int x2, int y2);
extern void draw_point (int x, int y);
extern void fatal (char *format, ...);
extern FILE *debug;
