// Import the Express module
const express = require("express");

// Create an instance of the Express application
const app = express();

// Set the default port to 8080
const PORT = 8080;

// Set the view engine to EJS
app.set("view engine", "ejs");

// Enable parsing of URL-encoded data
app.use(express.urlencoded({ extended: true }));

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
  res.render("urls_new");
});

// Create a new short URL and add it to the URL database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
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

// Display a list of all the URLs in the URL database
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Display a specific URL and its corresponding short URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, id: shortURL, url: { shortURL, longURL } };
  res.render("urls_show", templateVars);
});

// Update a long URL in the URL database
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

// Delete a URL from the URL database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Start listening for incoming HTTP requests on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
