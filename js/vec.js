var canvas;
var ctx;
var ws;
var fullscreen = false;
var current_x = -1;
var current_y = -1;

var keymap = [ null, null, null, null, null, null, null, null,
               null, null, null, null, null, null, null, null,
               null, null, null, null, null, null, null, null,
               null, null, null, null, null, null, null, null,
               0x2C, 0x1E, 0x34, 0x20, 0x21, 0x22, 0x24, 0x34, 
               0x26, 0x27, 0x25, 0x2E, 0x36, 0x2D, 0x37, 0x38,
               0x27, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24,
               0x25, 0x26, 0x33, 0x33, 0x36, 0x2E, 0x37, 0x38,
               null, null, null, null, null, null, null, null,
               null, null, null, null, null, null, null, null,
               null, null, null, null, null, null, null, null,
               null, null, null, 0x2F, 0x31, 0x30, 0x23, 0x2D,
               0x1F, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
               0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12,
               0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A,
               0x1B, 0x1C, 0x1D, 0x2F, 0x31, 0x30, 0x31, null ];

function fullscreenIII() {
    fullscreen = !fullscreen;
    if (fullscreen) {
        canvas.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function decay() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

var receiveTYPE = [null, null, receivePoint, receiveLine, receiveShort,
                   shortPoint];

function next(fn) {
    ws.on('message', fn);
    if (ws.rQlen() > 0) {
        fn();
    }
}

function receiveCommand() {
    if (ws.rQlen() >= 1) {
        var type = ws.rQshiftBytes(1)[0];
        if (type < receiveTYPE.length) {
            next(receiveTYPE[type]);
        }
    }
}

function receivePoint() {
    if (ws.rQlen() >= 4) {
        var bytes = ws.rQshiftBytes(4);
        x = (bytes[0] << 8) | bytes[1];
        y = (bytes[2] << 8) | bytes[3];
        console.log(">> Point " + x + "," + y);
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(x, y, 1, 1);
        current_x = x;
        current_y = y;
        next(receiveCommand);
    }
}

function receiveLine() {
    if (ws.rQlen() >= 8) {
        var bytes = ws.rQshiftBytes(8);
        x1 = (bytes[0] << 8) | bytes[1];
        y1 = (bytes[2] << 8) | bytes[3];
        x2 = (bytes[4] << 8) | bytes[5];
        y2 = (bytes[6] << 8) | bytes[7];
        ctx.strokeStyle = "#00FF00";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        current_x = x2;
        current_y = y2;
        next(receiveCommand);
    }
}

function receiveShort() {
    if (ws.rQlen() >= 2) {
        var bytes = ws.rQshiftBytes(2);
        dx = (bytes[0] ^ 0x80) - 0x80;
        dy = (bytes[1] ^ 0x80) - 0x80;
        ctx.strokeStyle = "#00FF00";
        ctx.beginPath();
        ctx.moveTo(current_x, current_y);
        current_x += dx;
        current_y += dy;
        ctx.lineTo(current_x, current_y);
        ctx.stroke();
        next(receiveCommand);
    }
}

function shortPoint() {
    if (ws.rQlen() >= 2) {
        var bytes = ws.rQshiftBytes(2);
        current_x += (bytes[0] ^ 0x80) - 0x80;
        current_y += (bytes[1] ^ 0x80) - 0x80;
        console.log(">> ShortPoint " + current_x + "," + current_y);
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(current_x, current_y, 1, 1);
        next(receiveCommand);
    }
}

function receiveCLOSE(bytes)
{
    console.log(">> CLOSE");
    ws.close();
    ws = null;
}

function connectIII() {
    if (ws)
        ws.close();

    ws = new Websock();
    ws.on('message', receiveCommand);
    ws.on('error', function(e) {
        console.log(">> WebSockets.onerror");
    });

    uri = 'ws://its.pdp10.se:33100';
    ws.open(uri);
}

window.onload = function() {
    canvas  = document.getElementById("iii");
    canvas.style.width = 1024;
    canvas.style.height = 1024;
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setInterval(function() {
            decay();
        }, 30);
    }

    if (window.attachEvent) {
        window.attachEvent('onkeydown', keydown);
        window.attachEvent('onkeyup', keyup);
    } else if (window.addEventListener) {
        window.addEventListener('keydown', keydown, false);
        window.addEventListener('keyup', keyup, false);
    }

    connectIII();
}

function sendKey(code, state) {
    if (!ws)
        return;
    if (!code)
        return;
    var buf = [1, state, code];
    ws.send(buf);
    console.log("Key sent: " + buf);
}

function keydown(ev) {
    console.log("Key down: " + ev);
    if (ws)
        ev.preventDefault();
    var keysym = getKeysym(ev);
    console.log("Keysym: " + keysym);
    switch(keysym) {
    case 0xFFFF: //Delete -> Rubout
    case 0xFF08: sendKey(0x2A, 1); break; //Backspace -> Rubout
    case 0xFF09: sendKey(0x2B, 1); break; //Tab -> Tab
    case 0xFF0D: sendKey(0x28, 1); break; //Return -> Return
    case 0xFF1B: sendKey(0, 1); break; //Esc -> Altmode
    case 0xFFBE: sendKey(0, 1); break; //F1 -> CALL
    case 0xFFBF: sendKey(0, 1); break; //F2 -> ESC
    case 0xFFC8: fullscreenTV(); break; //F11 -> Fullscreen
    case 0xFFE1: sendKey(0xE1, 1); break;
    case 0xFFE3: sendKey(0xE0, 1); break; //Control -> Control
    case 0xFFE9: sendKey(0xE2, 1); break; //Alt -> Meta
    default:
        if (keysym < keymap.length)
            sendKey(keymap[keysym], 1);
        break;
    }
}

function keyup(ev) {
    console.log("Key up: " + ev);
    if (ws)
        ev.preventDefault();
    var keysym = getKeysym(ev);
    console.log("Keysym: " + keysym);
    switch(keysym) {
    case 0xFFFF: //Delete -> Rubout
    case 0xFF08: sendKey(0x2A, 2); break; //Backspace
    case 0xFF09: sendKey(0x2B, 2); break; //Tab
    case 0xFF0D: sendKey(0x28, 2); break; //Return
    case 0xFF1B: sendKey(0, 2); break; //Esc
    case 0xFFBE: sendKey(0, 2); break; //F1 -> CALL
    case 0xFFBF: sendKey(0, 2); break; //F2 -> ESC
    case 0xFFC8: fullscreenTV(); break; //F11 -> Fullscreen
    case 0xFFE1: sendKey(0xE1, 2); break;
    case 0xFFE3: sendKey(0xE0, 2); break; //Control -> Control
    case 0xFFE9: sendKey(0xE2, 2); break; //Alt -> Meta
    default:
        if (keysym < keymap.length)
            sendKey(keymap[keysym], 2);
        break;
    }
}

function button() {
    if (ws) {
        ws.close();
        ws = null;
	document.getElementById("button").value = "Connect";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
	document.getElementById("button").value = "Disconnect";
        connectIII();
    }
}
