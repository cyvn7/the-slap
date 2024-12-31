import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
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
    //var bcrypt = require('bcryptjs');
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

// POST method to login a user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await dbPromise;
    const user = await db.get(`SELECT password FROM users WHERE email = ?`, email);

    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

app.listen(3000, () => console.log(`App running on port 3000.`));