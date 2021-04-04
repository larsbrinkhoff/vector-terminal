CFLAGS=-g `sdl2-config --cflags`
LDFLAGS=`sdl2-config --libs` -lSDL2_net

all: vector-terminal

clean:
	rm -f vector-terminal *.o

vector-terminal: main.o display.o network.o
	$(CC) $^ -o $@  $(LDFLAGS)

main.o: main.c defs.h
display.o: display.c defs.h
network.o: network.c defs.h
