const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('index', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    } else {
        res.render('login', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    }
})



module.exports = router;