#!/bin/env node

var app = {};
  
var http = require('http');
 
var fs      = require('fs');
var express = require('express');

var jquery = fs.readFileSync("./jquery-1.8.3.min.js").toString();

//var EngineProvider = require('./engine').EngineProvider;
//var engine         = new EngineProvider();

var _ = require('underscore')._;
var async = require('async');
var request = require('request');

/////////////////////////////////////////////////////////////////////////////////////////////
// configuration
/////////////////////////////////////////////////////////////////////////////////////////////

var zcache = { 'index.html': '' };
zcache['index.html'] = fs.readFileSync('./public/index.html');

var app = module.exports = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.dynamicHelpers({
  session: function(req, res){
    return req.session;
  },
  user_id: function(req, res) {
    if(req.session && req.session.user_id) {
      return req.session.user_id;
    }
    return null;
  },
});

/////////////////////////////////////////////////////////////////////////////////////////////
// routes
/////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Provide webpage.
 */
app.get('/', function(req, res){
    res.send(zcache['index.html'], {'Content-Type': 'text/html'});
});

/**
 * Search database by passing it a mongo search object.
 */
app.post('/data', function(req, res, options){
  var blob = req.body;

  if(!blob.options.limit){
    var limit = {'limit': 0};
  }
  else {
    var limit = blob.options.limit;
  }
  console.log(limit);
  engine.find_many_by(blob,function(error, results) {
    if(!results || error) {
      console.log("agent query error");
      res.send("[]");
      return;
    }
    res.send(results);
  },{}, limit);
});

app.get('/tags', function(req, res, options){
  var json = require('./data/tags.json');
  res.send(json);
});



app.get('/tags/create', function(req, res) {

  var json = require('./data/data.json');
  var obj = json.rows;
  var tagsObjectMain = {
   "children": []
  };
  var tagsObject = {};

  for(var i = 0; i < obj.length; i++) {
    var item = obj[i];
    var tags = JSON.parse(item.tags_json);

    if(tags !== null) {
      for(var t=0;t< tags.length; t++){
        var tag = app.trim(tags[t]);
        
        if(!tagsObject[tag]) {
          tagsObject[tag] = new Array();
        }
  
        var exists =  _.contains(tagsObject[tag], item);
        if(!exists) {
          tagsObject[tag].push(item);
        }
      }
    }
  }  

  tagsObjectMain['children'].push(tagsObject); 
  var filename = 'data/tags.json';
  var stream = fs.createWriteStream(filename);
  var content = JSON.stringify(tagsObjectMain);
  fs.writeFile(filename, content, function (err) {});
});


app.trim = function(str){
  if(str !== undefined){
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
    }
    else {
      return '';
  }
}


/////////////////////////////////////////////////////////////////////////////////////////////
// openshift internal routes
/////////////////////////////////////////////////////////////////////////////////////////////

app.get('/health', function(req, res){
    res.send('1');
});

// Handler for GET /asciimo
app.get('/asciimo', function(req, res){
    var link="https://a248.e.akamai.net/assets.github.com/img/d84f00f173afcf3bc81b4fad855e39838b23d8ff/687474703a2f2f696d6775722e636f6d2f6b6d626a422e706e67";
    res.send("<html><body><img src='" + link + "'></body></html>");
});

/////////////////////////////////////////////////////////////////////////////////////////////
// openshift boot up
/////////////////////////////////////////////////////////////////////////////////////////////

var ipaddr  = process.env.OPENSHIFT_INTERNAL_IP;
var port    = process.env.OPENSHIFT_INTERNAL_PORT || 3000;

if (typeof ipaddr === "undefined") {
   console.warn('No OPENSHIFT_INTERNAL_IP environment variable');
}

function terminator(sig) {
   if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...',
                  Date(Date.now()), sig);
      process.exit(1);
   }
   console.log('%s: Node server stopped.', Date(Date.now()) );
}

process.on('exit', function() { terminator(); });

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});

app.listen(port, ipaddr, function() {
   console.log('%s: Node server started on %s:%d ...', Date(Date.now() ),
               ipaddr, port);
});
