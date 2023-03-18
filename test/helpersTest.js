// helpersTest.js

const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

describe('getUserByEmail', function() {
  const testUsers = {
    'userRandomID': {
      id: 'userRandomID',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password'
    },
    'user2RandomID': {
      id: 'user2RandomID',
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password2'
    }
  };

  it('return a user with valid email', function() {
    const user = getUserByEmail("alice@example.com", testUsers)
    const expectedUser = testUsers['userRandomID'];
    assert.deepEqual(user, expectedUser)
  })

  it('return null with invalid email', function() {
    const user = getUserByEmail("user22233@example.com", testUsers)
    const expectedUser = null;
    assert.deepEqual(user, expectedUser)
  })

  it('should return null if empty string', function() {
    const user = getUserByEmail("", testUsers)
    const expectedUser = null;
    assert.deepEqual(user, expectedUser)
  })
});



