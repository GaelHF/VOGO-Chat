import express from 'express';
import { Server } from "socket.io";
import { createServer } from 'node:http';
import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('chat.db');

//LAUNCHING
console.log("\x1b[36mVOGO CHAT, MADE BY @GAELHF\x1b[0m")
console.log("\x1b[36mVC > Starting connection...\x1b[0m")

db.prepare(`CREATE TABLE IF NOT EXISTS Chat(pseudo TEXT, message TEXT)`).run();

const app = express();
const server = createServer(app)
const io = new Server(server)

app.use(express.static("public"));

//LOADING DATA
const data = fs.readFileSync('config.json', 'utf8');
const jsonData = JSON.parse(data);
if(jsonData.port === "default") jsonData.port = 8000;

io.on("connection", (socket) => {
    console.log('\x1b[33mVC > User Connected\x1b[0m');
    const table = db.prepare('SELECT * FROM Chat').all()

    for(const message of table) {
        socket.emit("new message", message);
    }

    socket.on("new message", (args) => {
        db.prepare('INSERT INTO Chat(pseudo, message) VALUES (?, ?)').run(args.pseudo, args.message)
        socket.broadcast.emit("new message", args);
        console.log(`\nNouveau Message !\nPseudo : ${args.pseudo}\nContenu : ${args.message}\n`);
    });

    socket.on("empty database", () => {
        console.log("\x1b[35mVC > Emptying the database...\x1b[0m");

        try {
            const action = db.prepare('DELETE FROM Chat');
            action.run();
            console.log("\x1b[35mVC > Database emptied\x1b[0m");
        } catch (error) {
            console.error(`Error while emptying database: ${error}`);
        }

        io.emit("database emptied");
    })

    socket.emit("configured title", jsonData.name);

    socket.on('disconnect', function () {
        console.log('\x1b[33mVC > User Disconnected\x1b[0m');
    });
});

console.log(`\x1b[32mVC > Connected to : http://localhost:${jsonData.port}/\x1b[0m`);
server.listen(jsonData.port);