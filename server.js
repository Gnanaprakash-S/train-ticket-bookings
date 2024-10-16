const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.json()); // To parse JSON data
// Example user credentials
const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    },
    {
      username: 'user',
      password: 'user123',
      role: 'user',
    },
  ];
  

// Middleware to parse POST data
app.use(bodyParser.urlencoded({ extended: true }));

// Set views folder for HTML rendering
app.set('views', path.join(__dirname, 'views'));

// Serve static assets like CSS and JavaScript from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to the SQLite database
const db = new sqlite3.Database('./database.db');

// Home page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle POST request to /login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        if (user.role === 'admin') {
            // Redirect to admin dashboard
            res.redirect('/admin-dashboard');
        } else {
            // Redirect to user dashboard
            res.redirect('/dashboard');
        }
    } else {
        // If credentials are wrong, show error message
        res.send('Invalid username or password');
    }
    // Query to check the username and password
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            return console.error(err.message);
        }

        // Successful login
        if (row) {
            res.redirect('/dashboard');
        } else {
            res.send('Invalid username or password.');
        }
    });
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Ticket booking page
app.get('/book', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'book.html'));
});

// View tickets page
app.get('/tickets', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'tickets.html'));
});

// Cancel ticket page
app.get('/cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cancel.html'));
});

// Admin dashboard
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// Add a new train (admin)
app.get('/add-train', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add-train.html'));
});

// Handle POST request to add a new train
app.post('/add-train', (req, res) => {
    const { trainName, source, destination, seats } = req.body;
    db.run('INSERT INTO trains (train_name, source, destination, seats) VALUES (?, ?, ?, ?)', [trainName, source, destination, seats], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/admin-dashboard');
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
const bcrypt = require('bcrypt');

// Hash passwords when creating users
// bcrypt.hash('yourPassword', 10, (err, hash) => { /* store hash in db */ });

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';

    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Internal Server Error");
        }

        if (row) {
            // Compare the entered password with the hashed password in the database
            bcrypt.compare(password, row.password, (err, isMatch) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send("Internal Server Error");
                }

                if (isMatch) {
                    req.session.user = row;
                    return res.redirect('/dashboard');
                } else {
                    return res.status(401).send("Invalid username or password");
                }
            });
        } else {
            return res.status(401).send("Invalid username or password");
        }
    });
});
