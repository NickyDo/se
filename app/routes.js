const request = require('superagent');
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
    let device;
    app.get('/', async function (req, res, next) {
        await request
            .get('http://192.168.1.4:1880/ESP')
            .then((r) => {
                res.body = r.body;
                console.log("res.body", r.body);
                let data = {
                    time:  r.body.time,
                    analog: r.body.analog,
                    prob: r.body.prob
                };

                // console.log(data)

                connection.query("SELECT * FROM devices WHERE device = ?", [r.body.device], (err, rows) => {
                    if (!err) {
                        // console.log("datsa", rows[0].time);
                        device = rows[0].device
                        if(rows[0].device && rows[0].time !== r.body.time){
                            connection.query("UPDATE devices set ? WHERE device = ? ", [data, r.body.device], function (err, rows) {
                                console.log("aaa", r.body.device, data)

                                if (err) {
                                    console.log("sss",err);
                                    return next("Mysql error, check your query");
                                }else {
                                    console.log("vvv")
                                }

                                // res.sendStatus(200);

                            });
                        }
                    } else {
                        console.log(err)
                    }
                });



            })
            .catch(err => {
                console.log(err);
            });
        res.render('index.ejs');
    });

    app.get('/login', checkLoginForLoginPage, function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    app.get('/devices', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                // res.send(rows)
                res.render('user.ejs', {title: "RESTful Crud Example", data: rows});

            } else {
                console.log(err)
            }
        })
    });

    app.get('/devices/:id', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    });

    app.delete('/devices/:id', isLoggedIn, function (req, res) {
        connection.query("DELETE * FROM devices WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send("delete successfully")
            } else {
                console.log(err)
            }
        })
    });

    app.post('/devices', isLoggedIn, function (req, res) {
        //get data
        var data = {
            device: req.body.device,
            time: req.body.time,
            prob: req.body.prob
        };

        console.log("Datas", data)

        connection.query("INSERT INTO devices set ? ", data, function (err, rows) {

            if (err) {
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.sendStatus(200);

        });

        // });
    });

    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/dashboard',
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
        successRedirect: '/dashboard',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/dashboard', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                // res.send(rows)
                res.render('dashboard.ejs', {title: "RESTful Crud Example", data: rows, user: req.user});

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

function checkLoginForLoginPage(req, res, next) {
    console.log("req.isAuthenticated()", req.isAuthenticated())
    if(req.isAuthenticated() === true){
        res.redirect('/dashboard')
    } else{
        return next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
