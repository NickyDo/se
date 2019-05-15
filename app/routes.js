const request = require('superagent');
var mysql = require('mysql');
const util = require('util');


var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123",
    database: "test",
    multipleStatements: true
});
const query = util.promisify(connection.query).bind(connection);

connection.connect((err) => {
    if (!err)
        console.log("DB connection succeded");
    else
        console.log("DB connection failed \n Error" + JSON.stringify(err, undefined, 2))
});


// var deviceName = ['WemosD1'];
var duyDevice = [];
var detail_device = []

module.exports = function (app, passport) {
    app.get('/', async function (req, res, next) {

        res.render('login.ejs', {message: req.flash('loginMessage')});
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

    app.delete('/devices/:device', isLoggedIn, function (req, res) {
        // connection.query("SELECT * FROM devices WHERE device = ?", [req.body.username], (err, rows) => {
        //
        // })
        console.log("delete", req.params.device)

        connection.query("DELETE FROM devices WHERE device = ?", [req.params.device], (err, rows) => {
            if (!err) {
                res.send("delete successfully")
            } else {
                console.log(err)
            }
        })
    });

    app.delete('/delete_device/:id', isLoggedIn, function (req, res) {
        // connection.query("SELECT * FROM devices WHERE device = ?", [req.body.username], (err, rows) => {
        //
        // })id
        console.log("delesteid", req.params.id)

        connection.query("DELETE FROM devices WHERE id = ?", [req.params.id], (err, rows) => {
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

    });

    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/item',
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
        // successRedirect: '/detail_device',
        successRedirect: '/item',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/dashboard', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                // res.send(rows)
                console.log("aaaa", rows[rows.length - 1])
                res.render('add_device.ejs', {
                    title: "RESTful Crud Example",
                    data: rows,
                    user: req.user
                });

            } else {
                console.log(err)
            }
        })


    });

    app.get('/detail', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices WHERE user = ?", [req.user.username], (err, rows) => {
            if (!err) {
                // res.send(rows)
                console.log("aaaa", rows, req.user)
                res.render('detail.ejs', {
                    title: "detail",
                    data: rows,
                    user: req.user,
                });

            } else {
                console.log(err)
            }
        })


    });

    app.get('/detail_device', isLoggedIn, async function (req, res) {
        try {
            let rows = await query('select * from devices where user = ? and device = ?', [detail_device[0], detail_device[1]]);
            console.log("items", rows);
            res.render('detail_device.ejs', {
                title: "detail",
                data: rows,
                user: req.user,
            });

        } finally {
            // connection.end();
        }


    });


    app.post('/log', isLoggedIn, function (req, res) {
        detail_device = []
        detail_device = [req.user.username, req.body.device]
        console.log("log", req.body.device)
        connection.query("SELECT * FROM devices WHERE user = ? AND device = ?", [req.user.username, req.body.device], (err, rows) => {
            if (!err) {
                // res.send(rows)

            } else {
                console.log(err)
            }
        })
        res.send("OK")

    });


    app.get('/item', isLoggedIn, async function (req, res) {
        // console.log("req.body.username", currentUser)
        connection.query("SELECT device FROM devices WHERE user = ? and status = ?", [req.user.username, ''], async (err, rows) => {
            if (!err) {
                // res.send(rows)
                let rowsAll = []

                try {
                    for (let i = 0; i < rows.length; i++) {
                        let us = rows[i].device
                        let rows1 = await query('select * from devices where device = ?', [us]);
                        rowsAll.push(rows1[rows1.length - 1])
                    }
                    // let rows2 = await query('select * from devices where device = "WemosD1"');
                    console.log("items", rowsAll);
                    res.render('item.ejs', {
                        title: "detail",
                        data: rowsAll,
                        user: req.user,
                    });
                } finally {
                    // connection.end();
                }

            } else {
                console.log(err)
            }
        })
        console.log("duyDevice", duyDevice);
    });

    app.post('/dashboard', isLoggedIn, async function (req, res, next) {
        let checkDevice = duyDevice.filter((item) => {
            return item == req.body.device
        })
        if (checkDevice == req.body.device) {

        } else {
            duyDevice.push(req.body.device)

        }
        let defaultData = {
            device: req.body.device,
            time: '',
            user: req.body.username,
            voltage: '',
            prob: '',
            status: '',
            date: getDate()
        };

        connection.query("SELECT * FROM devices WHERE device = ?", [req.body.device], (err, rowss) => {
            console.log("rowss.length", rowss.length)
            if (rowss.length < 1) {
                connection.query("INSERT INTO devices set ? ", defaultData, function (err, re) {

                    if (err) {
                        console.log(err);
                        return next("Mysql error, check your query");
                    } else {
                        console.log("POST OK!");

                    }
                });
                res.send("OK")
            }else if(req.body.device === ''){
                res.send("NOTHING")
            }
            else{
                res.send("ALREADY")
            }

            setTimeout(() => {
                setInterval(() => {
                    request
                    // .get('https://dog.ceo/api/breeds/list/all')
                        .get('http://192.168.1.69:1880/ESP')
                        .then((r) => {
                            console.log("res.body", r.body);
                            // r.body = {
                            //     device: 'WemosD1',
                            //     time: '50157293',
                            //     user: '  duy',
                            //     voltage: '493421',
                            //     prob: 'Temp-27.20,Hum-72.00',
                            //     status: "ON",
                            //     date: getDate()
                            // };

                            let data = {
                                device: r.body.device,
                                time: r.body.time,
                                user: r.body.user,
                                voltage: r.body.voltage,
                                prob: r.body.prob,
                                status: "ON",
                                date: getDate()
                            };

                            console.log('data', req.body.device, req.body.username, r.body.user, r.body.device)

                            connection.query("SELECT * FROM devices WHERE device = ?", [r.body.device], (err, rows) => {
                                if (!err && rows[rows.length - 1] !== undefined && rows[rows.length - 1].user == r.body.user) {
                                    if (rows[rows.length - 1].device == r.body.device) {
                                        if (parseInt(rows[rows.length - 1].time) !== parseInt(r.body.time)) {
                                            console.log("trungtime", rows[rows.length - 1].time, r.body.time)
                                            connection.query("INSERT INTO devices set ? ", data, function (err, re) {

                                                if (err) {
                                                    console.log(err);
                                                    return next("Mysql error, check your query");
                                                } else {
                                                    console.log("POST OK!");
                                                    setTimeout(() => {
                                                        checkStatusDevice(r.body.device, r.body.user)
                                                    }, 31000)
                                                }
                                            });
                                        } else {
                                            console.log("everything is up to date")
                                        }

                                    } else {
                                        connection.query("INSERT INTO devices set ? ", data, function (err, re) {

                                            if (err) {
                                                console.log(err);
                                                return next("Mysql error, check your query");
                                            } else {
                                                console.log("POST OK!");
                                                setTimeout(() => {
                                                    checkStatusDevice(r.body.device, r.body.user)
                                                }, 31000)
                                            }
                                        });
                                    }
                                } else {
                                    console.log(err)
                                }
                            });
                            // }


                        })
                        .catch(err => {
                            console.log(err);
                        });

                }, 2000)

            }, 5000)
        })


    });


    app.get('/logout', function (req, res) {
        req.logout();
        console.log("req.isAuthenticated()", req.isAuthenticated())
        res.redirect('/');
    })
};

function checkStatusDevice(item, user) {
    connection.query("SELECT * FROM devices WHERE device = ?", [item], (err, rows) => {
        if (!err) {
            // res.send(rows)
            console.log("dv", rows);
            if (rows.length >= 2) {
                let ti1 = parseInt(rows[rows.length - 1].time) - parseInt(rows[rows.length - 2].time);
                console.log("dvtime", ti1);
                let tc1 = Date.parse(getDate());
                let tc2 = Date.parse(rows[rows.length - 1].date);
                console.log("t2", tc1, tc2, tc1 - tc2);
                if ((tc1 - tc2) > ti1 || (tc1 - tc2) === undefined) {
                    let offlineData = {
                        device: item,
                        time: 'No Information',
                        user: user,
                        voltage: 'No Information',
                        prob: 'No Information',
                        status: "OFF",
                        date: getDate()
                    };

                    console.log(rows[rows.length - 1].device + ":OFF");

                    connection.query("INSERT INTO devices set ? ", offlineData, function (err, rows, next) {

                        if (err) {
                            console.log(err);
                            return next("Mysql error, check your query");
                        } else {
                            console.log("POST update status OK!")
                        }
                    });
                }
            }

        } else {
            console.log(err)
        }
    })

}

function checkLoginForLoginPage(req, res, next) {
    console.log("req.isAuthenticated()", req.isAuthenticated())
    if (req.isAuthenticated() === true) {
        res.redirect('/item')
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
