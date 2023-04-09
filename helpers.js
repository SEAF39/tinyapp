// helpers.js

const getUserByEmail = function(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
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


function urlsForUser(id, urlDatabase) {
  return Object.keys(urlDatabase)
    .filter(key => urlDatabase[key].userID === id)
    .reduce((obj, key) => {
      obj[key] = urlDatabase[key];
      return obj;
    }, {});
}





module.exports = { getUserByEmail, generateRandomString, urlsForUser};


