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

var deviceName = ['WemosD1', 'ESP8266']

module.exports = function (app, passport) {
    app.get('/', async function (req, res, next) {
        await request
            .get('http://192.168.1.4:1880/ESP')
            .then((r) => {
                res.body = r.body;
                console.log("res.body", r.body);
                let data = {
                    device: r.body.device,
                    time: r.body.time,
                    analog: r.body.analog,
                    prob: r.body.prob,
                    status: "ON",
                    date: getDate()
                };

                // console.log(data)

                connection.query("SELECT * FROM devices WHERE device = ?", [r.body.device], (err, rows) => {
                    if (!err) {
                        console.log("datsa", rows[rows.length - 1]);
                        if (rows[0] !== undefined) {
                            if (rows[rows.length - 1].device === r.body.device && rows[rows.length - 1].time === r.body.time) {

                            } else {
                                connection.query("INSERT INTO devices set ? ", data, function (err, rows) {

                                    if (err) {
                                        console.log(err);
                                        return next("Mysql error, check your query");
                                    } else {
                                        console.log("POST OK!")
                                    }
                                });
                                checkStatusDevice()
                            }
                        } else {
                            connection.query("INSERT INTO devices set ? ", data, function (err, rows) {

                                if (err) {
                                    console.log(err);
                                    return next("Mysql error, check your query");
                                } else {
                                    console.log("POST OK!")
                                }
                            });
                            checkStatusDevice()
                        }
                    } else {
                        console.log(err)
                    }
                });


            })
            .catch(err => {
                console.log(err);
            });
        setInterval(async ()=>{
            await request
                .get('http://192.168.1.4:1880/ESP')
                .then((r) => {
                    res.body = r.body;
                    console.log("res.body", r.body);
                    let data = {
                        device: r.body.device,
                        time: r.body.time,
                        analog: r.body.analog,
                        prob: r.body.prob,
                        status: "ON",
                        date: getDate()
                    };

                    // console.log(data)

                    connection.query("SELECT * FROM devices WHERE device = ?", [r.body.device], (err, rows) => {
                        if (!err) {
                            if (rows[0] !== undefined) {
                                if (rows[rows.length - 1].device === r.body.device && rows[rows.length - 1].time === r.body.time) {
                                  console.log("everything is up to date")
                                } else {
                                    connection.query("INSERT INTO devices set ? ", data, function (err, rows) {

                                        if (err) {
                                            console.log(err);
                                            return next("Mysql error, check your query");
                                        } else {
                                            console.log("POST OK!")
                                        }
                                    });
                                }
                            } else {
                                connection.query("INSERT INTO devices set ? ", data, function (err, rows) {

                                    if (err) {
                                        console.log(err);
                                        return next("Mysql error, check your query");
                                    } else {
                                        console.log("POST OK!")
                                    }
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
            }, 5000)

        setInterval(()=>{
            checkStatusDevice()
        }, 15000)

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

    app.post('/dashboard', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                res.send(rows)
                // res.response = rows

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

function checkStatusDevice() {
 for(let i = 0; i < deviceName.length; i++){
     connection.query("SELECT * FROM devices WHERE device = ?", [deviceName[i]], (err, rows) => {
         if (!err) {
             // res.send(rows)
             console.log("dv",rows);
             let ti1 = rows[rows.length - 1].time - rows[rows.length  - 2].time;
             console.log("dvtime",ti1);
             let tc1 = Date.parse(getDate())
             let tc2 = Date.parse(rows[rows.length - 1].date)
             console.log("t2", tc1, tc2 ,tc1-tc2)
             if((tc1 - tc2)  > ti1){
                     let offlineData = {
                         device: deviceName[i],
                         time: rows[rows.length - 1].time,
                         analog: 'No Information',
                         prob: 'No Information',
                         status: "OFF",
                         date: getDate()
                     };
                     console.log(rows[rows.length - 1].device + ":OFF");
                     connection.query("INSERT INTO devices set ? ", offlineData, function (err, rows) {

                         if (err) {
                             console.log(err);
                             return next("Mysql error, check your query");
                         } else {
                             console.log("POST update status OK!")
                         }
                     });
             }

         } else {
             console.log(err)
         }
     })
 }
}

function checkLoginForLoginPage(req, res, next) {
    console.log("req.isAuthenticated()", req.isAuthenticated())
    if (req.isAuthenticated() === true) {
        res.redirect('/dashboard')
    } else {
        return next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function getDate() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date + ' ' + time
}
