// express_server.js

// Import the Express module
const express = require("express");
const app = express();
const PORT = 8080;

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

// Helper function to generate a random string
function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Display the form to create a new short URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new",{username : null});
  
});

// Create a new short URL and add it to the URL database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// Redirect to the long URL corresponding to a short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

// Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL }, username : null };
  res.render("urls_show", templateVars);
});

// Delete a URL from the URL database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Update a long URL in the URL database
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

//Route handler for GET request to path "/urls and Create an object to hold variables to be used in the template
app.get('/urls', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render('urls_index', templateVars);
});

// Route handler for POST request to path "/login"
app.post("/login", (req, res) => {
  const { username } = req.body;
  res.cookie("username", username);
  res.redirect("urls");
});

// Route handler for GET request to path "/logout"
app.get("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});


// Start listening for incoming HTTP requests on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
