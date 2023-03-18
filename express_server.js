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



// 1- Display the list of short URLs for the logged-in user
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

  // Filter the urlDatabase to show only the URLs for the logged-in user
  const filteredURLs = Object.keys(urlDatabase)
    .filter(key => urlDatabase[key].userID === user_id)
    .reduce((obj, key) => {
      obj[key] = urlDatabase[key];
      return obj;
    }, {});

  console.log('filteredURLs:', filteredURLs);

  // Render the template with the filtered URLs or a message if there are no URLs
  const templateVars = {
    user_id: user.email,
    urls: filteredURLs,
    message: !Object.keys(filteredURLs).length ? "You have no URLs yet" : null
  };

  console.log('templateVars:', templateVars);

  res.render("urls_index", templateVars);
});




// 2- Handle creating a new short URL
app.post("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  
  // Check if the user is not logged in
  if (!user) {
    return res.status(401).send("You need to be logged in to create a new URL");
  }
  
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  // Add the new URL to the urlDatabase with the user's ID
  urlDatabase[shortURL] = { longURL: longURL, userID: user_id };
  
  // Redirect to the page to view the new URL
  res.redirect(`/urls`);
});


// 3- Display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  
  // Check if the user is not logged in
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  // Render the template if user is logged in
  const templateVars = {
    user_id: user.email
  };
  res.render("urls_new", templateVars);
});




// 4- GET /u/:id route
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) { // If ID is not found in the database
    return res.status(404).send("The requested URL was not found."); // Return a 404 status code and error message
  }
  const longURL = urlDatabase[req.params.id].longURL; // Get the long URL from the database using the short URL ID
  res.redirect(longURL); // Redirect to the long URL
});


// 5- Handle GET requests to the /urls/:id endpoint
app.get("/urls/:id", (req, res) => {
  // Extract the short URL parameter from the request
  const shortURL = req.params.id;

  // Look up the corresponding long URL from the urlDatabase using the short URL
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    id: shortURL,
    longURL
  }


  // Redirect the user to the long URL
  res.render("urls_show", templateVars);
});


// 6- Update a long URL in the URL database
app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  
  // Check if the user is not logged in
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  // Check if the URL belongs to the user
  const url = urlDatabase[req.params.id];
  if (!url) {
    return res.status(404).send("This URL does not exist");
  }
  if (url.userID !== user_id) {
    return res.status(403).send("You do not have permission to access this URL");
  }
  
  // Render the template with the URL data
  const templateVars = {
    user_id: user.email,
    shortURL: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});



// 7 - Edit a URL
app.post("/urls/:id/edit", (req, res) => {
  const userID = req.cookies.user_id;
  const urlID = req.params.id;
  const newLongURL = req.body.longURL;
  const url = urlDatabase[urlID];

  // check if the user is logged in
  if (!userID) {
    return res.status(401).send("Please login to edit URLs.");
  }

  // check if the URL exists
  if (!url) {
    return res.status(404).send("URL not found.");
  }

  // check if the user owns the URL
  if (url.userID !== userID) {
    return res.status(403).send("You do not have permission to edit this URL.");
  }

  // update the longURL for the URL with the given ID
  urlDatabase[urlID].longURL = newLongURL;

  res.redirect("/urls");
});


// 8- Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const shortURL = req.params.shortURL;



  // Check if the short URL exists
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("Short URL not found");
  }
  
  // Check if the user is not logged in
  if (!user) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  
  // Check if the short URL belongs to the logged-in user
  if (urlDatabase[shortURL].userID !== user_id) {
    return res.status(403).send("You don't have permission to access this URL");
  }
  
  const longURL = urlDatabase[shortURL];
  
  // Render the template with the short URL, long URL and user info
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL }, user_id : null };
  console.log(`Showing URL details for short URL: ${shortURL}`);
  res.render("urls_show", templateVars);
});



// 9- Delete a URL from the URL database
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

  // Redirect to /urls
  res.redirect("/urls");
});



// 10 -This route handles the login POST request.
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


// 11 - Route handler for GET request to path "/login"
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


// 12- Route handler for GET request to path "/logout"
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
  console.log("LogOut Clearing user_id cookie:", req.cookies.user_id);
});


// 13- Handle GET requests to the /register endpoint
app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_register', templateVars);
});


// 14- This route handles user registration
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


// 15- Helper function to lookup a user by email
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


// 16- Start listening for incoming HTTP requests on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
