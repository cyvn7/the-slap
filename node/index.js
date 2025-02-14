import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import multer from 'multer';
import { fileURLToPath } from 'url';
import cors from 'cors';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import rateLimit from 'express-rate-limit';
import sqlSanitizer from 'sql-sanitizer';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.API_KEY;
const APP_USER_AGENT = 'TheSlap/1.0';
const SECRET = process.env.SECRET;

export const apiAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const userAgent = req.headers['user-agent'];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Access denied ' });
  }


  if (!userAgent || !userAgent.includes(APP_USER_AGENT)) {
    return res.status(403).json({ error: 'Invalid user agent' });
  }

  next();
};


const app = express();
app.use('/api', apiAuth);
app.use(sqlSanitizer);
const SQLiteStoreSession = SQLiteStore(session);

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});
const limiterOneSec = rateLimit({
  windowMs: 1000,
  max: 1,
});
const limiterThreeSecs = rateLimit({
  windowMs: 3000,
  max: 1
});


app.use(cors({
  origin: 'https://localhost',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'User-Agent'],
  exposedHeaders: ['x-api-key']
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(session({
  store: new SQLiteStoreSession({ db: 'sessions.sqlite', dir: './db' }),
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    maxAge: 3600000,
    sameSite: 'strict'
  }
}));


const dbDir = path.resolve('./db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}


const dbPromise = open({
  filename: path.join(dbDir, 'theslap.sqlite'),
  driver: sqlite3.Database
});

const createTable = async () => {
  const db = await dbPromise;
  console.log(crypto.randomBytes(32).toString('hex'));
  //await db.exec(`DROP TABLE IF EXISTS users`);  //Testowe
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    secret TEXT,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_attempt DATETIME,
    public_key TEXT,
    private_key TEXT
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postedid INTEGER NOT NULL,
    body TEXT NOT NULL,
    mood TEXT NOT NULL,
    emoji TEXT NOT NULL,
    image TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    signature TEXT,
    FOREIGN KEY (postedid) REFERENCES users(id)
  )`);

  await db.exec(`CREATE TABLE IF NOT EXISTS logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  //Testowe:

  // const users = await db.all(`SELECT * FROM users`);
  // console.log('Users table:', users);


  // const posts = await db.all(`SELECT * FROM posts`);
  // console.log('Posts table:', posts);


  // const logins = await db.all(`SELECT * FROM logins`);
  // console.log('Logins table:', logins);
};

createTable();


app.post('/api/register', limiterThreeSecs, async (req, res) => {
  console.log("hello");
  try {
    const { name, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); 


    const secret = new OTPAuth.Secret();
    const secretBase32 = secret.base32;
    

    const totp = new OTPAuth.TOTP({
      issuer: "the-slap.com",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secretBase32
    });

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const otpauth_url = totp.toString();
    console.log('Registration secret:', secretBase32);

    QRCode.toDataURL(otpauth_url, (err) => {
      console.log(otpauth_url)
      })

    const db = await dbPromise;
    await db.run(`INSERT INTO users (name, email, password, secret, public_key, private_key) VALUES (?, ?, ?, ?, ?, ?)`, [name, email, hashedPassword, secretBase32, publicKey, privateKey]);
    res.status(200).json({
      user: { name, email },
      qrUrl: otpauth_url
    });
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

const checkLoginAttempts = async (email) => {
  const db = await dbPromise;
  const user = await db.get(`
    SELECT failed_attempts, last_failed_attempt 
    FROM users 
    WHERE email = ?
  `, email);

  if (!user) return true;

  const now = new Date();
  const lockoutDuration = 15 * 60 * 1000;
  const maxAttempts1 = 5;
  const maxAttempts2 = 8;
  const maxAttempts3 = 10;

  if (user.failed_attempts >= maxAttempts3) {
    return 'Account is permanently locked due to too many failed login attempts.';
  }

  if (user.failed_attempts == maxAttempts2 && 
      user.last_failed_attempt && 
      (now - new Date(user.last_failed_attempt)) < lockoutDuration) {
    const remainingTime = Math.ceil((lockoutDuration - (now - new Date(user.last_failed_attempt))) / 60000);
    return `Account is locked. Please try again in ${remainingTime} minutes.`;
  }

  if (user.failed_attempts == maxAttempts1 && 
      user.last_failed_attempt && 
      (now - new Date(user.last_failed_attempt)) < lockoutDuration) {
    const remainingTime = Math.ceil((lockoutDuration - (now - new Date(user.last_failed_attempt))) / 60000);
    return `Account is locked. Please try again in ${remainingTime} minutes.`;
  }

  return true;
};


// POST method to login a user
app.post('/api/login', limiterOneSec, async (req, res) => {
  try {
    const db = await dbPromise;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const { email, password, token } = req.body;
    const loginCheck = await checkLoginAttempts(email);
    if (loginCheck !== true) {
      console.log(loginCheck);
      return res.status(429).send(loginCheck);
    }
    const user = await db.get(`SELECT id, name, password, secret FROM users WHERE email = ?`, email);
    const logLoginAttempt = async (success) => {
      await db.run(`
        INSERT INTO logins (user_id, username, ip_address, user_agent, success)
        VALUES (?, ?, ?, ?, ?)
      `, [user?.id || null, email, ip, userAgent, success]);
    };

    if (!user) {
      await logLoginAttempt(false);
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logLoginAttempt(false);
      await db.run(`
        UPDATE users 
        SET failed_attempts = failed_attempts + 1,
            last_failed_attempt = CURRENT_TIMESTAMP
        WHERE id = ?`, 
        user.id
      );
      return res.status(401).send('Invalid email or password');
    }

    console.log('Stored secret:', user.secret);

    const totp = new OTPAuth.TOTP({
      issuer: "the-slap.com",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.secret)
    });


    const delta = totp.validate({
      token,
      window: 1
    });

    console.log('Token validation result:', delta);

    if (delta === null) {
      await logLoginAttempt(false);
      await db.run(`
        UPDATE users 
        SET failed_attempts = failed_attempts + 1,
            last_failed_attempt = CURRENT_TIMESTAMP
        WHERE id = ?`, 
        user.id
      );
      return res.status(401).send('Invalid 2FA token');
    }
    await db.run(`
      UPDATE users 
      SET failed_attempts = 0,
          last_failed_attempt = NULL 
      WHERE id = ?`, 
      user.id
    );

    await logLoginAttempt(true);
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userIp = req.ip;
    req.session.userAgent = req.headers['user-agent'];
    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

const createSignatureMessage = (data) => JSON.stringify({
  body: data.body,
  emoji: data.emoji,
  mood: data.mood,
  userId: data.userId
}, Object.keys({}).sort());




app.post('/api/newpost', limiterOneSec, upload.single('image'), async (req, res) => {
  try {
    const db = await dbPromise;
    const { body, mood, emoji } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }
    if (body.length > 1000 || mood.length > 100 || emoji.length > 10) {
      return res.status(400).send('Content too long');
    }

    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);

    const allowedChars = /^[\p{L}\p{N}\s.,!?'"()\-:;@#$%&*+=<>/]{1,1000}$/u;
    const cleanBody = DOMPurify.sanitize(body, {
      ALLOWED_TAGS: ['b', 'i', 'u'],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onload', 'onclick', 'onmouseover']
    });
    const cleanMood = DOMPurify.sanitize(mood);
    console.log(DOMPurify.sanitize(cleanBody));
    if (!allowedChars.test(cleanBody) || !allowedChars.test(cleanMood)) {
      console.log('Invalid characters in post content or mood.');d
      return res.status(400).send('Invalid characters in post content or mood.');
    }


    const user = await db.get('SELECT private_key FROM users WHERE id = ?', userId);
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(createSignatureMessage({
      cleanBody, cleanMood, emoji, userId
    }));
    const signature = sign.sign(user.private_key, 'base64');





    await db.run(`INSERT INTO posts (postedid, body, mood, emoji, image, signature) VALUES (?, ?, ?, ?, ?, ?)`, [userId, cleanBody, cleanMood, emoji, image, signature]);
    const query = `INSERT INTO posts (postedid, body, mood, emoji, image, signature) VALUES (${userId}, '${cleanBody}', '${cleanMood}', '${emoji}', '${image}', '${signature}')`;
    console.log(query);
    res.status(200).send('Post created successfully');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});


app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      userName: req.session.userName,
      userId: req.session.userId,
      userIp: req.session.userIp,  
      userAgent: req.session.userAgent 
    });
  } else {
    res.json({
      loggedIn: false
    });
  }
});

app.delete('/api/user/:id', limiterThreeSecs, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await dbPromise;


    const userPosts = await db.all(
      `SELECT image FROM posts WHERE postedid = ?`, 
      id
    );


    for (const post of userPosts) {
      if (post.image) {
        const imagePath = path.join(__dirname, post.image);
        try {
          await fs.promises.unlink(imagePath);
          console.log('Deleted image:', imagePath);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
    }

    await db.run(
      `DELETE FROM posts WHERE postedid = ?`, 
      id
    );

    await db.run(
      `DELETE FROM users WHERE id = ?`, 
      id
    );

    await db.run(
      `DELETE FROM logins WHERE user_id = ?`,
      id
    )

    req.session.destroy(err => {
      if (err) {
        console.error('Error clearing session:', err);
      }
    });

    res.status(200).send(`User with ID ${id} and all associated data deleted`);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user and associated data');
  }
});

app.post('/api/logout', limiterOneSec, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.status(200).send('Logout successful');
  });
});



app.get('/api/posts', async (req, res) => {
  try {
    const db = await dbPromise;
    const posts = await db.all(`
      SELECT 
        posts.*,
        users.name as userName,
        users.public_key as userPublicKey
      FROM posts
      JOIN users ON posts.postedid = users.id
      ORDER BY posts.timestamp DESC
    `);

    const postsWithVerification = posts.map(post => {
      let verified = false;
      try {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(createSignatureMessage({
          body: post.body,
          mood: post.mood,
          emoji: post.emoji,
          userId: post.postedid
        }));
        verified = verify.verify(post.userPublicKey, post.signature, 'base64');
      } catch (error) {
        console.error(`Verification error for post ${post.id}:`, error);
      }
      return { ...post, verified };
    });

    res.status(200).json(postsWithVerification);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Error fetching posts');
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const db = await dbPromise;
    const post = await db.get(`SELECT postedid, image FROM posts WHERE id = ?`, postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.postedid !== userId) {
      return res.status(403).send('Forbidden');
    }

    if (post.image) {
      const imagePath = path.join(__dirname, post.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting image:', err);
        } else {
          console.log('Image deleted:', imagePath);
        }
      });
    }

    await db.run(`DELETE FROM posts WHERE id = ?`, postId);
    res.status(200).send('Post deleted successfully');
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

app.post('/verify-2fa', async (req, res) => {
  try {
    const { username, token } = req.body;
    const db = await dbPromise;
    const user = await db.get(`SELECT id, secret FROM users WHERE name = ?`, username);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const base32_secret = generateBase32Secret();
    user.secret = base32_secret;
    
    let totp = new OTPAuth.TOTP({
      issuer: "the-slap.com",
      label: "The Slap",
      algorithm: "SHA1",
      digits: 6,
      secret: base32_secret,
    });

    let delta = totp.validate({ token });
    if (delta !== null) {
      return res.json({
        status: "success",
        message: "Authentication successful"
      });
    } else {
      return res.status(401).json({
        status: "fail",
        message: "Authentication failed"
      });
    }
  } catch (error) {
    res.status(500).send('Error');
    console.log(error);
  }
});

app.post('/api/reset-password', limiterOneSec, async (req, res) => {
  try {
    const { oldPassword, newPassword, twoFactorCode } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const db = await dbPromise;
    const user = await db.get(`SELECT password, secret FROM users WHERE id = ?`, userId);

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid old password');
    }

    const totp = new OTPAuth.TOTP({
      issuer: "the-slap.com",
      label: "The Slap",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.secret)
    });

    const delta = totp.validate({ token: twoFactorCode });
    if (delta === null) {
      return res.status(401).send('Invalid 2FA token');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedNewPassword, userId]);

    res.status(200).send('Password reset successful');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('Error resetting password');
  }
});

const generateBase32Secret = () => {
  const buffer = crypto.randomBytes(15);
  const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
  return base32;
};

app.get('/api/user/posts', async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const db = await dbPromise;
    const posts = await db.all(`
      SELECT posts.*
      FROM posts
      WHERE posts.postedid = ?
      ORDER BY posts.timestamp DESC
    `, userId);

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).send('Error fetching user posts');
    console.log(error);
  }
});

app.get('/api/login-history', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized');
    }

    const db = await dbPromise;
    const loginHistory = await db.all(`
      SELECT 
        logins.id,
        logins.username,
        logins.ip_address,
        logins.user_agent,
        logins.success,
        logins.attempt_time
      FROM logins
      WHERE logins.user_id = ?
      ORDER BY attempt_time DESC
      LIMIT 100
    `, req.session.userId);

    res.json(loginHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.listen(3000, () => console.log(`App running on port 3000.`));