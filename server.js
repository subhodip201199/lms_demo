require('dotenv').config()

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const bodyParser = require('body-parser')

const pool = require('./config/database.js')

const app = express()

var url = require('url');
var cors = require('cors');
const { Console } = require("console");
const { SSL_OP_TLS_D5_BUG } = require("constants");

//-----------for file upload---------------

var formidable = require("formidable");
var fs = require("fs");



app.use(express.static(__dirname + '/uploads'));

//--------------------------

const PORT = process.env.PORT || 80

//const routes = require('./routes/index')

app.use(express.static(__dirname + '/views'));


app.use(cors());

app.set('view engine', 'ejs')
app.use(session({
    secret: 'thatsecretthinggoeshere',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use(function(req, res, next){
    res.locals.message = req.flash('message');
    next();
});

//app.use('/', routes)
require('./config/passport')(passport)

app.listen(PORT, () => {
    console.log(`Application server started on port: ${PORT}`)
})

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('home', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    } else {
        res.render('login', {
            title: 'Log In',
            user: req.user,
            message: res.locals.message
        })
    }
})

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'Your are already logged in.')
        res.redirect('/home')
    } else {
        res.render('login', {
            title: 'Login',
            user: req.user,
            message: res.locals.message
        })
    }
})
app.post('/login', (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.')
        res.redirect('/home')
    } else {
        let user = (req.body.username).toLowerCase()
        let pass = req.body.password
        if (user.length === 0 || pass.length === 0) {
            req.flash('message', 'You must provide a username and password.')
            res.redirect('/login')
        } else {
            next()
        }
    }
}, passport.authenticate('login', {
    successRedirect : '/home',
    failureRedirect : '/login',
    failureFlash : true
}))

//app.get('/register', (req, res) => {
//    if (req.isAuthenticated()) {
//        res.redirect('/register')
//    } else {
//        res.render('register', {
//            title: 'Register',
//            user: req.user,
//            message: res.locals.message
//        })
//    }
//})


//-----------------disable it for registering admin------------------//
app.post('/register', (req, res, next) => {
    if (req.isAuthenticated()) {
        //req.flash('message', 'You are already logged in.')
        //res.redirect('/profile')
        let user = (req.body.username).toLowerCase()
        let pass = req.body.password
        let passConf = req.body.passConf
        let name = req.body.name
        let phone = req.body.phone
        let email = req.body.email
        if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
            req.flash('message', 'You must provide a username, password, and password confirmation.')
            res.redirect('/add_user')
        } else if (pass != passConf) {
            req.flash('message', 'Your password and password confirmation must match.')
            res.redirect('/add_user')
        } else {
            next()
        }
    } else {
        res.redirect('/login')
    }
}, passport.authenticate('register', {
    successRedirect : '/logout',
    failureRedirect : '/logout',
    failureFlash : true
}))

//---------------------------------------------------------------//

//--------------------enable it for admin registration------------//
//app.get('/admin_registration', (req, res) => {
//  res.render('add_user');
//})
//
//app.post('/register', (req, res, next) => {
//  
//      //req.flash('message', 'You are already logged in.')
//      //res.redirect('/profile')
//      let user = (req.body.username).toLowerCase()
//      let pass = req.body.password
//      let passConf = req.body.passConf
//      let name = req.body.name
//      let phone = req.body.phone
//      let email = req.body.email
//      if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
//          req.flash('message', 'You must provide a username, password, and password confirmation.')
//          res.redirect('/add_user')
//      } else if (pass != passConf) {
//          req.flash('message', 'Your password and password confirmation must match.')
//          res.redirect('/add_user')
//      } else {
//          next()
//      }
//   
//}, passport.authenticate('register', {
//  successRedirect : '/add_user',
//  failureRedirect : '/home',
//  failureFlash : true
//}))
//-------------------------------------------------------//




app.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User [' + req.user.username + '] has logged out.')
        req.logout()
        res.redirect('/');
    } else {
        res.redirect('/')
    }
})

app.get('/profile', (req, res) => {
    if (req.isAuthenticated() && (req.user.username !== 'admin')) {
      var access = new Array();
      access.push(req.user.access1);
      access.push(req.user.access2);
      access.push(req.user.access3);
      access.push(req.user.access4);
      access.push(req.user.access5);
      
      var bool = access.includes("cashbook");
      if(bool == true){
        console.log(req.user.username + 'is allowed to access this.');
        res.render('cashbook', {
            title: 'cashbook',
            user: req.user,
            message: res.locals.message
        }); 
       } else{ 
            res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access profile!</h2>');
         }
    } else if(req.isAuthenticated() && (req.user.username == 'admin')){
        res.render('cashbook', {
          title: 'cashbook',
          user: req.user,
          message: res.locals.message
        });
    } else {
        res.redirect('/login')
    }
})



app.post('/updpass', (req, res, next) => {
    if (req.isAuthenticated()) {
        let password = req.body.password
        let newpass = req.body.newpass
        let newpassconf = req.body.newpassconf
        if (password.length === 0 || newpass.length === 0 || newpassconf.length === 0) {
            req.flash('message', 'You must provide your current password, new password, and new password confirmation.')
            res.redirect('/edit-account')
        } else if (newpass != newpassconf) { 
            req.flash('message', 'Your password and password confirmation must match.')
            res.redirect('/edit-account')
        } else {
            next()
        }
    } else {
        res.redirect('/')
    }
}, passport.authenticate('updatePassword', {
    successRedirect : '/home',
    failureRedirect : '/home',
    failureFlash : true
}))


//APIs----------------------

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('home', {
        title: 'home',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})
  
//------------------pending-------------------//
app.get("/edit-account", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('edit-account', {
      title: 'edit-account',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Edit Account!</h2>');
    
  } else{
    res.redirect('/login');
  }
});
  
//------------------------pending---------------------------//
app.get("/billing-invoice", (req, res) => {
  res.render("billing-invoice.ejs");
});

app.get("/billing-history", (req, res) => {
  res.render("billing-history.ejs");
});

app.get("/billing", (req, res) => {
  res.render("billing.ejs");
});

app.get("/instructor-earnings", (req, res) => {
  res.render("instructor-earnings.ejs");
});
//----------------------------------------------------------//



app.get("/contact", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('contact', {
        title: 'contact',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})

app.get("/invoice", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('invoice', {
        title: 'invoice',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})



app.get('/cashbook', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("cashbook");
    if(bool == true){
      console.log('Cashbook is true');
      res.render('cashbook', {
          title: 'cashbook',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Cashbook!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('cashbook', {
        title: 'cashbook',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/room', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
    console.log(req.user.username);
    console.log(req.user.access1);
    console.log(req.user.access2);
    console.log(req.user.access3);
    console.log(req.user.access4);
    console.log(req.user.access5);


    var bool = access.includes("create_room");
    if(bool == true){
      console.log('create_room is true');
      res.render('room', {
          title: 'room',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Room!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('room', {
        title: 'room',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/billing-payment", (req, res) => {
  res.render("billing-payment.ejs");
});


app.get("/add_contact", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('add_contact', {
        title: 'add_contact',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})


app.get("/billing-upgrade", (req, res) => {
  res.render("billing-upgrade.ejs");
});


app.get("/billing-upgrade", (req, res) => {
  res.render("billing-upgrade.ejs");
});


app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});


app.get("/signup-payment", (req, res) => {
  res.render("signup-payment.ejs");
});


app.get('/add_student', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
 

    var bool = access.includes("students");
    if(bool == true){
      console.log('add_students is true');
      res.render('add_student', {
          title: 'add_student',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Add Students!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_student', {
        title: 'add_student',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/student', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
    var bool = access.includes("students");
    if(bool == true){
      console.log('student is true');
      res.render('student', {
          title: 'student',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Student!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('student', {
        title: 'student',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/add_staff', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("staffs");
    if(bool == true){
      console.log('add_staffs is true');
      res.render('add_staff', {
          title: 'add_staff',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Add Staffs!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_staff', {
        title: 'add_staff',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/staff', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    

    var bool = access.includes("staffs");
    if(bool == true){
      console.log('staffs is true');
      res.render('staff', {
          title: 'staff',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Staffs!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('staff', {
        title: 'staff',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/add_user", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('add_user', {
      title: 'add_user',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Add User!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


app.get("/user", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('user', {
      title: 'user',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Users!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


var user_name;

app.get("/user_info", (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  user_name = data.username;
  console.log(user_name);
  res.render("user_info.ejs");
});


app.get("/bin", (req, res) => {
  res.render("bin.ejs");
});

app.get("/events", (req, res) => {
  res.render("events.ejs");
});

app.get('/finance', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("finance");
    if(bool == true){
      console.log('finance is true');
      res.render('finance', {
          title: 'finance',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access finance!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('finance', {
        title: 'finance',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/fees_payment', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
    console.log(req.user.username);
    console.log(req.user.access1);
    console.log(req.user.access2);
    console.log(req.user.access3);
    console.log(req.user.access4);
    console.log(req.user.access5);


    var bool = access.includes("fees_payment");
    if(bool == true){
      console.log('fees_payment is true');
      res.render('fees_payment', {
          title: 'fees_payment',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Student Fees Payment!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('fees_payment', {
        title: 'fees_payment',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/class', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("classes");
    if(bool == true){
      console.log('class is true');
      res.render('class', {
          title: 'class',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access class!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('class', {
        title: 'class',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/add_class', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("classes");
    if(bool == true){
      console.log('add_class is true');
      res.render('add_class', {
          title: 'add_class',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access add class!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_class', {
        title: 'add_class',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/department', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("departments");
    if(bool == true){
      console.log('department is true');
      res.render('department', {
          title: 'department',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access department!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('department', {
        title: 'department',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/add_department', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("departments");
    if(bool == true){
      console.log('add_department is true');
      res.render('add_department', {
          title: 'add_department',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access add department!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_department', {
        title: 'add_department',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/semester', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("semesters");
    if(bool == true){
      console.log('semester is true');
      res.render('semester', {
          title: 'semester',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access semester!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('semester', {
        title: 'semester',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/add_semester', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("semesters");
    if(bool == true){
      console.log('add_semester is true');
      res.render('add_semester', {
          title: 'add_semester',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access add semester!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_semester', {
        title: 'add_semester',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/session', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("sessions");
    if(bool == true){
      console.log('session is true');
      res.render('session', {
          title: 'session',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access session!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('session', {
        title: 'session',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})

app.get('/add_session', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("sessions");
    if(bool == true){
      console.log('session is true');
      res.render('add_session', {
          title: 'add_session',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access session!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_session', {
        title: 'add_session',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/messages', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("smsMsg");
    if(bool == true){
      console.log('messages is true');
      res.render('messages', {
          title: 'messages',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access messages!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('messages', {
        title: 'messages',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/result", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('result', {
        title: 'result',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})


app.get("/system_history", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('system_history', {
      title: 'system_history',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access System History!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


//------------------pending------------------//

app.get('/view', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("students");
    if(bool == true){
      console.log('students is true');
      res.render('view', {
          title: 'view',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access This!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('view', {
        title: 'view',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})



app.get('/view_expense', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("finance");
    if(bool == true){
      console.log('finance is true');
      res.render('view_expense', {
          title: 'view_expense',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access This!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('view_expense', {
        title: 'view_expense',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})




app.get('/view_payment', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("staffs");
    if(bool == true){
      console.log('staffs is true');
      res.render('view_payment', {
          title: 'view_payment',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access This!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('view_payment', {
        title: 'view_payment',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/sms", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('sms', {
        title: 'sms',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})


app.get('/room', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
   


    var bool = access.includes("create_room");
    if(bool == true){
      console.log('create_room is true');
      res.render('create_room', {
          title: 'create_room',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Room!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('create_room', {
        title: 'create_room',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})





var std_id;

app.get("/student-profile", (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  std_id = data.student_id;
  
  console.log(std_id);

  res.render("student-profile.ejs");
});


var staff_id;

app.get("/staff-profile", (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  staff_id = data.staff_id;
  
  console.log(staff_id);

  res.render("staff-profile.ejs");
});

//app.get("/AddStudentClass", (req, res) => {
//  res.render("add_class.ejs");
//});
//
//app.get("/AddStudentSemester", (req, res) => {
//  res.render("add_semester.ejs");
//});
//
//app.get("/AddStudentDepartment", (req, res) => {
//  res.render("add_department.ejs");
//});
//
//app.get("/AddStudentSession", (req, res) => {
//  res.render("add_session.ejs");
//});
//
//app.get("/studentClass", (req, res) => {
//  res.render("class.ejs");
//});
//
//app.get("/studentDepartment", (req, res) => {
//  res.render("department.ejs");
//});
//
//app.get("/studentSession", (req, res) => {
//  res.render("session.ejs");
//});
//
//app.get("/studentSemester", (req, res) => {
//  res.render("semester.ejs");
//});

app.get('/doc', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    
 


    var bool = access.includes("documents");
    if(bool == true){
      console.log('doc is true');
      res.render('doc', {
          title: 'doc',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Document!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('doc', {
        title: 'doc',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})





//----------------------form input for adding student profile-----------------------//

app.post("/StudentRegistration", async (req, res) => {
  let { student_ID, firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address, totalFees, January, February, March, April, May, June, July, August, September, October, November, December, admissionFees } = req.body;
console.log(student_ID, firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address, totalFees, admissionFees);
console.log(January, February, March, April, May, June, July, August, September, October, November, December);

var status = 'active';

//------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

if(totalFees !== undefined) {
  var totalFees_status = 'Not Paid';
}
if(January !== undefined) {
  var January_status = 'Not Paid';
  var January_date = 'N/A';
}
if(February !== undefined) {
  var February_status = 'Not Paid';
  var February_date = 'N/A';
}
if(March !== undefined) {
  var March_status = 'Not Paid';
  var March_date = 'N/A';

}
if(April !== undefined) {
  var April_status = 'Not Paid';
  var April_date = 'N/A';

}
if(May !== undefined) {
  var May_status = 'Not Paid';
  var May_date = 'N/A';

}
if(June !== undefined) {
  var June_status = 'Not Paid';
  var June_date = 'N/A';

}
if(July !== undefined) {
  var July_status = 'Not Paid';
  var July_date = 'N/A';

}
if(August !== undefined) {
  var August_status = 'Not Paid';
  var August_date = 'N/A';

}
if(September !== undefined) {
  var September_status = 'Not Paid';
  var September_date = 'N/A';
}
if(October !== undefined) {
  var October_status = 'Not Paid';
  var October_date = 'N/A';

}
if(November !== undefined) {
  var November_status = 'Not Paid';
  var November_date = 'N/A';

}
if(December !== undefined) {
  var December_status = 'Not Paid';
  var December_date = 'N/A';

}
if(admissionFees !== undefined) {
  var admissionFees_status = 'Not Paid';
  var admissionFees_date = 'N/A';

}

let errors = [];


 
  if (errors.length > 0) {
    res.render("add_student", {
      message: "There may be some errors. Please try again."
    });
  } else {

    pool.query(
      `SELECT * FROM student_details
        WHERE student_id = $1`,
      [student_ID],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("add_student", {
            message: "Student ID already registered"
          });
        } else {
          pool.query(
            `INSERT INTO student_details (student_id, first_name, last_name, father_name, mother_name, guardian_name, relation, guardian_phone, student_phone, email, roll_no, aadhaar_no, student_class, semester, department, session, address, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [student_ID, firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address, status],
            (err, results) => {
              if (err) {
                throw err;
              }
              //console.log(results.rows);
              //req.flash("success_msg", "You are now registered. Please log in");
              //res.redirect("/home");
              pool.query(
                `INSERT INTO fees_information_school (student_id, student_class, total_fees, january, february, march, april, may, june, july, august, september, october, november, december, admission_fees, session)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [student_ID, student_class, totalFees, January, February, March, April, May, June, July, August, September, October, November, December, admissionFees, session],
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  //console.log(results.rows);
                  //req.flash("success_msg", "You are now registered. Please log in");
                  //res.redirect("/home");
                  pool.query(
                    `INSERT INTO fees_information_school_status (student_id, student_class, january, february, march, april, may, june, july, august, september, october, november, december, admission_fees, session, january_date, february_date, march_date, april_date, may_date, june_date, july_date, august_date, september_date, october_date, november_date, december_date, admission_fees_date)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
                    [student_ID, student_class, January_status, February_status, March_status, April_status, May_status, June_status, July_status, August_status, September_status, October_status, November_status, December_status, admissionFees_status, session, January_date, February_date, March_date, April_date, May_date, June_date, July_date, August_date, September_date, October_date, November_date, December_date, admissionFees_date],
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                      //console.log(results.rows);
                      //req.flash("success_msg", "You are now registered. Please log in");
                      //res.redirect("/home");

                      //--------------------------
                      var details = "Student ID: " + student_ID + " is added";
                      var username  = req.user.username;
                      var action_date = date_yyyy_mm_dd;
                      var action_time = time_hh_mm_ss;






                        //-----------add to system history---------//

                        pool.query(
                          `INSERT INTO system_history (details, username, action_date, action_time)
                          VALUES($1, $2, $3, $4)`,
                          [details, username, action_date, action_time],
                        
                        
                          (err, results) => {
                            if (err) {
                              throw err;
                            }
                          
                            res.redirect("/home");
                          
                          }
                        );
                        //---------------------------
        
                    }
                  );
                }
              );
            }
          );
          
          
        }
      }
    );
  }
});

//--------------------------remove students--------------------//

app.get("/students/delete", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var student_id = data.student_id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `delete FROM student_details where student_id = $1`,
    [student_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/student");
      pool.query(
        `delete FROM fees_information_school where student_id = $1`,
        [student_id],
        
        (err, results) => {
          if (err) {
            throw err;
          }
          //res.redirect("/student");
          pool.query(
            `delete FROM fees_information_school_status where student_id = $1`,
            [student_id],
            
            (err, results) => {
              if (err) {
                throw err;
              }
              //res.redirect("/student");
              pool.query(
                `delete FROM other_expenses where student_id = $1`,
                [student_id],
                
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  //res.redirect("/student");
                  pool.query(
                    `delete FROM student_qualification where student_id = $1`,
                    [student_id],
                    
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                      //res.redirect("/student");
                      pool.query(
                        `delete FROM student_result where student_id = $1`,
                        [student_id],
                        
                        (err, results) => {
                          if (err) {
                            throw err;
                          }
                          //res.redirect("/student");
                          //--------------------------
                            var details = "Deleted student " + student_id;
                            var username  = req.user.username;
                            var action_date = date_yyyy_mm_dd;
                            var action_time = time_hh_mm_ss;



                                  //res.redirect('/student-profile?student_id='+ std +'');



                                  //-----------add to system history---------//

                                  pool.query(
                                    `INSERT INTO system_history (details, username, action_date, action_time)
                                    VALUES($1, $2, $3, $4)`,
                                    [details, username, action_date, action_time],
                                  
                                  
                                    (err, results) => {
                                      if (err) {
                                        throw err;
                                      }
                                    
                                      res.redirect("/student");

                                    }
                                  );
                            //---------------------------
                          
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});


//--------------------------remove students--------------------//

app.get("/students/remove", async (req, res) => {
  
  var student_id = std_id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `update student_details set status = 'deactive' where student_id = $1`,
    [student_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/student");
      //--------------------------
      var details = "Removed student " + student_id;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;



            


            //-----------add to system history---------//

            pool.query(
              `INSERT INTO system_history (details, username, action_date, action_time)
              VALUES($1, $2, $3, $4)`,
              [details, username, action_date, action_time],
            
            
              (err, results) => {
                if (err) {
                  throw err;
                }
              
                res.redirect("/student");

              }
            );
      //---------------------------
      
    }
  );
});


//------------------------------restore students------------------//

app.get("/students/restore", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var student_id = data.student_id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `update student_details set status = 'active' where student_id = $1`,
    [student_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //--------------------------
      var details = "Restore student " + student_id;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;



            


            //-----------add to system history---------//

            pool.query(
              `INSERT INTO system_history (details, username, action_date, action_time)
              VALUES($1, $2, $3, $4)`,
              [details, username, action_date, action_time],
            
            
              (err, results) => {
                if (err) {
                  throw err;
                }
              
                res.redirect("/student");

              }
            );
      //---------------------------
      
    }
  );
});

//--------------------------Search students--------------------//





app.get("/search_students", async (req, res) => {

 
   
  var data = url.parse(req.url, true);
  data = data.query;
  var student_id = data.student_id;
  var student_class = data.student_class;

 

 //------------array of values------------//
  var sql_val = [student_id, student_class];
  
  

//------------array  of coluns------------//
  var sql_col = ['student_id', 'student_class'];


//-------------query string---------------//

var query='';

for(i=0; i<=sql_col.length; i++){
  if((sql_val[i] !== '') && (sql_val[i] !== undefined)){
      query += sql_col[i]
      query += ' = ';
      query +=  "'" + sql_val[i] + "'";
      if((i < sql_col.length-1) && (sql_val[i+1] !== '') && (sql_val[i+1] !== undefined) ){
        query += ' and ';
      }
  }
}





//-----------------------------------------//

  let errors = [];
  if (errors.length > 0) {
    res.render("student", { errors, student_id, student_class });
  } else{
    // Validation passed
    
          pool.query(
            "SELECT * FROM student_details where " + query + " and status ='active' order by student_id",
            
            (err, results) => {
              if (err) {
                throw err;
              }
              let data = results.rows;
          
              res.send(data);
            }
          );
      }
});





app.get("/search_students/edit", async (req, res) => {
  

  var emails = req.query.emails;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var email_sql='';

  for(i=1; i<= emails.length; i++){
    if(emails[i] !== undefined){
    email_sql +=  "'" + emails[i] + "'";
    if(i<emails.length-1){
      email_sql += ',';
    }
  }
  }

  console.log(email_sql);

  var data = url.parse(req.url, true);
  data = data.query;
  var edit_student_class = data.edit_student_class;
  


console.log(edit_student_class)



  

  console.log(emails);


  var query = " SET student_class = ($1) WHERE student_id in (" + email_sql + ")";
 

console.log(query);


  let errors = [];

  if (!edit_student_class) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("student", { errors, edit_student_class });
  } else{
    // Validation passed
       
          pool.query(
            "UPDATE student_details " + query + "",
             [edit_student_class],



           
            (err, results) => {
              if (err) {
                throw err;
              }
              //--------------------------
          var details = "Mass Edited Students";
          var username  = req.user.username;
          var action_date = date_yyyy_mm_dd;
          var action_time = time_hh_mm_ss;



            


            //-----------add to system history---------//

            pool.query(
              `INSERT INTO system_history (details, username, action_date, action_time)
              VALUES($1, $2, $3, $4)`,
              [details, username, action_date, action_time],
            
            
              (err, results) => {
                if (err) {
                  throw err;
                }
              
                res.redirect("/student");

              }
            );
      //---------------------------
            }
          );
            
      }
});


var student_name;
var std_roll;
var std_class;

app.get("/search_students/getdata", async (req, res) => {

  var student_id = std_id;
  pool.query(
    `SELECT * FROM student_details
    WHERE student_id = ($1)`,
    [student_id],
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      student_name = data[0].first_name + ' ' + data[0].last_name;
      std_roll = data[0].roll_no;
      std_class = data[0].student_class;
      
      res.send(data);
    }
  );
});


//---------------------------Profile Photo-----------------//

app.post("/student_profilepic/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      var extension = '.jpg';
      var newPath = "uploads/" + std_id + "_profile-picture" + extension;
      fs.rename(files.studentPhoto.path, newPath, function (errorRename) {
          console.log("file renamed")
    });
  })

  res.redirect("/student-profile?student_id="+ std_id);

})


app.post("/staff_profilepic/add", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      var extension = '.jpg';
      var newPath1 = "uploads/" + staff_id + "_profile-picture" + extension;
      fs.rename(files.staffPhoto.path, newPath1, function (errorRename) {
           console.log("file renamed staff")
       });
      })
       res.redirect('/staff-profile?staff_id='+ staff_id +'');

})

//-------------------------------------------------------------------------------------

app.post("/student-profile/edit", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var std_student_id = data.student_id;


  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  console.log(std_student_id);

  var firstname;
 var lastname;
 var fatherName;
 var motherName;
 var guardianName;
 var relation;
 var guardianPhone;
 var studentPhone; 
 var email;
 var rollNo;
 var aadhaar;
 var student_class;
 var semester;
 var department;
 var session;
 var address;

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    
      
      firstname = fields.firstname;
      lastname = fields.lastname;
      fatherName = fields.fatherName;
      motherName = fields.motherName;
      guardianName = fields.guardianName;
      relation = fields.relation;
      guardianPhone = fields.guardianPhone;
      studentPhone = fields.studentPhone;
      email = fields.email;
      rollNo = fields.rollNo;
      aadhaar = fields.aadhaar;
      student_class = fields.student_class;
      semester = fields.semester;
      department = fields.department;
      session = fields.session;
      address = fields.address;
      console.log(fields);

      
  console.log(firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address);

  let errors = [];

  if (!std_student_id) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("student", { errors, std_student_id });
  } else{
    // Validation passed
       
          pool.query(
            `UPDATE student_details
            SET first_name = ($1), last_name = ($2), student_class = ($3), semester = ($4), department = ($5), session = ($6), roll_no = ($7), father_name = ($8), mother_name = ($9), guardian_name = ($10), relation = ($11), guardian_phone = ($12), student_phone = ($13), email = ($14), aadhaar_no = ($15), address = ($16)
            WHERE student_id = ($17)`,
            [firstname, lastname, student_class, semester, department, session, rollNo, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, aadhaar, address, std_student_id],
             



           
            (err, results) => {
              if (err) {
                throw err;
              }
              //res.redirect('/student-profile?student_id='+ std_student_id +'');
              pool.query(
                `UPDATE fees_information_school
                SET session = ($1)
                WHERE student_id = ($2)`,
                [session, std_student_id],
                 
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  //res.redirect('/student-profile?student_id='+ std_student_id +'');
                  pool.query(
                    `UPDATE fees_information_school_status
                    SET session = ($1)
                    WHERE student_id = ($2)`,
                    [session, std_student_id],
                     
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                      //res.redirect('/student-profile?student_id='+ std_student_id +'');
                      pool.query(
                        `UPDATE other_expenses
                        SET session = ($1)
                        WHERE student_id = ($2)`,
                        [session, std_student_id],
                         
                        (err, results) => {
                          if (err) {
                            throw err;
                          }
                          //res.redirect('/student-profile?student_id='+ std_student_id +'');
                          //--------------------------
                          var details = "Student: " + std_id +  " Profile Edited";
                          var username  = req.user.username;
                          var action_date = date_yyyy_mm_dd;
                          var action_time = time_hh_mm_ss;
                          //-----------add to system history---------//

                          pool.query(
                            `INSERT INTO system_history (details, username, action_date, action_time)
                            VALUES($1, $2, $3, $4)`,
                            [details, username, action_date, action_time],
                          
                          
                            (err, results) => {
                              if (err) {
                                throw err;
                              }
                            
                              res.redirect('/student-profile?student_id='+ std_student_id +'');
                            
                            }
                          );
                          //---------------------------
         
                        }
                      );
     
                    }
                  );


                }
              );
            }
          );
            
      }
  });

  

  //let { firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address } = req.body;

  
});



//---------------------Registration For Staffs----------------//


app.post("/StaffRegistration", async (req, res) => {
  let { staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, department, joindate, address, totalSalary } = req.body;
console.log(staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, department, joindate, address, totalSalary);
  let errors = [];

  var status = 'active';

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
 
  if (errors.length > 0) {
    res.render("add_staff", {
      message: "There may be some errors. Please try again."
    });
  } else {

    pool.query(
      `SELECT * FROM staff_details
        WHERE staff_id = $1`,
      [staff_ID],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("add_staff", {
            message: "Student ID already registered"
          });
        } else {
          pool.query(
            `INSERT INTO staff_details (staff_id, first_name, last_name, father_name, phone, email, aadhaar_no, department, joindate, address, totalSalary, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, department, joindate, address, totalSalary, status],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              //req.flash("success_msg", "You are now registered. Please log in");
              //res.redirect("/home");

              //--------------------------
              var details = "Staff ID: " + staff_ID + "is added";
              var username  = req.user.username;
              var action_date = date_yyyy_mm_dd;
              var action_time = time_hh_mm_ss;






                //-----------add to system history---------//

                pool.query(
                  `INSERT INTO system_history (details, username, action_date, action_time)
                  VALUES($1, $2, $3, $4)`,
                  [details, username, action_date, action_time],
                
                
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                  
                    res.redirect("/home");
                  
                  }
                );
                //---------------------------
            }
          );
        }
      }
    );
  }
});

//--------------------------remove staffs--------------------//

app.get("/staff/remove", async (req, res) => {
  
    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  
  pool.query(
    `update staff_details set status = 'deactive' where staff_id = $1`,
    [staff_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/staff");

       //--------------------------
      var details = "Removed staff " + staff_id;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;



            


            //-----------add to system history---------//

            pool.query(
              `INSERT INTO system_history (details, username, action_date, action_time)
              VALUES($1, $2, $3, $4)`,
              [details, username, action_date, action_time],
            
            
              (err, results) => {
                if (err) {
                  throw err;
                }
              
                res.redirect("/staff");

              }
            );
      //---------------------------
      
    }
  );
});

//---------------------------Staff Delete------------------------------------//

app.get("/staff/delete", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;

      //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `delete FROM staff_details where staff_id = $1`,
    [staff_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/student");
      pool.query(
        `delete FROM staff_payment where staff_id = $1`,
        [staff_id],
        
        (err, results) => {
          if (err) {
            throw err;
          }
          //res.redirect("/student");
          pool.query(
            `delete FROM staff_qualification where staff_id = $1`,
            [staff_id],
            
            (err, results) => {
              if (err) {
                throw err;
              }
              //res.redirect("/staff");
             
              //--------------------------
              var details = "Staff: " + staff_id +  " Profile Deleted";
              var username  = req.user.username;
              var action_date = date_yyyy_mm_dd;
              var action_time = time_hh_mm_ss;
              //-----------add to system history---------//

              pool.query(
                `INSERT INTO system_history (details, username, action_date, action_time)
                VALUES($1, $2, $3, $4)`,
                [details, username, action_date, action_time],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                
                  res.redirect("/staff");
                
                }
              );
              //---------------------------

            }
          );
        }
      );
    }
  );
});

//------------------------------restore students------------------//

app.get("/staff/restore", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;

      //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `update staff_details set status = 'active' where staff_id = $1`,
    [staff_id],
    
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/staff");

      //--------------------------
      var details = "Staff: " + staff_id +  " Profile Restored";
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/staff");
        
        }
      );
      //---------------------------
      
    }
  );
});



//------------------Search Staffs------------------------//


app.get("/search_staffs", async (req, res) => {

 
   
  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;
  var staff_department = data.staff_department;

 

 //------------array of values------------//
  var sql_val = [staff_id, staff_department];
  
  

//------------array  of coluns------------//
  var sql_col = ['staff_id', 'department'];


//-------------query string---------------//

var query='';

for(i=0; i<=sql_col.length; i++){
  if((sql_val[i] !== '') && (sql_val[i] !== undefined)){
      query += sql_col[i]
      query += ' = ';
      query +=  "'" + sql_val[i] + "'";
      if((i < sql_col.length-1) && (sql_val[i+1] !== '') && (sql_val[i+1] !== undefined) ){
        query += ' and ';
      }
  }
}





//-----------------------------------------//

  let errors = [];
  if (errors.length > 0) {
    res.render("staff", { errors, staff_id, staff_department });
  } else{
    // Validation passed
    
          pool.query(
            "SELECT * FROM staff_details where " + query + " and status='active' order by staff_id",
            
            (err, results) => {
              if (err) {
                throw err;
              }
              let data = results.rows;
          
              res.send(data);
            }
          );
      }
});



app.get("/search_staffs/getdata", async (req, res) => {

  var stf_id = staff_id;
  console.log(stf_id);
  pool.query(
    `SELECT * FROM staff_details
    WHERE staff_id = ($1)`,
    [stf_id],
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



app.post("/staff-profile/edit", async (req, res) => {

  
  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;

  console.log(staff_id);

  

  //let { firstname, lastname, department, fatherName, joinDate, phone, email, aadhaar, address, salary } = req.body;

  //console.log(firstname, lastname, fatherName, motherName, guardianName, relation, guardianPhone, studentPhone, email, rollNo, aadhaar, student_class, semester, department, session, address);


  var firstname;
  var lastname;
  var department; 
  var fatherName; 
  var joinDate; 
  var phone;
  var email; 
  var aadhaar; 
  var address; 
  var salary;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

 
   var formData1 = new formidable.IncomingForm();
   formData1.parse(req, function (error, fields, files) {
       //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
       //var extension = '.jpg';
       //var newPath1 = "uploads/" + staff_id + "_profile-picture" + extension;
       //fs.rename(files.staffPhoto.path, newPath1, function (errorRename) {
       //    console.log("file renamed staff")
       //});
       
       firstname = fields.firstname;
       lastname = fields.lastname;
       department  = fields.department;
       fatherName = fields.fatherName;
       joinDate  = fields.joinDate;
       phone = fields.phone;
       email  = fields.email;
       aadhaar  = fields.aadhaar;
       address  = fields.address;
       salary = fields.salary;






        let errors = [];


        if (errors.length > 0) {
          res.render("student", { errors, std_student_id });
        } else{
          // Validation passed

                pool.query(
                  `UPDATE staff_details
                  SET first_name = ($1), last_name = ($2), department = ($3), father_name = ($4), joindate = ($5), phone = ($6), email = ($7), aadhaar_no = ($8), address = ($9), totalsalary = ($10)
                  WHERE staff_id = ($11)`,
                  [firstname, lastname, department, fatherName, joinDate, phone, email, aadhaar, address, salary, staff_id],

                
                
                
                
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                    //res.redirect('/staff-profile?staff_id='+ staff_id +'');

                    //--------------------------
      var details = "Staff: " + staff_id +  " Profile Edited";
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect('/staff-profile?staff_id='+ staff_id +'');
        
        }
      );
      //---------------------------
                  }
                );

            }
  });
});

//-----------------------student qualificaions---------------------//

app.post("/StudentQualifications/add", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var student_id = data.student_id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { exam, board, subjects, totalMarks, obtained, percentage, year } = req.body;
  console.log(exam, board, subjects, totalMarks, obtained, percentage, year);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/student-profile");
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO student_qualification (student_id, examination, board , subjects, total_marks, obtained, percentage, year )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
      [student_id, exam, board, subjects, totalMarks, obtained, percentage, year],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/student-profile?student_id=" + student_id);

        //--------------------------
      var details = "Student: " + student_id +  " Qualification Added";
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/student-profile?student_id=" + student_id);
        
        }
      );
      //---------------------------
      }
    );
  }
});



app.get("/StudentQualifications/getdata", async (req, res) => {

  
  var student_id = std_id;

  pool.query(
    `SELECT * FROM student_qualification
    WHERE student_id = ($1)`,
    [student_id],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/StudentQualifications/getdata/delete", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var student_id = data.student_id;

  pool.query(
    `DELETE FROM student_qualification
    WHERE student_id = ($1)`,
    [student_id],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
     
      
      res.redirect('/student-profile?student_id='+ std_student_id +'');
    }
  );
});






//-----------------------staff qualificaions---------------------//

app.post("/StaffQualifications/add", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { exam, board, subjects, totalMarks, obtained, percentage, year } = req.body;
  console.log(exam, board, subjects, totalMarks, obtained, percentage, year);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/staff-profile");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {

    pool.query(
      `INSERT INTO staff_qualification (staff_id, examination, board , subjects, total_marks, obtained, percentage, year )
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
      [staff_id, exam, board, subjects, totalMarks, obtained, percentage, year],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/home");
        //--------------------------
      var details = "Staff: " + staff_id +  " Qualification Added";
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/staff-profile?staff_id=" + staff_id);
        
        }
      );
      //---------------------------
      }
    );
  }
});



app.get("/StaffQualifications/getdata", async (req, res) => {

  var stf_id = staff_id;

  pool.query(
    `SELECT * FROM staff_qualification
    WHERE staff_id = ($1)`,
    [stf_id],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



//--------------------class-----------------------//

app.post("/AddStudentClass/add", async (req, res) => {

   //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { class_name } = req.body;
  console.log(class_name);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/add_class");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {

    pool.query(
      `INSERT INTO student_class (class_name)
        VALUES($1)`,
      [class_name],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/add_class");

        //--------------------------
      var details = "Added Class: " + class_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/add_class");
        
        }
      );
      //---------------------------
      }
    );
  }
});


app.get("/studentClass/getdata", async (req, res) => {



  pool.query(
    `SELECT * FROM student_class
    order by id`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});

app.get("/studentClass/count", async (req, res) => {



  pool.query(
    `select count(student_id) FROM student_details
    group by student_class
    order by student_class`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/studentClass/remove", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `DELETE FROM student_class
     WHERE id = $1
     returning *`,
     [id],

    (err, results) => {
      if (err) {
        throw err;
      }
      //res.send();
      let data = results.rows;
      var class_name = data[0].class_name;
      //--------------------------
      var details = "Remove Class: " + class_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.send();
        
        }
      );
      //---------------------------
    }
  );
});


//--------------------department-----------------------//

app.post("/AddStudentDepartment/add", async (req, res) => {

 
//------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { department_name } = req.body;
 

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/add_department");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {

    pool.query(
      `INSERT INTO student_department (department_name)
        VALUES($1)`,
      [department_name],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
       
        //res.redirect("/add_department");

        //--------------------------
      var details = "Add Department: " + department_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/add_department");
        
        }
      );
      //---------------------------
      }
    );
  }
});


app.get("/studentDepartment/getdata", async (req, res) => {



  pool.query(
    `SELECT * FROM student_department
    order by department_name`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/studentDepartment/remove", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `DELETE FROM student_department
     WHERE id = $1
     returning *`,
     [id],

    (err, results) => {
      if (err) {
        throw err;
      }
      //res.send();
      let data = results.rows;
      var department_name = data[0].department_name;

      //--------------------------
      var details = "Delete Department: " + department_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.send();
        
        }
      );
      //---------------------------
    }
  );
});



//--------------------session-----------------------//

app.post("/AddStudentSession/add", async (req, res) => {

 //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { session_name } = req.body;
  

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/add_session");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {

    pool.query(
      `INSERT INTO student_session (session_name)
        VALUES($1)`,
      [session_name],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        
        //res.redirect("/add_session");

         //--------------------------
      var details = "Add Session: " + session_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/add_session");
        
        }
      );
      //---------------------------
      }
    );
  }
});

app.get("/studentSession/getdata", async (req, res) => {



  pool.query(
    `SELECT * FROM student_session
    order by id`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/studentSession/remove", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

   //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year2 = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year2 + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(
    `DELETE FROM student_session
     WHERE id = $1
     returning *`,
     [id],

    (err, results) => {
      if (err) {
        throw err;
      }
      //res.send();
      let data = results.rows;
      var session_name = data[0].session_name;
      //--------------------------
      var details = "Delete Session: " + session_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.send();
        
        }
      );
      //---------------------------
    }
  );
});



//--------------------semester-----------------------//

app.post("/AddStudentSemester/add", async (req, res) => {

 

  let { semester_name } = req.body;
  

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/add_semester");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {

    pool.query(
      `INSERT INTO student_semester (semester_name)
        VALUES($1)`,
      [semester_name],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        
        res.redirect("/add_semester");
      }
    );
  }
});

app.get("/studentSemester/getdata", async (req, res) => {



  pool.query(
    `SELECT * FROM student_semester
    order by semester_name`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/studentSemester/remove", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  pool.query(
    `DELETE FROM student_semester
     WHERE id = $1`,
     [id],

    (err, results) => {
      if (err) {
        throw err;
      }
      res.send();
    }
  );
});


var std_session;

//------------------------payment history-------------------------//

app.get("/StudentPaymentHistory/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var session = data.session;
  
  var student_id = std_id;

  std_session = session;

  pool.query(
    `SELECT * FROM fees_information_school
    WHERE student_id = ($1) and session = ($2)`,
    [student_id, session],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



app.get("/StudentPaymentHistory_status/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  std_session = data.session;
  var student_id = std_id;

  

  pool.query(
    `SELECT * FROM fees_information_school_status
    WHERE student_id = ($1) and session = ($2)`,
    [student_id, std_session],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/payment_history/pay_now", async (req, res) => {

  //-------------------//
  var total = new Number();
  //-------------------//

  var std = std_id;
  
  var student_id = "'" + std_id + "'";

  var session = "'" + std_session + "'";

  var emails = req.query.emails;

  var others = req.query.others;

  var month_names='';

  let errors = [];

  var email_sql='';
  var others_email_sql='';

  var total_sql='';

  var values_sql='';
  //var others_values_sql='';

  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
    email_sql +=  "" + emails[i] + "";
    email_sql += " = 'Paid'";
    
    if(i<emails.length-1){
      
      email_sql += ',';
      values_sql += ',';
    }
  }
  }

  if(email_sql == ''){
    email_sql += 'flag = 1';
  }

  

  console.log('this is email sql:  ' + email_sql);

  for(i=2; i<= others.length; i++){
    if(others[i] !== undefined){
      others_email_sql +=  "" + others[i] + "";
      //others_email_sql += " = 'Paid'";
   
    if(i<others.length-1){
      
      others_email_sql += ',';
      //others_values_sql += ',';
    }

    
  }
  }

  if(others_email_sql == ''){
    others_email_sql += -9999;
  }


  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
    total_sql +=  "" + emails[i] + "";
    
   
    if(i<emails.length-1){
      
      total_sql += ' + ';
      
    }
  }
  }

  if(total_sql == ''){
    total_sql += 'flag';
  }

  console.log("this is total sql: " + total_sql);


//----------------months----------------//
  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
    //month_names += "" + emails[i] + "";
        if(emails[i] == 'admission_fees'){
          month_names += 'Admission Fees'
        }else if(emails[i] == 'january') {
          month_names += 'January Fees'
        }else if(emails[i] == 'february') {
          month_names += 'February Fees'
        }else if(emails[i] == 'march') {
          month_names += 'March Fees'
        }else if(emails[i] == 'april') {
          month_names += 'April Fees'
        }else if(emails[i] == 'may') {
          month_names += 'May Fees'
        }else if(emails[i] == 'june') {
          month_names += 'June Fees'
        }else if(emails[i] == 'july') {
          month_names += 'July Fees'
        }else if(emails[i] == 'august') {
          month_names += 'August Fees'
        }else if(emails[i] == 'september') {
          month_names += 'September Fees'
        }else if(emails[i] == 'october') {
          month_names += 'October Fees'
        }else if(emails[i] == 'november') {
          month_names += 'November Fees'
        }else if(emails[i] == 'december') {
          month_names += 'December Fees'
        }
   
    if(i<emails.length-1){
      month_names += ', ';
    }
  }
}

if(emails[2] !== undefined){
  month_names += ' of session '  + std_session ;
}


  var data = url.parse(req.url, true);
  data = data.query;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  //-------------------date end-----------------//
 var date_sql='';
  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
    date_sql +=  "" + emails[i] + "_date";
    date_sql += " = '" + date_yyyy_mm_dd + "'";
   
    if(i<emails.length-1){
      
      date_sql += ',';
      
    }
  }
  }

  if(date_sql == ''){
    date_sql += 'flag_date = 1';
  }

  console.log('datesql: ' + date_sql);
  console.log('emailsql: ' + email_sql);


  if (errors.length > 0) {
    res.render("student", { errors });
  } else{
  
                pool.query(
                  "update fees_information_school_status set " + email_sql + ',' + date_sql +" where student_id = (" + student_id + ") and session = " + session + "",
                  
                  (err, results) => {
                    if (err) {
                      throw err;
                    }

                    pool.query(
                      "select " + total_sql + " as total from fees_information_school where student_id = " + student_id + " and session = " + session + "",
                     
                      (err, results) => {
                        if (err) {
                          throw err;
                        }
                        let data = results.rows;

                        if(data[0].total !== null){
                          total += parseInt(data[0].total); 
                        }
                        console.log('this is total:  ' + total);
                        


                        //--------------------other payments part-------------------------//
                        pool.query(
                          "update other_expenses set status = 'Paid' where id IN (" + others_email_sql+ ") and session = " + session + ""+
                          "returning amount",
                          (err, results) => {
                            if (err) {
                              throw err;
                            }
                            let data = results.rows;
                            for(i=0; i<data.length; i++){
                              total += parseInt(data[i].amount);
                            }


                              
                            
                            //res.redirect('/student-profile?student_id='+ std +'');
                            //-------------cashbook--------------
                            var description = "Recieved Payment from Student ID: " + std_id + ", NAME: " + student_name + ", CLASS: " + std_class + ", ROLL.NO.: " + std_roll;
                            var credit = total;
                            //var transaction_type = data[0].transaction_type;
                            var transaction_date = date_yyyy_mm_dd;
                            var transaction_time = time_hh_mm_ss;

                            var student_id = std_id;
                            var student_class = std_class;
                            var name = student_name;
                            var roll_no = std_roll;
                            //var status = data[0].status;
                                        
                            //res.redirect('/student-profile?student_id='+ std +'');
                                        
                           
                            
                            //-----------add to cashbook---------//
                            
                            pool.query(
                              `INSERT INTO cashbook (description, credit, transaction_date, transaction_time, name, student_id, student_class, roll_no, month)
                              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                              [description, credit,  transaction_date, transaction_time, name, student_id, student_class,roll_no, month_names],
                            
                            
                              (err, results) => {
                                if (err) {
                                  throw err;
                                }
                              
                                //res.redirect("/student-profile?student_id=" + std_id);
                                //res.send();

                                //--------------------------
                                      var details = "Recieved Payment from Student ID: " + std_id;
                                      var username  = req.user.username;
                                      var action_date = date_yyyy_mm_dd;
                                      var action_time = time_hh_mm_ss;
                                      //-----------add to system history---------//

                                      pool.query(
                                        `INSERT INTO system_history (details, username, action_date, action_time)
                                        VALUES($1, $2, $3, $4)`,
                                        [details, username, action_date, action_time],
                                      
                                      
                                        (err, results) => {
                                          if (err) {
                                            throw err;
                                          }
                                        
                                          res.send();
                                        
                                        }
                                      );
                                      //---------------------------
                              }
                            );
                            
                            //---------------------------------
                          }
                        );

                      }
                    );

                    
                    
                    
                  }
                );
        
      }
});


app.get("/payment_history/pay_now/wrong_transaction", async (req, res) => {
  
  var data = url.parse(req.url, true);
  data = data.query;
  var month = data.month;
  var month_date = month + '_date';

  var std = std_id;

  var student_id = "'" + std_id + "'";

  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month1 = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month1 + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  pool.query(
    "update fees_information_school_status set " + month + " = 'Not Paid'," + month_date + "='N/A'    where student_id = (" + student_id + ") and session = " + "'" + std_session + "'",
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      

      //res.redirect('/student-profile?student_id='+ std +'');
      pool.query(
        "select " + month + " as amount from fees_information_school where student_id = (" + student_id + ")  and session = " + "'" + std_session + "'",
      
          
        (err, results) => {
          if (err) {
            throw err;
          }
          let data = results.rows;
          amount = data[0].amount;
          //res.redirect('/student-profile?student_id='+ std +'');
          var description = "Refunded to Student ID: " + std_id + ", NAME: " + student_name + ", CLASS: " + std_class + ", ROLL.NO.: " + std_roll;
          var debit = amount;
          //var transaction_type = data[0].transaction_type;
          var transaction_date = date_yyyy_mm_dd;
          var transaction_time = time_hh_mm_ss;
              
          var student_id = std_id;
          var student_class = std_class;
          var name = student_name;
          var roll_no = std_roll;
              
              
              

              //-----------add to cashbook---------//

              pool.query(
                `INSERT INTO cashbook (description, debit, transaction_date, transaction_time, name, student_id, student_class, roll_no)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
                [description, debit, transaction_date, transaction_time, name, student_id, student_class, roll_no],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }

                  //res.redirect('/student-profile?student_id='+ std +'');
                  //res.send();

                  //--------------------------
                  var details = "Refunded Payment to Student ID: " + std_id;
                  var username  = req.user.username;
                  var action_date = date_yyyy_mm_dd;
                  var action_time = time_hh_mm_ss;
                  //-----------add to system history---------//

                  pool.query(
                    `INSERT INTO system_history (details, username, action_date, action_time)
                    VALUES($1, $2, $3, $4)`,
                    [details, username, action_date, action_time],
                  
                  
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                    
                      res.send();
                    
                    }
                  );
                  //---------------------------
                }
              );
          //------------------------------
        }
      );
    }
  );
});


app.get("/payment_history/pay_now/pay_single", async (req, res) => {

  
  var data = url.parse(req.url, true);
  data = data.query;
  var month = data.month;
  month_date = month + '_date';

  month_name = month;

  //----------------months----------------//
      if(month_name == 'admission_fees'){
        month_name = 'Admission Fees'
      }else if(month_name == 'january') {
        month_name = 'January Fees'
      }else if(month_name == 'february') {
        month_name = 'February Fees'
      }else if(month_name == 'march') {
        month_name = 'March Fees'
      }else if(month_name == 'april') {
        month_name = 'April Fees'
      }else if(month_name == 'may') {
        month_name = 'May Fees'
      }else if(month_name == 'june') {
        month_name = 'June Fees'
      }else if(month_name == 'july') {
        month_name = 'July Fees'
      }else if(month_name == 'august') {
        month_name = 'August Fees'
      }else if(month_name == 'september') {
        month_name = 'September Fees'
      }else if(month_name == 'october') {
        month_name = 'October Fees'
      }else if(month_name == 'november') {
        month_name = 'November Fees'
      }else if(month_name == 'december') {
        month_name = 'December Fees'
      }
  month_name += ' of session '  + std_session ;



  var std = std_id;

  var student_id = "'" + std_id + "'";

  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month1 = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month1 + "-" + date;


  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

console.log(date_yyyy_mm_dd, date, month1, year)
  pool.query(
    "update fees_information_school_status set " + month + " = 'Paid', " + month_date + " = " + "'" + date_yyyy_mm_dd + "'" + "" + " where student_id = (" + student_id + ")  and session = " + "'" + std_session + "'" ,
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      

      //res.redirect('/student-profile?student_id='+ std +'');
      pool.query(
        "select " + month + " as amount from fees_information_school where student_id = (" + student_id + ") and session = " + "'" + std_session + "'" ,
      
          
        (err, results) => {
          if (err) {
            throw err;
          }
          let data = results.rows;
          amount = data[0].amount;
          //res.redirect('/student-profile?student_id='+ std +'');
          var description = "Recieved Payment from Student ID: " + std_id  + ", NAME: " + student_name + ", CLASS: " + std_class + ", ROLL.NO.: " + std_roll;
          var credit = amount;
          //var transaction_type = data[0].transaction_type;
          var transaction_date = date_yyyy_mm_dd;
          var transaction_time = time_hh_mm_ss;

          var student_id = std_id;
          var student_class = std_class;
          var name = student_name;
          var roll_no = std_roll;
              
              //-----------add to cashbook---------//

              pool.query(
                `INSERT INTO cashbook (description, credit, transaction_date, transaction_time, name, student_id, student_class, roll_no, month)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [description, credit, transaction_date, transaction_time, name, student_id, student_class, roll_no, month_name],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }

                  //res.redirect('/student-profile?student_id='+ std +'');
                  //res.send();

                  //--------------------------
                  var details = "Recieved Payment from Student ID: " + std_id;
                  var username  = req.user.username;
                  var action_date = date_yyyy_mm_dd;
                  var action_time = time_hh_mm_ss;
                  //-----------add to system history---------//

                  pool.query(
                    `INSERT INTO system_history (details, username, action_date, action_time)
                    VALUES($1, $2, $3, $4)`,
                    [details, username, action_date, action_time],
                  
                  
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                    
                      res.send();
                    
                    }
                  );
                  //---------------------------
                }
              );
          //------------------------------
        }
      );
    }
  );
});



//---------------other expenses--------------//

app.get("/payment_history/other_expenses/add", async (req, res) => {

  var student_id = std_id;

  //var student_id = "'" + std_id + "'";

  var std_class;

  var std_session;

  var data = url.parse(req.url, true);
  data = data.query;
  var purpose = data.purpose;
  var amount = data.amount;
  var transactionType = data.transactionType;
  var paymentType = data.paymentType;

  //let { purpose, amount, transactionType, paymentType } = req.body;

  let errors = [];


  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  //-------------------date end-----------------//


 
  if (errors.length > 0) {
    res.redirect("/student-profile?student_id=" + student_id, {
      message: "There may be some errors. Please try again."
    });
  } else {

      pool.query(
        `select student_class, session from student_details
         where student_id = $1`,
        [student_id],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          let data = results.rows;
          std_class = data[0].student_class;
          std_session = data[0].session;

          
          var student_class = std_class;
          var name = student_name;
          var roll_no = std_roll;

          pool.query(
            `INSERT INTO other_expenses (student_id, purpose, amount, transaction_type, student_class, session, transaction_date, transaction_time, status)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
            returning *`,
            [student_id, purpose, amount, transactionType, std_class, std_session, date_yyyy_mm_dd, time_hh_mm_ss, paymentType],
          
    
            (err, results) => {
              if (err) {
                throw err;
              }

              let data = results.rows;
      
      
      
              var description = "Recieved Payment from Student ID: " + student_id  + ", NAME: " + student_name + ", CLASS: " + std_class  + ", ROLL.NO.: " + std_roll;
              var credit = data[0].amount;
              var transaction_type = data[0].transaction_type;
              var transaction_date = data[0].transaction_date;
              var transaction_time = data[0].transaction_time;
              var status = data[0].status;

              
              var student_class = std_class;
              var name = student_name;
              var roll_no = std_roll;

              //res.redirect('/student-profile?student_id='+ std +'');
              
              if(status == 'Paid'){

              //-----------add to cashbook---------//

              pool.query(
                `INSERT INTO cashbook (description, credit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [description, credit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }


                }
              );
              }
              
              //res.redirect("/student-profile?student_id=" + student_id);

              //--------------------------
              var details = "Recieved Payment from Student ID: " + std_id;
              var username  = req.user.username;
              var action_date = date_yyyy_mm_dd;
              var action_time = time_hh_mm_ss;
              //-----------add to system history---------//

              pool.query(
                `INSERT INTO system_history (details, username, action_date, action_time)
                VALUES($1, $2, $3, $4)`,
                [details, username, action_date, action_time],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                
                  res.redirect("/student-profile?student_id=" + student_id);
                
                }
              );
              //---------------------------
            }
          );


       
        }
      );

      

      
    }
});


app.get("/payment_history/other_expenses/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var session = data.session;
  var student_id = std_id;

  

  pool.query(
    `SELECT * from other_expenses
    WHERE student_id = ($1) and session = ($2)
    order by id desc`,
    [student_id, session],
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/payment_history/other_expenses/pay_single", async (req, res) => {

  
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);


  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var std = std_id;

  var student_id = "'" + std_id + "'";


  pool.query(
    "update other_expenses set status = 'Paid' where id = (" + id + ")" +
    "returning *",
   
    (err, results) => {
      if (err) {
        throw err;
      }
      
      let data = results.rows;
      
      
      
      var description = "Recieved Payment from Student ID: " + std + ", NAME: " + student_name + ", CLASS: " + std_class  + ", ROLL.NO.: " + std_roll;
      var credit = data[0].amount;
      var transaction_type = data[0].transaction_type;
      var transaction_date = data[0].transaction_date;
      var transaction_time = data[0].transaction_time;

      var student_id = std_id;
      var student_class = std_class;
      var name = student_name;
      var roll_no = std_roll;

      //res.redirect('/student-profile?student_id='+ std +'');

      //-----------add to cashbook---------//

      pool.query(
        `INSERT INTO cashbook (description, credit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [description, credit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no],
      

        (err, results) => {
          if (err) {
            throw err;
          }
          
          
        }
      );
      //res.redirect("/student-profile?student_id=" + student_id);
      //res.send();

      //--------------------------
      var details = "Recieved Payment from Student ID: " + std_id;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.send();
        
        }
      );
      //---------------------------

    }
  );
});


app.get("/payment_history/other_expenses/wrong_transaction", async (req, res) => {

  
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;


  var std = std_id;

  var student_id = "'" + std_id + "'";


  pool.query(
    "delete from other_expenses  where id = (" + id + ")" +
    "returning *",
  
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      //-----------add to cashbook---------//

      // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
      let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

      // Date object initialized from the above datetime string
      let date_nz = new Date(nz_date_string);

      // year as (YYYY) format
      let year = date_nz.getFullYear();

      // month as (MM) format
      let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

      // date as (DD) format
      let date = ("0" + date_nz.getDate()).slice(-2);

      // hours as (hh) format
      let hours = ("0" + date_nz.getHours()).slice(-2);

      // minutes as (mm) format
      let minutes = ("0" + date_nz.getMinutes()).slice(-2);

      // seconds as (ss) format
      let seconds = ("0" + date_nz.getSeconds()).slice(-2);


      // date as YYYY-MM-DD format
      let date_yyyy_mm_dd = year + "-" + month + "-" + date;

      // time as hh:mm:ss format
      let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


      var description = "Refunded to Student ID: " + std + ", NAME: " + student_name + ", CLASS: " + std_class + ", ROLL.NO.: " + std_roll;
      var debit = data[0].amount;
      var transaction_type = data[0].transaction_type;
      var transaction_date = date_yyyy_mm_dd;
      var transaction_time = time_hh_mm_ss;
      var status = data[0].status;

      var student_id = std_id;
      var student_class = std_class;
      var name = student_name;
      var roll_no = std_roll;

      if(status !== 'Pending'){

          pool.query(
            `INSERT INTO cashbook (description, debit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [description, debit, transaction_type, transaction_date, transaction_time, name, student_id, student_class, roll_no],
          
          
            (err, results) => {
              if (err) {
                throw err;
              }


            }
          );
      }
      //res.redirect("/student-profile?student_id="+ std);
      //res.send();

      //--------------------------
      var details = "Refunded Payment to Student ID: " + std_id;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.send();
        
        }
      );
      //---------------------------
    }
  );
});


//-------------------fetch data for cashbook----------------//


app.get("/cashbook/getdata", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var search_date = data.date;

  pool.query(
    `SELECT * from cashbook
    where transaction_date = $1
    order by id desc`,
    [search_date],
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});

app.get("/cashbook/getdata2", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var search_month = data.month;

  //------------------year----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  var month_like = "%" + year + "_" + search_month  +"___%";

  pool.query(
    `SELECT * from cashbook
    where transaction_date like $1
    order by id desc`,
    [month_like],
      
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});




app.get("/getDateTime", async (req, res) => {


  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

// Date object initialized from the above datetime string
let date_nz = new Date(nz_date_string);

// year as (YYYY) format
let year = date_nz.getFullYear();

// month as (MM) format
let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
let date = ("0" + date_nz.getDate()).slice(-2);

// hours as (HH) format
let hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
let minutes = ("0" + date_nz.getMinutes()).slice(-2);

// seconds as (ss) format
let seconds = ("0" + date_nz.getSeconds()).slice(-2);

// date as YYYY-MM-DD format
let date_dd_mm_yyyy = date + "-" + month + "-" + year;


// time as hh:mm:ss format
let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


// date and time as YYYY-MM-DD hh:mm:ss format
let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;



console.log("Date in YYYY-MM-DD format: " + date_dd_mm_yyyy);
console.log("Time in hh:mm:ss format: " + time_hh_mm_ss);
console.log("Date and Time in DD-MM-YYYY hh:mm:ss format: " + date_time);
});

//result edit------------------


app.post("/result_edit", async (req, res) => {

   // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

// Date object initialized from the above datetime string
let date_nz = new Date(nz_date_string);

// year as (YYYY) format
let year = date_nz.getFullYear();

// month as (MM) format
let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
let date = ("0" + date_nz.getDate()).slice(-2);

// hours as (HH) format
let hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
let minutes = ("0" + date_nz.getMinutes()).slice(-2);

// seconds as (ss) format
let seconds = ("0" + date_nz.getSeconds()).slice(-2);

// date as YYYY-MM-DD format
let date_yyyy_mm_dd = year + "-" + month + "-" + date;


// time as hh:mm:ss format
let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


// date and time as YYYY-MM-DD hh:mm:ss format
let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

  //let { serial_number,subject_name,full_marks,obtained_marks } = req.body;

  //var packet = req.body;
  req.body = JSON.parse(JSON.stringify(req.body));

  var item = new Array();
  for (var key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      item[key] = req.body[key];
      
    }
  }
 

  var test_name = item.testname;
  var subject_name = item.subject_name;
  var serial_number = item.serial_number
  var full_marks = item.full_marks;
  var obtained_marks = item.obtained_marks;
  var grade = item.grade;
  var result = item.result;
  var total_number = item.total_number;
  var total_obtained = item.total_obtained;
 
  console.log(subject_name,serial_number,full_marks,obtained_marks,grade);
  
  let errors = [];

  var col_sql='test_name, result, ';
  var val_sql="'" + test_name + "'," + "'" + result + "',";

  for(i=0; i<= subject_name.length; i++){
    if(subject_name[i] !== undefined){
    col_sql +=  "subject" + (i+1) + ", ";
    val_sql += "'" + subject_name[i] + "', ";
   
    //if(i<subject_name.length-1){
    //  
    //  col_sql += ', ';
    //  val_sql += ', ';
    //}
  }
  }
  for(i=0; i<= serial_number.length; i++){
    if(serial_number[i] !== undefined){
    col_sql +=  "code" + (i+1) + ", ";
    val_sql += "'" + serial_number[i] + "', ";
   
    //if(i<serial_number.length-1){
    //  
    //  col_sql += ', ';
    //  val_sql += ', ';
    //}
  }
  }
  for(i=0; i<= full_marks.length; i++){
    if(full_marks[i] !== undefined){
    col_sql +=  "full_marks" + (i+1) + ", ";
    val_sql += "'" + full_marks[i] + "', ";
   
    //if(i<full_marks.length-1){
    //  
    //  col_sql += ', ';
    //  val_sql += ', ';
    //}
  }
  }
  for(i=0; i<= obtained_marks.length; i++){
    if(obtained_marks[i] !== undefined){
    col_sql +=  "obtained_marks" + (i+1) + ", ";
    val_sql += "'" + obtained_marks[i] + "', ";
   
    
    //if(i<obtained_marks.length-1){
    //  
    //  col_sql += ', ';
    //  val_sql += ', ';
    //}
  }
  }

  for(i=0; i<= grade.length; i++){
    if(grade[i] !== undefined){
    col_sql +=  "grade" + (i+1) + "";
    val_sql += "'" + grade[i] + "'";
   
    if(i<grade.length-1){
      
      col_sql += ', ';
      val_sql += ', ';
    }
  }
  }

  //console.log(col_sql, val_sql);

  var std = std_id;

  var student_id = "'" + std + "'"
 
  if (errors.length > 0) {
    res.redirect("/result");
    ///res.render("staff-profile", {
    ///  message: "There may be some errors. Please try again."
    ///});
  } else {
    pool.query(
      `select student_id, first_name, last_name, student_class, session from student_details
       where student_id = $1`,
      [std],
     (err, results) => {
       if (err) {
         console.log(err);
         throw err;
       }

       let data = results.rows;
       
       //res.redirect("/AddStudentSession");

       var student_id = "'" + std + "', ";
       var student_class = "'" + data[0].student_class + "', ";
       var student_name = "'" + data[0].first_name + " " + data[0].last_name + "', ";
       var session = "'" + data[0].session + "', ";

       //console.log(std,student_class,student_name,session );
      

       pool.query(
        "insert into student_result (student_id, student_name, student_class, session, " + col_sql + ") values(" + student_id + student_name + student_class + session + val_sql + ")",
       (err, results) => {
         if (err) {
           console.log(err);
           throw err;
         }
         
         //res.redirect("/result");

         //--------------------------
      var details = "Created Result For Student ID: " + std;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/result");
        
        }
      );
      //---------------------------
       }
      );

     }
    );

    //console.log(pack);
  }
});


app.get("/student_result/getdata", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var student_class = "'" + data.student_class + "'";
  var test_name = "'" + data.test_name + "'";
  var session = "'" + data.session + "'";

  var student_id = "'" + std_id + "'";


  console.log("SELECT * from student_result where student_id = " + student_id + " and session = " + session + " and student_class = " + student_class + " and test_name = " + test_name);

  pool.query(
    "SELECT * from student_result where student_id = " + student_id + " and session = " + session + " and student_class = " + student_class + " and test_name = " + test_name,

      
    (err, results) => {
      if (err) {
        throw err;
      }

      let data = results.rows;
      res.send(data);
    }
  );
});


app.get("/studenttest/getdata", async (req, res) => {
 
  var student_id = std_id;

  pool.query(
    `select distinct(test_name) from student_result where student_id = $1`,
    [student_id],

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


//----------------file uplpad---------------------//

//app.post("/upload", function (request, result) {
//  var formData = new formidable.IncomingForm();
//  formData.parse(request, function (error, fields, files) {
//      var extension = files.file.name.substr(files.file.name.lastIndexOf("."));
//      var newPath = "uploads/" + fields.fileName + extension;
//      fs.rename(files.file.path, newPath, function (errorRename) {
//          result.send("File saved = " + newPath);
//      });
//      console.log(fields.fileName);
//  });
//
//  
//});


//----------------------contacts---------------------//

app.post("/contacts/add", async (req, res) => {

    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

// Date object initialized from the above datetime string
let date_nz = new Date(nz_date_string);

// year as (YYYY) format
let year = date_nz.getFullYear();

// month as (MM) format
let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
let date = ("0" + date_nz.getDate()).slice(-2);

// hours as (HH) format
let hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
let minutes = ("0" + date_nz.getMinutes()).slice(-2);

// seconds as (ss) format
let seconds = ("0" + date_nz.getSeconds()).slice(-2);

// date as YYYY-MM-DD format
let date_yyyy_mm_dd = year + "-" + month + "-" + date;


// time as hh:mm:ss format
let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


// date and time as YYYY-MM-DD hh:mm:ss format
let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;


  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = staff_id;

  let { f_name, l_name, email, number, address } = req.body;
  console.log(f_name, l_name, email, number, address);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/add_contact");
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO contacts (f_name, l_name, email, number, address)
        VALUES($1, $2, $3, $4, $5)`,
      [f_name, l_name, email, number, address],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/add_contact");

         //--------------------------
      var details = "Created Contact: " + f_name + ' ' + l_name;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/add_contact");
        
        }
      );
      //---------------------------
      }
    );
  }
});






app.get("/search_contact/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var f_name = data.fname;
  var l_name = data.lname;

  var f_name = "'%" + f_name + "%'";
  var l_name = "'%" + l_name + "%'";
  pool.query(
   "select * from contacts where f_name like" + f_name +  "and  l_name like" + l_name,
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);
      
      res.send(data);
    }
  );
});

//--------------------------remove contact--------------------//

app.get("/contact/remove", async (req, res) => {


    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
    
    // year as (YYYY) format
    let year = date_nz.getFullYear();
    
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
    
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
    
    // hours as (HH) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
    
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
    
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
    
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
    
    
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
    
    
    // date and time as YYYY-MM-DD hh:mm:ss format
    let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  pool.query(
    `delete from contacts where id = $1
    returning *`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/contact?id="+data.id);
      let data = results.rows;
      var name = data[0].f_name + ' ' + data[0].l_name;
       //--------------------------
       var details = "Delete Contact: " + name;
       var username  = req.user.username;
       var action_date = date_yyyy_mm_dd;
       var action_time = time_hh_mm_ss;
       //-----------add to system history---------//
 
       pool.query(
         `INSERT INTO system_history (details, username, action_date, action_time)
         VALUES($1, $2, $3, $4)`,
         [details, username, action_date, action_time],
       
       
         (err, results) => {
           if (err) {
             throw err;
           }
         
           res.redirect("/contact?id="+data.id);
         
         }
       );
       //---------------------------
    }
  );
});

//-----------------------get users---------------//



app.get('/user/getdata', (req, res) => {
  
    pool.query(
      "select username, name, phone, email from users where username != 'admin'",
     
        
     //    WHERE id = 1`,
     //  
       (err, results) => {
         if (err) {
           throw err;
         }
         let data = results.rows;
         
         res.send(data);
       }
     );
  
})


//----------------remove users-----------------//


app.get("/user/remove", async (req, res) => {


  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);
  
  // year as (YYYY) format
  let year = date_nz.getFullYear();
  
  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);
  
  // hours as (HH) format
  let hours = ("0" + date_nz.getHours()).slice(-2);
  
  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
  
  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  
  
  // date and time as YYYY-MM-DD hh:mm:ss format
  let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

var data = url.parse(req.url, true);
data = data.query;
var username = data.username;

pool.query(
  `delete from users where username = $1
  returning *`,
  [username],
  (err, results) => {
    if (err) {
      throw err;
    }
    //res.redirect("/contact?id="+data.id);
    let data = results.rows;
    var name = data[0].name;
     //--------------------------
     var details = "Deleted User: " + name;
     var username  = req.user.username;
     var action_date = date_yyyy_mm_dd;
     var action_time = time_hh_mm_ss;
     //-----------add to system history---------//

     pool.query(
       `INSERT INTO system_history (details, username, action_date, action_time)
       VALUES($1, $2, $3, $4)`,
       [details, username, action_date, action_time],
     
     
       (err, results) => {
         if (err) {
           throw err;
         }
       
         res.redirect("/contact?id="+data.id);
       
       }
     );
     //---------------------------
  }
);
});


//---------------------------------------------//


app.get("/user_info/getdata", async (req, res) => {

  var username = user_name;
  pool.query(
    `SELECT * FROM users
    WHERE username = ($1)`,
    [username],
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/user_info/edit_parmission", async (req, res) => {

  var str_username = "'" + user_name + "'";

  var emails = req.query.emails;

  var email_sql='';

  for(i=1; i<= 5; i++){
    if(emails[i] !== undefined){
    email_sql +=  "access" + i + " = '" + emails[i] + "'";
    if(i<5){
      email_sql += ', ';
    } 
  } else{
    email_sql +=  "access" + i + " = 'N/A'";
    if(i<5){
      email_sql += ', ';
    } 
  }
  }

  pool.query(
                      
    "update users set " + email_sql + "where username = " + str_username + "",
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/student");
      //function function2() {
        // all the stuff you want to happen after that pause
        
        res.redirect('/user_info?username='+ user_name +'');
        
      //}
     
      //setTimeout(function2, 3000);
    }
  );

  console.log(email_sql);

  
});


//-----------------------staff payment-----------------//

app.post("/staff_payment/pay", async (req, res) => {

  var staff_id_str = "'" + staff_id + "'";

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  let { manulaPurpose, manualAmount, payment_method } = req.body;

  console.log(manulaPurpose, manualAmount);
  console.log('ok');

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/staff-profile?staff_id=" + staff_id);
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO staff_payment (staff_id, purpose, amount, payment_date, payment_method)
        VALUES($1, $2, $3, $4, $5)
        returning *`,
      [staff_id, manulaPurpose, manualAmount, date_yyyy_mm_dd, payment_method],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        let data = results.rows;
      
      
      
        var description = "Made payment to " + staff_id;
        var debit = data[0].amount;
        var transaction_type = data[0].payment_method;
        var transaction_date = data[0].payment_date;
        
        

              //res.redirect('/student-profile?student_id='+ std +'');
              
              

              //-----------add to cashbook---------//

              pool.query(
                `INSERT INTO cashbook (description, debit, transaction_type, transaction_date, transaction_time)
                VALUES($1, $2, $3, $4, $5)`,
                [description, debit, transaction_type, transaction_date, time_hh_mm_ss],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }

                  //res.redirect("/staff-profile?staff_id=" + staff_id);
                  //--------------------------
                  var details = "Made payment to " + staff_id;
                  var username  = req.user.username;
                  var action_date = date_yyyy_mm_dd;
                  var action_time = time_hh_mm_ss;
                  
                  
          
                        //res.redirect('/student-profile?student_id='+ std +'');
                        
                        
          
                        //-----------add to system history---------//
          
                        pool.query(
                          `INSERT INTO system_history (details, username, action_date, action_time)
                          VALUES($1, $2, $3, $4)`,
                          [details, username, action_date, action_time],
                        
                        
                          (err, results) => {
                            if (err) {
                              throw err;
                            }
          
                            res.redirect("/staff-profile?staff_id=" + staff_id);
                            
                          }
                        );
                  //---------------------------
                }
              );
              
              
              
            }
          );
      
  }
});



app.get('/staff_payment/getdata', (req, res) => {
  
  var staff_id_str = "'" + staff_id + "'";
    pool.query(
      "select * from staff_payment where staff_id = " + staff_id_str,
     
        
     //    WHERE id = 1`,
     //  
       (err, results) => {
         if (err) {
           throw err;
         }
         let data = results.rows;
         
         res.send(data);
       }
     );
})



app.get('/staff_payment/remove', (req, res) => {
  

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;


  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  pool.query(
    `delete from staff_payment where id = $1
    returning *`,
      [id],
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       //res.send();

       let data = results.rows;
      
      
      
        var description = "Received Payment from: " + staff_id;
        var credit = data[0].amount;
        var transaction_type = data[0].payment_method;
        
        
        

              //res.redirect('/student-profile?student_id='+ std +'');
              
              

              //-----------add to cashbook---------//

              pool.query(
                `INSERT INTO cashbook (description, credit, transaction_type, transaction_date, transaction_time)
                VALUES($1, $2, $3, $4, $5)`,
                [description, credit, transaction_type, date_yyyy_mm_dd, time_hh_mm_ss],
              
              
                (err, results) => {
                  if (err) {
                    throw err;
                  }

                  //res.redirect("/staff-profile?staff_id=" + staff_id);

                  //--------------------------
                   var details = "Received Payment From: " + staff_id;
                   var username  = req.user.username;
                   var action_date = date_yyyy_mm_dd;
                   var action_time = time_hh_mm_ss;
                   //-----------add to system history---------//

                   pool.query(
                     `INSERT INTO system_history (details, username, action_date, action_time)
                     VALUES($1, $2, $3, $4)`,
                     [details, username, action_date, action_time],
                  
                  
                     (err, results) => {
                       if (err) {
                         throw err;
                       }
                     
                       res.redirect("/staff-profile?staff_id=" + staff_id);
                     
                     }
                   );
                   //---------------------------
                }
              );
       
       
     }
   );
})

app.post('/document_upload/staff/aadhaar', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + staff_id + "_aadhaar" + extension;
      
      
      fs.rename(files.aadhaar.path, newPath, function (errorRename) {
        console.log("file renamed")
      });

      res.redirect('/staff-profile?staff_id=' + staff_id + '');
      
  
})
})

app.post('/document_upload/staff/pan', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + staff_id + "_pan" + extension;
      
      
      fs.rename(files.pan.path, newPath, function (errorRename) {
        console.log("file renamed")
      });
      res.redirect('/staff-profile?staff_id=' + staff_id + '');
  
})
})

app.post('/document_upload/staff/bank', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + staff_id + "_bank" + extension;
      
      
      fs.rename(files.bank.path, newPath, function (errorRename) {
        console.log("file renamed")
      });
      res.redirect('/student-profile?staff_id=' + staff_id + '');
  
})
})

app.post('/document_upload/student/aadhaar', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + std_id + "_aadhaar" + extension;
      
      
      fs.rename(files.aadhaar.path, newPath, function (errorRename) {
        console.log("file renamed")
      });

      res.redirect('/student-profile?student_id=' + std_id + '');
      
  
})
})

app.post('/document_upload/student/pan', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + std_id + "_pan" + extension;
      
      
      fs.rename(files.pan.path, newPath, function (errorRename) {
        console.log("file renamed")
      });
      res.redirect('/student-profile?student_id=' + std_id + '');
  
})
})

app.post('/document_upload/student/bank', (req, res) => {
  
  //var std_student_id = "'" + std_id + "'";

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
      //var extension = files.studentPhoto.name.substr(files.studentPhoto.name.lastIndexOf("."));
      var extension = '.pdf';
      var newPath = "uploads/documents/" + std_id + "_bank" + extension;
      
      
      fs.rename(files.bank.path, newPath, function (errorRename) {
        console.log("file renamed")
      });
      res.redirect('/student-profile?student_id=' + std_id + '');
  
})
})


app.get('/dashboard/getdata', (req, res) => {
  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  var month_like = "%_____" + month  +"___%";
  
 
  

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
    `select sum(credit) as credit, sum(debit) as debit, (sum(credit)-sum(debit)) as earning from cashbook where transaction_date like $1`,
      [month_like],
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows
       res.send(data);
       
       
     }
   );
})



//----------------------readmission-----------------------------//

app.post("/StudentReadmission", async (req, res) => {
  let { rollNo, student_class, session, totalFees, January, February, March, April, May, June, July, August, September, October, November, December, admissionFees } = req.body;
console.log(rollNo, student_class, session, totalFees, January, February, March, April, May, June, July, August, September, October, November, December, admissionFees);


if(totalFees !== undefined) {
  var totalFees_status = 'Not Paid';
}
if(January !== undefined) {
  var January_status = 'Not Paid';
  var January_date = 'N/A';
}
if(February !== undefined) {
  var February_status = 'Not Paid';
  var February_date = 'N/A';
}
if(March !== undefined) {
  var March_status = 'Not Paid';
  var March_date = 'N/A';

}
if(April !== undefined) {
  var April_status = 'Not Paid';
  var April_date = 'N/A';

}
if(May !== undefined) {
  var May_status = 'Not Paid';
  var May_date = 'N/A';

}
if(June !== undefined) {
  var June_status = 'Not Paid';
  var June_date = 'N/A';

}
if(July !== undefined) {
  var July_status = 'Not Paid';
  var July_date = 'N/A';

}
if(August !== undefined) {
  var August_status = 'Not Paid';
  var August_date = 'N/A';

}
if(September !== undefined) {
  var September_status = 'Not Paid';
  var September_date = 'N/A';
}
if(October !== undefined) {
  var October_status = 'Not Paid';
  var October_date = 'N/A';

}
if(November !== undefined) {
  var November_status = 'Not Paid';
  var November_date = 'N/A';

}
if(December !== undefined) {
  var December_status = 'Not Paid';
  var December_date = 'N/A';

}
if(admissionFees !== undefined) {
  var admissionFees_status = 'Not Paid';
  var admissionFees_date = 'N/A';

}

//------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

let errors = [];


 
  if (errors.length > 0) {
    res.render("add_student", {
      message: "There may be some errors. Please try again."
    });
  } else {
        pool.query(

          `select session from student_details where student_id = $1`,
          [std_id],
          (err, results) => {
            if (err) {
              throw err;
            }

          var ssn_data = results.rows;
          var ssn = ssn_data[0].session;

          if(session == ssn) {
            console.log("Student already in session " + session);
            res.redirect('/student-profile?student_id=' + std_id + '');
          } else {

          pool.query(
            `update student_details set roll_no = $1, student_class = $2, session = $3
                where student_id = $4`,
            [rollNo, student_class, session, std_id],
            (err, results) => {
              if (err) {
                throw err;
              }
              //console.log(results.rows);
              //req.flash("success_msg", "You are now registered. Please log in");
              //res.redirect("/home");
              pool.query(
                `insert into fees_information_school (student_id, student_class, total_fees, january, february, march, april, may, june, july, august, september, october, november, december, admission_fees, session)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [std_id ,student_class, totalFees, January, February, March, April, May, June, July, August, September, October, November, December, admissionFees, session],
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  //console.log(results.rows);
                  //req.flash("success_msg", "You are now registered. Please log in");
                  //res.redirect("/home");
                  pool.query(
                    `insert into fees_information_school_status (student_id, student_class, january, february, march, april, may, june, july, august, september, october, november, december, admission_fees, session, january_date, february_date, march_date, april_date, may_date, june_date, july_date, august_date, september_date, october_date, november_date, december_date, admission_fees_date)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
                    [std_id, student_class, January_status, February_status, March_status, April_status, May_status, June_status, July_status, August_status, September_status, October_status, November_status, December_status, admissionFees_status, session, January_date, February_date, March_date, April_date, May_date, June_date, July_date, August_date, September_date, October_date, November_date, December_date, admissionFees_date],
                    (err, results) => {
                      if (err) {
                        throw err;
                      }
                      //console.log(results.rows);
                      //req.flash("success_msg", "You are now registered. Please log in");
                      //res.redirect('/student-profile?student_id=' + std_id + '');
                      //--------------------------
                         var details = "Re-admission student: " + std_id;
                         var username  = req.user.username;
                         var action_date = date_yyyy_mm_dd;
                         var action_time = time_hh_mm_ss;
                         //-----------add to system history---------//

                         pool.query(
                           `INSERT INTO system_history (details, username, action_date, action_time)
                           VALUES($1, $2, $3, $4)`,
                           [details, username, action_date, action_time],
                        
                        
                           (err, results) => {
                             if (err) {
                               throw err;
                             }
                           
                             res.redirect('/student-profile?student_id=' + std_id + '');
                           
                           }
                         );
                         //---------------------------
                    }
                  );
                }
              );
            }
          );
          }
          }
        );     
        }
});



//-------------------------bill print-------------------------//

var bill_sql='';
var bill_status_sql = '';
var other_bill_sql = '';

app.get('/payment_history/bill_print', (req, res) => {
  bill_sql='';
  bill_status_sql = '';
  other_bill_sql = '0';
  var emails = req.query.emails;
  var others = req.query.others;

  

  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
      bill_sql +=  emails[i];
    if(i<emails.length-1){
      bill_sql += ',';
    }
  }
  }

  for(i=2; i<= emails.length; i++){
    if(emails[i] !== undefined){
      bill_status_sql += emails[i];
      bill_status_sql += '_date';
      
    if(i<emails.length-1){
      bill_status_sql += ',';
    }
  }
  }

  for(i=2; i<= others.length; i++){
    if(others[i] !== undefined){
      if(i==1){
        other_bill_sql +=  ', ';
      }
      
      other_bill_sql +=  others[i];
    if(i<others.length-1){
      other_bill_sql += ',';
    }
  }
  }

  console.log(bill_sql);
  console.log(bill_status_sql);
  console.log(other_bill_sql);
  
  res.redirect('/view');
  
})

app.get('/student_payment_bill/getdata', (req, res) => {

  var student_id = "'" + std_id + "'";
  var std_session_str = "'" + std_session + "'";
  
  pool.query(
    "select " + bill_sql  + " from fees_information_school where student_id = " + student_id + " and session = " + std_session_str,
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       res.send(data);
       
       
     }
   );
})



app.get('/student_payment_bill/getdata2', (req, res) => {
  var student_id = "'" + std_id + "'";
  var std_session_str = "'" + std_session + "'";

  pool.query(
    "select " + bill_status_sql + " from fees_information_school_status where student_id = " + student_id + " and session = " + std_session_str,
    
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       res.send(data);
       
       
     }
   );
  
})

app.get('/student_payment_bill/getdata3', (req, res) => {
  var student_id = "'" + std_id + "'";
  var std_session_str = "'" + std_session + "'";

  

  pool.query(
    "select purpose, transaction_date, amount from other_expenses where id in ( " + other_bill_sql + " ) and " +
    "student_id = " + student_id + " and session = " + std_session_str,
    
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       res.send(data);
       
       
     }
   );
  
})

app.get('/student_payment_bill/getdata4', (req, res) => {
  var student_id = "'" + std_id + "'";

  pool.query(
    "select * from student_details where " +
    "student_id = " + student_id,
    
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       res.send(data);
       
       
     }
   );
  
})

app.get('/student_payment_bill/invoice', (req, res) => {
  var name = req.query.name;
  var date = req.query.date;
  pool.query(
    `insert into invoice (student_name, generation_date)
    values ($1, $2)
    returning *`,
    [name, date],
    
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       console.log(data[0]);
       res.send(data);
       
       
     }
   );
  
})

//---------- ADD Building & Room----------//

app.post("/building/add", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var data = url.parse(req.url, true);
  data = data.query;
  

  let { building_number } = req.body;
  console.log(building_number);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/room");
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO building (building_number)
        VALUES($1)`,
      [building_number],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/room");
        //--------------------------
        var details = "Add Building Number: " + building_number;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;
        //-----------add to system history---------//

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
       
       
          (err, results) => {
            if (err) {
              throw err;
            }
          
            res.redirect("/room");
          
          }
        );
        //---------------------------
      }
    );
  }
});

app.post("/room/add", async (req, res) => {
  
  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var data = url.parse(req.url, true);
  data = data.query;
  

  let { room_number } = req.body;
  console.log(room_number);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/room");
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO room (room_number)
        VALUES($1)`,
      [room_number],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/room");
        //--------------------------
        var details = "Add Room Number: " + room_number;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;
        //-----------add to system history---------//

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
       
       
          (err, results) => {
            if (err) {
              throw err;
            }
          
            res.redirect("/room");
          
          }
        );
        //---------------------------
      }
    );
  }
});


//--------------------------remove building--------------------//

app.get("/building/remove", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  

  pool.query(
    `delete from building where building_number = $1
    returning *`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/room?id="+data.id);

      let data = results.rows;
      var building_number = data[0].building_number;
      //--------------------------
      var details = "Remove Building Number: " + building_number;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
     
     
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/room?id="+data.id);
        
        }
      );
      //---------------------------
    }
  );
});



//--------------------------remove room--------------------//

app.get("/room/remove", async (req, res) => {

//------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  

  pool.query(
    `delete from room where room_number = $1 
    returning *`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      //res.redirect("/room?id="+data.id);
      let data = results.rows;
      var room_number = data[0].room_number;
      //--------------------------
      var details = "Remove Room Number: " + room_number;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;
      //-----------add to system history---------//

      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
     
     
        (err, results) => {
          if (err) {
            throw err;
          }
        
          res.redirect("/room?id="+data.id);
        
        }
      );
      //---------------------------
    }
  );
});
//--------------------End Remove Section------------------------------

app.get("/studentroom/getdata", async (req, res) => {
  let { room_number } = req.body;
 

  let errors = [];


  pool.query(
    `SELECT room_number FROM room
    order by room_number`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/studentbuilding/getdata", async (req, res) => {
  let { building_number } = req.body;
 

  let errors = [];


  pool.query(
    `SELECT building_number FROM building
    order by building_number`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});

//-----------------Search Room-------------------------------
app.get("/search_room", async (req, res) => {

 
   
  var data = url.parse(req.url, true);
  data = data.query;
  var building_number = data.building_number;
  var room_number = data.room_number;
  var student_id = data.student_id;
  var session = data.session;

 console.log(building_number, room_number, student_id, session);

 //------------array of values------------//
  var sql_val = [building_number, room_number, student_id, session];
  
  

//------------array  of columns------------//
  var sql_col = ['building_number','room_number','student_id', 'session'];


//-------------query string---------------//

var query='';

for(i=0; i<=sql_col.length-1; i++){
  if((sql_val[i] !== '') && (sql_val[i] !== undefined) && (sql_val[i] !== null)){
      query += sql_col[i]
      query += ' = ';
      query +=  "'" + sql_val[i] + "'";
      for(j=i; j<=sql_col.length-1; j++){
        if((sql_val[j+1] !== '') && (sql_val[j+1] !== undefined) && (sql_val[i] !== null)){
          query += ' and ';
          break
        }
        
      }
  }
}

console.log("This is query: " + query);

//-----------------------------------------//

  let errors = [];
  if (errors.length > 0) {
    res.render("room", { errors, building_number, room_number, student_id, session });
  } else{
    // Validation passed
          console.log(query);
          pool.query(
            "SELECT * FROM student_details WHERE " + query + " and status = 'active'",
            
            (err, results) => {
              if (err) {
                throw err;
              }
              let data = results.rows;
          
              res.send(data);
            }
          );
      }
});

//--------------Edit Building and Room Number---------------//


app.get("/room/edit", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  
  var data = url.parse(req.url, true);
  data = data.query;
  var std_student_id = data.student_id;
  var building_number = data.building_number;
  var room_number = data.room_number;


  console.log(building_number, room_number);

  let errors = [];

  if (!room_number) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.redirect("/room");
    //console.log("error is here");
  } else{
    // Validation passed
       
          pool.query(
            `UPDATE student_details
            SET building_number = ($1), room_number = ($2)
            WHERE student_id = ($3)`,
            [building_number, room_number, std_student_id],
             

            (err, results) => {
              if (err) {
                throw err;
              }
              //res.redirect('/room');

              //--------------------------
                var details = "Edit Building Number & Room Number of the student: " + std_student_id;
                var username  = req.user.username;
                var action_date = date_yyyy_mm_dd;
                var action_time = time_hh_mm_ss;
                //-----------add to system history---------//

                pool.query(
                  `INSERT INTO system_history (details, username, action_date, action_time)
                  VALUES($1, $2, $3, $4)`,
                  [details, username, action_date, action_time],
                
                
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                  
                    res.redirect("/room?id="+data.id);
                  
                  }
                );
            //---------------------------
            }
          );
            
      }
  });




//----------ADD Finance----------//

app.post("/finance/add", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var data = url.parse(req.url, true);
  data = data.query;
  

  let { name, purpose, amount, mobile, payee } = req.body;
  console.log(name, purpose, amount, mobile, payee);

  let errors = [];


 
  if (errors.length > 0) {
    res.redirect("/finance");
    //res.render("student-profile", {
    //  message: "There may be some errors. Please try again."
    //});
  } else {

    pool.query(
      `INSERT INTO finance (name, purpose, amount, mobile, payee, transaction_date)
        VALUES($1, $2, $3, $4, $5, $6)`,
      [name, purpose, amount, mobile, payee, date_yyyy_mm_dd],
      (err, results) => {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log(results.rows);
        //res.redirect("/finance");
        

        //--------------------------
        var details = "Add Finance By: " + payee;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;
        //-----------add to system history---------//

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");

            //--------------------------
        var description = purpose;
        var debit = amount;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;
        //-----------add to system history---------//

        pool.query(
          `INSERT INTO cashbook (description, debit, transaction_date, transaction_time)
                VALUES($1, $2, $3, $4)`,
          [description, debit, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            res.redirect("/finance");
          
          }
        );
          
          }
        );
    //---------------------------
      }
    );
  }
});


app.get("/finance/getdata", async (req, res) => {
  let { id } = req.body;
 

  let errors = [];


  pool.query(
    `SELECT * FROM finance
    order by id`,
    

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



//-------------------recycle bin---------------------------//

//--------------------------Search students--------------------//





app.get("/bin_student/getdata", async (req, res) => {

 

//----------------------------------------//

  let errors = [];
  if (errors.length > 0) {
    res.render("student");
  } else{
    // Validation passed
    
          pool.query(
            "SELECT * FROM student_details where status ='deactive'",
            
            (err, results) => {
              if (err) {
                throw err;
              }
              let data = results.rows;
              console.log("bin")
              res.send(data);
            }
          );
      }
});


app.get("/bin_staff/getdata", async (req, res) => {

 

  //----------------------------------------//
  
    let errors = [];
    if (errors.length > 0) {
      res.render("student");
    } else{
      // Validation passed
      
            pool.query(
              "SELECT * FROM staff_details where status ='deactive'",
              
              (err, results) => {
                if (err) {
                  throw err;
                }
                let data = results.rows;
                console.log("bin")
                res.send(data);
              }
            );
        }
  });


//--------------------------Search students--------------------//





app.get("/search_bill", async (req, res) => {

 
   
  var data = url.parse(req.url, true);
  data = data.query;
  var bill_id = data.bill_id;

 

 //------------array of values------------//
  var sql_val = [bill_id];
  
  

//------------array  of coluns------------//
  var sql_col = ['id'];


//-------------query string---------------//

var query='';

for(i=0; i<=sql_col.length; i++){
  if((sql_val[i] !== '') && (sql_val[i] !== undefined)){
      query += sql_col[i]
      query += ' = ';
      query +=  "'" + sql_val[i] + "'";
      if((i < sql_col.length-1) && (sql_val[i+1] !== '') && (sql_val[i+1] !== undefined) ){
        query += ' and ';
      }
  }
}





//-----------------------------------------//

  let errors = [];
  if (errors.length > 0) {
    res.render("invoice", { errors, bill_id });
  } else{
    // Validation passed
    
          pool.query(
            "SELECT * FROM invoice where " + query + " ",
            
            (err, results) => {
              if (err) {
                throw err;
              }
              let data = results.rows;
          
              res.send(data);
            }
          );
      }
});



//------------------system history getdata-------------------//

app.get("/system_history/getdata", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  

  let errors = [];
  pool.query(
    `SELECT * FROM system_history
    where action_date = $1
    order by id desc`,
    [date_yyyy_mm_dd],

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});
