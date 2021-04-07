var canvas;
var ctx;
var ws;
var fullscreen = false;
var current_x = -1;
var current_y = -1;

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

var receiveTYPE = [null, null, receivePoint, receiveLine, receiveShort];

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
        console.log(">> Line " + x1 + "," + y1 + " - " + x2 + "," + y2);
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

function keydown(ev) {
    console.log("Key down: " + ev);
}

function keyup(ev) {
    console.log("Key up: " + ev);
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
