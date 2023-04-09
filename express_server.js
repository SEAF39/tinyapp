// express_server.js

const express = require("express");
const { getUserByEmail,generateRandomString, urlsForUser} = require('./helpers');
const { urlDatabase, users} = require('./data');

const app = express();
const PORT = 8080;


const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['secretkey1', 'secretkey2', 'secretkey3'],
  maxAge: 24 * 60 * 60 * 1000
}));


// This route handles GET requests to the '/get-session' endpoint
app.get('/get-session', function(req, res) {
  let user_id = req.session.user_id;
  res.send('User ID is ' + user_id);
});


/*
Import the bcryptjs library, Define the password to be hashed (assuming it's found in the req.body object),Hash the password using bcrypt and a salt factor of 10 (10 rounds of hashing).
 */
const bcrypt = require('bcryptjs');
const password = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password, 10);


/*Add the cookie-parser middleware to the Express application
cookie-parser is a third-party middleware that adds cookie parsing functionality to Express
*/
const cookieParser = require('cookie-parser');
app.use(cookieParser());


// Set the view engine to EJS
app.set("view engine", "ejs");


app.use(express.urlencoded({ extended: true }));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  const userUrls = urlsForUser(user_id, urlDatabase);
  const templateVars = {
    user_id: user.email,
    urls: userUrls,
    message: !Object.keys(userUrls).length ? "You have no URLs yet" : null
  };
  res.render("urls_index", templateVars);
});


// 2- Route to create a new URL in the urlDatabase
app.post("/urls", (req, res) => {
  // Get the user ID from the cookie
  const user_id = req.session.user_id;
  // Find the user object in the users database using the user ID
  const user = users[user_id];

  // Check if the user is not logged in
  if (!user) {
    console.log("User is not logged in");
    // Return a 401 Unauthorized response with an error message
    return res.status(401).send("You need to be logged in to create a new URL");
  }
  
  // Generate a random short URL using the generateRandomString function
  const shortURL = generateRandomString();
  console.log("Generated short URL:", shortURL);
  
  // Get the long URL from the request body
  const longURL = req.body.longURL;
  console.log("Long URL:", longURL);
  
  // Add the new URL to the urlDatabase with the user's ID
  urlDatabase[shortURL] = { longURL: longURL, userID: user_id };
  
  // Redirect to the page to view the new URL
  res.redirect(`/urls`);
});


// 3-  Route to display the form for creating a new URL
app.get("/urls/new", (req, res) => {
  // Get the user ID from the cookie
  const user_id = req.session.user_id;
  // Find the user object in the users database using the user ID
  const user = users[user_id];

  // Check if the user is not logged in
  if (!user) {
    console.log("User is not logged in");
    // Return a 401 Unauthorized response with an error message
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  // Render the template if user is logged in
  const templateVars = {
    user_id: user.email
  };
  console.log("Rendered urls_new template with variables:", templateVars);
  res.render("urls_new", templateVars);
});


// 4- Route to redirect to the long URL corresponding to a given short URL ID
app.get("/u/:id", (req, res) => {
  // Check if the short URL ID exists in the urlDatabase
  if (!urlDatabase[req.params.id]) {
    console.log(`Short URL ${req.params.id} not found in database`); // Log an error message to the console
    return res.status(404).send("The requested URL was not found."); // Return a 404 status code and error message
  }

  // Get the long URL from the database using the short URL ID
  const longURL = urlDatabase[req.params.id].longURL;
  console.log(`Redirecting ${req.params.id} to ${longURL}`); // Log the redirection information to the console
  // Redirect to the long URL
  res.redirect(longURL);
});


// 5- Handle GET requests to the /urls/:id endpoint
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  console.log("shortURL:", shortURL);
  
  const longURL = urlDatabase[shortURL].longURL;
  console.log("longURL:", longURL);
  
  const templateVars = {
    id: shortURL,
    longURL
  };
  
  res.render("urls_show", templateVars);
});



app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  
  if (!user) {
    console.log("User not logged in");
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  const url = urlDatabase[req.params.id];
  if (!url) {
    console.log("URL not found in database");
    return res.status(404).send("This URL does not exist");
  }
  if (url.userID !== user_id) {
    console.log("User does not have permission to access this URL");
    return res.status(403).send("You do not have permission to access this URL");
  }
  
  const templateVars = {
    user_id: user.email,
    shortURL: req.params.id,
    longURL: url.longURL
  };
  console.log("URL data:", templateVars);
  res.render("urls_show", templateVars);
});


// 7 - This Route handles the POST request to edit a URL in the urlDatabase.
app.post("/urls/:id/edit", (req, res) => {
  const userID = req.session.user_id;
  const urlID = req.params.id;
  const newLongURL = req.body.longURL;
  const url = urlDatabase[urlID];

  // check if the user is logged in
  if (!userID) {
    console.log("User not logged in");
    return res.status(401).send("Please login to edit URLs.");
  }

  // check if the URL exists
  if (!url) {
    console.log("URL not found");
    return res.status(404).send("URL not found.");
  }

  // check if the user owns the URL
  if (url.userID !== userID) {
    console.log("User does not have permission to edit this URL");
    return res.status(403).send("You do not have permission to edit this URL.");
  }

  // update the longURL for the URL with the given ID
  urlDatabase[urlID].longURL = newLongURL;
  console.log("URL updated successfully");

  res.redirect("/urls");
});


// 8- Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const shortURL = req.params.shortURL;

  // Check if the short URL exists
  if (!urlDatabase[shortURL]) {
    console.log(`Short URL ${shortURL} not found`);
    return res.status(404).send("Short URL not found");
  }
  
  // Check if the user is not logged in
  if (!user) {
    console.log("User not logged in");
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  // Check if the short URL belongs to the logged-in user
  if (urlDatabase[shortURL].userID !== user_id) {
    console.log("User does not have permission to access this URL");
    return res.status(403).send("You don't have permission to access this URL");
  }
  
  const longURL = urlDatabase[shortURL];
  
  // Render the template with the short URL, long URL and user info
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL }, user_id : null };
  console.log(`Showing URL details for short URL: ${shortURL}`);
  res.render("urls_show", templateVars);
});


/*
9- This code defines an Express route handler function that deletes a URL from a database if the user is logged in and owns the URL. It also includes error handling to check if the URL exists and if the user is authorized to delete it.
 */
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
  const url = urlDatabase[req.params.id];

  // Check if URL with given ID exists
  if (!url) {
    return res.status(404).send("URL with given ID does not exist");
  }

  // Check if user is logged in
  if (!user_id) {
    return res.status(401).send("You need to be logged in to delete this URL");
  }

  // Check if user owns the URL
  if (url.userID !== user_id) {
    return res.status(403).send("You do not own this URL");
  }

  // Delete the URL from the database
  delete urlDatabase[req.params.id];
  console.log("Deleting URL with ID:", req.params.id);


  // Redirect to /urls
  res.redirect("/urls");
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("Invalid email or password");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});



/* 11 - Route handler for GET request to path "/login"
Render the login page if the user is not logged in
Otherwise, redirect to the URLs page */
app.get('/login', (req, res) => {
  console.log('session:', req.session);
  const user_id = req.session.user_id;
  if (user_id) {
    console.log(`User ID ${user_id} found in session`);
    res.redirect("/urls");
  } else {
    console.log('User ID not found in session');
    res.render('urls_login', {user_id: user_id});
  }
});


app.post("/logout", (req, res) => {
  // Clear the user_id from the session
  req.session.user_id = null;
  console.log("LogOut Clearing user_id from session:", req.session.user_id);
  res.redirect("/login");
});


/*Route handler for the "/register" endpoint, which is used to render the registration page.The route handler retrieves the user ID from the session and passes it to the templateVars object, along with the urlDatabase object.
It then renders the "urls_register" template and sends it back to the client.
 */
app.get('/register', (req, res) => {
  // Check if the user is already logged in
  if (req.session.userId) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user_id: req.session.userId,
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_register', templateVars);
});


// 14- Route for handling user registration
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  console.log(`Attempting to register user with email: ${email}`);

  // Validate that the email and password fields are present
  if (!email || !password) {
    console.log(`Registration failed: email and password are required`);
    return res.status(400).send('The Email and password are required');
  }

  // Check if the user already exists in the database
  if (getUserByEmail(email)) {
    console.log(`Registration failed: email ${email} already exists`);
    return res.status(400).send('This Email already exists');
  }

  // Hash the password and generate a user ID
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();

  // Save the new user data to the database
  users[userId] = {
    id: userId,
    name: name,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = userId;

  res.redirect('/urls');

  // Log a success message and send a response to the client
  console.log(`New user registered: ${email}`);
  res.status(201).send(`User registered successfully: ${email}`);
});






// 16- Start listening for incoming HTTP requests on the specified port.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
