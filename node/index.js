import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';

const app = express();
const SQLiteStoreSession = SQLiteStore(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  store: new SQLiteStoreSession({ db: 'sessions.sqlite', dir: './db' }),
  secret: '03fd1b2909430fb9b4f3f4386b33849a7883c6dbc53d99be03ead108d483c7ab7f3f17904b02699915f7ffa3e63bd8603bd624f12f8d05cffc4ad32da8444720', // Use a strong secret key and store it securely
  resave: false,
  saveUninitialized: false,
  cookie: { 
    // secure: true, // Ensure cookies are only sent over HTTPS
    httpOnly: true, // Prevent client-side scripts from accessing the cookies
    maxAge: 3600000, // Set a reasonable expiration time for sessions
    sameSite: 'strict' // Prevent CSRF attacks
  }
}));

// Ensure the db directory exists
const dbDir = path.resolve('./db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open SQLite database
const dbPromise = open({
  filename: path.join(dbDir, 'theslap.sqlite'),
  driver: sqlite3.Database
});

const createTable = async () => {
  const db = await dbPromise;
  //await db.exec(`DROP TABLE IF EXISTS posts`);
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postedid INTEGER NOT NULL,
    body TEXT NOT NULL,
    mood TEXT NOT NULL,
    emoji TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postedid) REFERENCES users(id)
  )`);
};

createTable();

// Endpoint for the root path
app.get('/', (req, res) => res.send('Welcome to the API'));

app.get('/api', (req, res) => res.send('Hello World!'));

// GET method to get all users
app.get('/api/all', async (req, res) => {
  try {
    const db = await dbPromise;
    const users = await db.all(`SELECT * FROM users`);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

// POST method to insert a user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

    const db = await dbPromise;
    await db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword]);
    res.status(200).send(req.body);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('users.name')) {
        res.status(400).send('Nazwa użytkownika jest już zajęta');
      } else if (error.message.includes('users.email')) {
        res.status(400).send('Email jest już zajęty');
      } else {
        res.status(400).send('Błąd unikalności');
      }
    } else {
      res.status(500).send('Error');
    }
    console.log(error);
  }
});

// POST method to login a user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await dbPromise;
    const user = await db.get(`SELECT id, name, password FROM users WHERE email = ?`, email);

    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userIp = req.ip; // Store the user's IP address in the session
    req.session.userAgent = req.headers['user-agent'];
    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

// POST method to add a new post
app.post('/api/newpost', async (req, res) => {
  try {
    const { body, mood, emoji } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const db = await dbPromise;
    await db.run(`INSERT INTO posts (postedid, body, mood, emoji) VALUES (?, ?, ?, ?)`, [userId, body, mood, emoji]);
    res.status(200).send('Post created successfully');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

// GET method to check session
app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      userName: req.session.userName,
      userIp: req.session.userIp,  // Include the user's IP address in the response
      userAgent: req.session.userAgent 
    });
  } else {
    res.json({
      loggedIn: false
    });
  }
});

// DELETE method to delete a user
app.delete('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await dbPromise;
    await db.run(`DELETE FROM users WHERE id = ?`, id);
    res.status(200).send(`User with ID ${id} deleted`);
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.status(200).send('Logout successful');
  });
});

// GET method to get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const db = await dbPromise;
    const posts = await db.all(`
      SELECT posts.id, posts.body, posts.mood, posts.emoji, posts.timestamp, users.name as userName
      FROM posts
      JOIN users ON posts.postedid = users.id
      ORDER BY posts.timestamp DESC
    `);
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

app.listen(3000, () => console.log(`App running on port 3000.`));