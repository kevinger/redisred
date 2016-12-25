var redirectModel = require('../../models/Redirect');
var validate = require("validate.js");

module.exports = function(redis, passport) {
  var Redirect = redirectModel(redis);
  var FrontendController = {};

  //Authentication stuff...
  FrontendController.authenticate = function(req, res, next) {
    if (req.isAuthenticated())
      return next();
    else
      res.redirect('/admin');
  };

  FrontendController.showLogin = function(req, res) {
    if (req.isAuthenticated())
      res.redirect('/admin/redirects');
    else
      res.render('admin/root');
  };

  FrontendController.login = passport.authenticate('local', {
    successRedirect: '/admin/redirects',
    failureRedirect: '/admin#incorrect'
  });

  FrontendController.logout = function(req, res) {
    req.session.destroy(function () {
      res.redirect('/admin');
    });
  };

  //Actual display logic
  FrontendController.getAllRedirects = function(req, res) {
    Redirect.getAll(function(err, redirects) {
      if (err)
        res.status(500).send(err);
      else {
        res.status(200).render('admin/redirects', { redirects: redirects, token: req.csrfToken() });
      }
    });
  };

  FrontendController.createRedirect = function(req, res) {
    var key = req.body.key;
    var url = req.body.url;
    var msg = testUrlConditions(key, url);
    if (!key || !url || (msg != 'undefined')) {
      res.status(400).send(msg);
      res.status(400).send("Controller Create: You failed to supply all of the parameters.");
      return;
    }
    Redirect.create(key, url, function(err, redirect) {
      if (err)
        res.status(500).send(err);
      else
        res.redirect('/admin/redirects');
    });
  };

  testUrlConditions = function(key, url, res) {
    // maybe use this: https://validatejs.org/?
    // 0. make sure this key isn't a url
    if(validate({website: key}, {website: {url: true}}) === 'undefined') {
      console.log('testing key: ' + key);
      return 'Bad key, bro!'
    } else {
      console.log('passed testing key: ' + key);
    }

    // 1. make sure this key isn't already being used
    // 2. make sure this url isn't a key
    // 3. make sure this url isn't already assigned a key

    // 4. make sure this url is valid
    if(validate({website: url}, {website: {url: true}}) === 'undefined') {
      console.log('testing url: ' + url);
      return 'Bad URL, dude!';
    } else {
      console.log('passed testing URL: ' + key);
    }

    console.log('testing url: ' + url + ' = ' + (validate({website: url}, {website: {url: true}})));
    console.log('testing key: ' + key + ' = ' + (validate({website: key}, {website: {url: true}})));
    console.log('at the end?');

    // 5. examine query string args...for something

    return undefined;
  }

  FrontendController.deleteRedirect = function(req, res) {
    var key = req.body.key;
    if (!key) {
      res.status(400).send("Controller Delete: You failed to supply all of the parameters.");
      return;
    }
    Redirect.delete(key, function(err) {
      if (err)
        res.status(500).send(err);
      else
        res.redirect('/admin/redirects');
    });
  };

  return FrontendController;
};
