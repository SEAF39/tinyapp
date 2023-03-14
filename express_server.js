// express_server.js

// Import the Express module
const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');

/*Add the cookie-parser middleware to the Express application
cookie-parser is a third-party middleware that adds cookie parsing functionality to Express
*/
const cookieParser = require('cookie-parser');
app.use(cookieParser());


// Set the view engine to EJS
app.set("view engine", "ejs");


// Enable parsing of URL-encoded data
app.use(express.urlencoded({ extended: true }));


// enable body parsing middleware for POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


// The URL database that maps short URLs to long URLs
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};


// Create a global object called users to store and access the users in the app
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Helper function to generate a random string
function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log(`Generated random string: ${result}`);
  return result;
}


// Display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  console.log("Rendering the urls_new template");
  res.render("urls_new", { username: null });
});


// Create a new short URL and add it to the URL database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log(`Added URL ${longURL} with short URL ${shortURL}`);
  res.redirect('/urls');
});


// Redirect to the long URL corresponding to a short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    console.log(`Redirecting to long URL: ${longURL}`);
    res.redirect(longURL);
  } else {
    console.log(`Short URL not found: ${req.params.shortURL}`);
    res.status(404).send("Short URL not found");
  }
});


// Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL }, username : null };
  console.log(`Showing URL details for short URL: ${shortURL}`);
  res.render("urls_show", templateVars);
});


// Delete a URL from the URL database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(`Deleting URL with short URL: ${shortURL}`);
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


// Update a long URL in the URL database
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  console.log(`URL ${id} updated to ${urlDatabase[id]}`);
  res.redirect("/urls");
});


//Route handler for GET request to path "/urls and Create an object to hold variables to be used in the template
app.get('/urls', (req, res) => {
  const templateVars = {
    username: users[req.cookies.username] ? users[req.cookies.username].email : undefined,
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_index', templateVars);
});


// Route handler for post to path "/login"
/* app.post("/login", (req, res) => {
  console.log(req.cookies)
  if (req.body.email.length === 0) {
    return res.status(400).send('Please enter your email and password');
  }
  if (req.body.password.length === 0) {
    return res.status(400).send('The Password is wrong');
  }
  const user = getUserByEmail(req.body.email, users);
  if (user === undefined) {
    return res.status(403).send('Email does not exist');
  }
  if (user) {
    console.log(user)
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(403).send('The password incorrect');
    }
    res.cookie('username',user.id);
    return res.redirect("/urls");
  }
}); */

app.post("/login", (req, res) => {
  console.log(req.cookies)
  if (req.body.email.length === 0) {
    return res.status(400).send('Please enter your email and password');
  }
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user) {
    console.log(user)
    res.status(403).send("No user with that email found.");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Incorrect password.");
  } else {
    res.cookie('username',user.id);
    res.redirect("/urls");
  }
});







// Route handler for GET request to path "/login"
app.get('/login', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_login', templateVars);
});


// Route handler for GET request to path "/logout"
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/login");
  console.log("LogOut Clearing username cookie:", req.cookies.username);
});


// Handle GET requests to the /register endpoint
app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_register', templateVars);
});

// This route handles user registration
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  console.log(`Attempting to register user with email: ${email}`);
  if (!email || !password) {
    console.log(`Registration failed: email and password are required`);
    return res.status(400).send('The Email and password are required');
  }
  if (getUserByEmail(email)) {
    console.log(`Registration failed: email ${email} already exists`);
    return res.status(400).send('This Email already exists');
  }


  // Hash the password and generate a user ID
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();
  

  // Add the new user to the database
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  console.log(`New user registered: ${email}`);
  res.status(201).send(`User registered successfully: ${email}`);
});


// Helper function to lookup a user by email
function getUserByEmail(email) {
  for (let userId in users) {
    const user = users[userId];
    console.log(`Checking user with email ${user.email}`);
    if (user.email === email) {
      console.log(`Found user with email ${email}`);
      return user;
    }
  }
  console.log(`User with email ${email} not found`);
  return null;
}


// Start listening for incoming HTTP requests on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
