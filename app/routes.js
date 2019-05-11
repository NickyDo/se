var mysql = require('mysql');
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123",
    database: "test"
});

connection.connect((err) => {
    if (!err)
        console.log("DB connection succeded");
    else
        console.log("DB connection failed \n Error" + JSON.stringify(err, undefined, 2))
});


module.exports = function (app, passport) {
    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    app.get('/employees', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM datas", (err, rows) => {
            if (!err) {
                // res.send(rows)
                res.render('user.ejs', {title: "RESTful Crud Example", data: rows});

            } else {
                console.log(err)
            }
        })
    });

    app.get('/employees/:id', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM datas WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    });

    app.delete('/employees/:id', isLoggedIn, function (req, res) {
        connection.query("DELETE * FROM datas WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send("delete successfully")
            } else {
                console.log(err)
            }
        })
    });

    app.post('/employees', isLoggedIn, function (req, res) {
        // connection.query("INSERT * FROM datas WHERE id = ?", [req.params.id], (err, rows) => {
        //     if (!err) {
        //         res.send("delete successfully")
        //     } else {
        //         console.log(err)
        //     }
        // })


        //get data
        var data = {
            device: req.body.device,
            status: req.body.status,
            property: req.body.property
        };

        console.log("Datas", data)

        //inserting into mysql
        // req.getConnection(function (err, conn){

        // if (err) return next("Cannot Connect");

        connection.query("INSERT INTO datas set ? ", data, function (err, rows) {

            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.sendStatus(200);

        });

        // });
    });

    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/profile',
            failureRedirect: '/login',
            failureFlash: true
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/');
        });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/profile', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM datas", (err, rows) => {
            if (!err) {
                // res.send(rows)
                res.render('profile.ejs', {title: "RESTful Crud Example", data: rows, user: req.user});

            } else {
                console.log(err)
            }
        })
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    })
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
