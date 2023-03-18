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



const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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


// GET /urls route
app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) { // If user is not logged in, redirect to the login page
    return res.redirect("/login");
  }
  const user = users[req.cookies.user_id];
  if (!user) { // If user is not found in the database, clear the cookie and redirect to the login page
    res.clearCookie("user_id");
    return res.redirect("/login");
  }
  const templateVars = {
    user_id: user.email,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});


// Create a new short URL and add it to the URL database
app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  if (!req.cookies.user_id || !users[req.cookies.user_id]) { // Check if user is not logged in
    return res.status(401).send("You need to be logged in to shorten URLs"); // Return a 401 status code and error message
  }
  const shortURL = generateRandomString(); // Generate a new short URL
  urlDatabase[shortURL] = { longURL: longURL, userID: req.cookies.user_id }; // Save the URL to the database
  res.redirect(`/urls`); // Redirect to the new URL page
});


// Display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id || !users[req.cookies.user_id]) { // Check if user is not logged in
    return res.redirect('/login'); // Redirect to login page
  }
  // Render the template if user is logged in
  const templateVars = {
    user_id: users[req.cookies.user_id].email
  };
  res.render("urls_new", templateVars);
});


// GET /u/:id route
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]?.longURL; // Get the long URL from the database using the short URL ID
  if (!longURL) { // If ID is not found in the database
    return res.status(404).send("The requested URL was not found."); // Return a 404 status code and error message
  }
  res.redirect(longURL); // Redirect to the long URL
});


// Handle GET requests to the /urls/:id endpoint
// This endpoint takes a short URL as a parameter and redirects the user to the corresponding long URL
app.get("/urls/:id", (req, res) => {

  // Extract the short URL parameter from the request
  const shortURL = req.params.id;

  // Look up the corresponding long URL from the urlDatabase using the short URL
  const longURL = urlDatabase[shortURL].longURL;

  // Redirect the user to the long URL
  res.redirect(longURL);
});


// Update a long URL in the URL database
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  console.log(`URL ${id} updated to ${urlDatabase[id]}`);
  res.redirect("/urls");
});


// Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL }, user_id : null };
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





// This route handles the login POST request.
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
    res.cookie('user_id',user.id);
    res.redirect("/urls");
  }
});


// Route handler for GET request to path "/login"
app.get('/login', (req, res) => {
  console.log('Cookies:', req.cookies); // Debugging line
  const user_id = req.cookies.user_id;
  if (user_id) {
    console.log(`User ID ${user_id} found in cookies`); // Debugging line
    res.redirect("/urls");
  } else {
    console.log('User ID not found in cookies'); // Debugging line
    res.render('urls_login', {user_id: user_id});
  }
});


// Route handler for GET request to path "/logout"
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
  console.log("LogOut Clearing user_id cookie:", req.cookies.user_id);
});


// Handle GET requests to the /register endpoint
app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'],
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
  // Code to create a new user and save to database goes here
  res.redirect('/login');

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
