// express_server.js

// Import the Express module
const express = require("express");
const app = express();
const PORT = 8080;


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



// 1- // Route to display a list of URLs for a user by using UrlsForUser function..

function urlsForUser(id) {
  return Object.keys(urlDatabase)
    .filter(key => urlDatabase[key].userID === id)
    .reduce((obj, key) => {
      obj[key] = urlDatabase[key];
      return obj;
    }, {});
}

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  console.log('user_id:', user_id);
  console.log('user:', user);

  // Check if the user is not logged in
  if (!user) {
    console.log('User is not logged in');
    return res.status(401).send("You need to be logged in to view this page");
  }

  // Get the URLs for the logged-in user
  const userUrls = urlsForUser(user_id);

  console.log('userUrls:', userUrls);

  // Render the template with the user's URLs or a message if there are no URLs
  const templateVars = {
    user_id: user.email,
    urls: userUrls,
    message: !Object.keys(userUrls).length ? "You have no URLs yet" : null
  };

  console.log('templateVars:', templateVars);

  res.render("urls_index", templateVars);
});


// 2- Route to create a new URL in the urlDatabase
app.post("/urls", (req, res) => {
  // Get the user ID from the cookie
  const user_id = req.cookies.user_id;
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
  const user_id = req.cookies.user_id;
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
  }
  
  res.render("urls_show", templateVars);
});


/*
This route handler displays the details of a specific URL to the user, only if they are logged in and the URL belongs to them. It first checks if the user is logged in, then checks if the URL exists in the database and if it belongs to the user. If all checks pass, it renders the "urls_show" template with the URL data. It also logs helpful messages for debugging purposes.
 */
app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
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
  const userID = req.cookies.user_id;
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
  const user_id = req.cookies.user_id;
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
  const user_id = req.cookies.user_id;
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



// 10 -This route handles the login POST request form submission.
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Attempting to login user with email: ${email}`);

  // Check if the user exists in the database
  const user = getUserByEmail(email);
  if (!user) {
    console.log(`Login failed: email ${email} not found`);
    return res.status(403).send('No user with that email found.');
  }

  // Check if the password is correct
  if (!bcrypt.compareSync(password, user.password)) {
    console.log(`Login failed: incorrect password`);
    return res.status(403).send('Incorrect password.');
  }

  // Set the user_id cookie and redirect to the URLs page
  res.cookie('user_id', user.id);
  res.redirect('/urls');

  // Log a success message
  console.log(`User ${email} successfully logged in`);
});



/* 11 - Route handler for GET request to path "/login"
Render the login page if the user is not logged in
Otherwise, redirect to the URLs page */
app.get('/login', (req, res) => {
  console.log('Cookies:', req.cookies);
  const user_id = req.cookies.user_id;
  if (user_id) {
    console.log(`User ID ${user_id} found in cookies`);
    res.redirect("/urls");
  } else {
    console.log('User ID not found in cookies');
    res.render('urls_login', {user_id: user_id});
  }
});


/*
12- Route handler for GET request to path "/logout"
This route handles the POST request to /logout It clears the user_id cookie and redirects to /login
*/
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
  console.log("LogOut Clearing user_id cookie:", req.cookies.user_id);
});


/*Route handler for the "/register" endpoint, which is used to render the registration page.The route handler retrieves the user ID from the cookies and passes it to the templateVars object, along with the urlDatabase object.
It then renders the "urls_register" template and sends it back to the client.
 */
app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'],
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

  // Redirect the user to the login page
  res.redirect('/login');

  // Log a success message and send a response to the client
  console.log(`New user registered: ${email}`);
  res.status(201).send(`User registered successfully: ${email}`);
});


// 15- Helper function to lookup a user by email.
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


// 16- Start listening for incoming HTTP requests on the specified port.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
