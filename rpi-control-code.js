const express = require("express");
const app = express();
const {exec} = require("child_process");
const fs = require("fs");
const cors = require("cors");
const {WebSocketServer} = require("ws");
const wss = new WebSocketServer({port : 3000});
const key_map = {
    'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08, 'f': 0x09,
    'g': 0x0A, 'h': 0x0B, 'i': 0x0C, 'j': 0x0D, 'k': 0x0E, 'l': 0x0F,
    'm': 0x10, 'n': 0x11, 'o': 0x12, 'p': 0x13, 'q': 0x14, 'r': 0x15,
    's': 0x16, 't': 0x17, 'u': 0x18, 'v': 0x19, 'w': 0x1A, 'x': 0x1B,
    'y': 0x1C, 'z': 0x1D,
    '1': 0x1E, '2': 0x1F, '3': 0x20, '4': 0x21, '5': 0x22,
    '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26, '0': 0x27,
    '!': 0x1E, '"': 0x1F, '§': 0x20, '$': 0x21, '%': 0x22,
    '&': 0x23, '/': 0x24, '(': 0x25, ')': 0x26, 
    'enter': 0x28, 'escape': 0x29, 'backspace': 0x2A, 'tab' : 0x2B,
    ' ': 0x2C, '-': 0x2D, '=': 0x2E, '{': 0x2F, '}': 0x30,
    '\\': 0x31, ';': 0x33, "'": 0x34, 'GRAVE': 0x35,
    ',': 0x36, '.': 0x37, '/': 0x38,
    'CAPSLOCK': 0x39,
}
const mod_map = {
    'ctrl': 0x01,
    'shift': 0x02,
    'alt': 0x04,
};
function toHIDCoord(normalized){
	const clamped = Math.min(1, Math.max(0, normalized));
	return Math.round(clamped * 32767);
}
wss.on("connection", socket => {
	
	socket.on("message", packet => {
		let message = JSON.parse(packet.toString())
        if (message.type === "mouse") {
            let { position, buttons } = message;
            let button = buttons.left_click ? 1 : buttons.right_click ? 2 : 0;
	
            let xHID = toHIDCoord(position.x);
            let yHID = toHIDCoord(position.y);
	console.log(xHID, yHID);
            const buffer = Buffer.from([
    			button, 
    			xHID & 0xFF,         // X Low Byte
    			(xHID >> 8) & 0xFF,  // X High Byte
    			yHID & 0xFF,          // Y Low Byte
    			(yHID >> 8) & 0xFF,  // Y High Byte
		]);
            mouse_hid.write(buffer, err => {
                if (err) console.log(err);
            });
        }
		if(message.type == "keyboard"){
			let {key, modifier} = message;
			let keycode = key_map[key.toLowerCase()];
			modifier = mod_map[modifier];
			const buffer = Buffer.from([modifier, 0, keycode, 0, 0, 0, 0, 0]);
			keyboard_hid.write(buffer);
			keyboard_hid.write(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]))
			
		}
	})
})
const mouse_hid = fs.createWriteStream("/dev/hidg1");
const keyboard_hid = fs.createWriteStream("/dev/hidg0");
app.use(express.static(__dirname + "public"));
app.post("/mouse", (req, res) => {
	let {movement, buttons} = req.body;
	let button = 0;
	if(buttons == 1){
		button = 1;
	}
	if(buttons == 3){
		button = 2
	}
	console.log(movement);
	const buffer = Buffer.from([ button, movement.dx, movement.dy , 0x00]);
	console.log(buttons)
	mouse_hid.write(buffer, (err) => {
		if(err) console.log(err)
	})
	
	res.send("");
})
