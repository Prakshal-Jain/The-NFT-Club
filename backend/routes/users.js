var express = require("express");
var router = express.Router(); 

// Base path: "/api/users"

router.get('/', (req, res) => {
    res.status(200);
    res.send("GET request for users");
});

router.post('/signup', (req, res) => {
    // Set a token as cookie on signup
    console.log(req.body)
    res.status(200);
    res.send("POST request for signup");
});

router.post('/login', (req, res) => {
    // Set a token as cookie on login
    console.log(req.body)
    res.status(200);
    res.send("POST request for signup");
});


router.get('/profile', (req, res) => {
    // Get the token cookie and check if it is exist and valid. Is true, return data related to the corresponding user.
    console.log(req.cookies)
    res.status(200);
    res.send("GET request for user detail");
}); 

// implement CRUD 4 user 

module.exports = router; 