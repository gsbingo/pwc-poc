var assert = require('assert');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

var uri = 'mongodb://pwcuser:password@localhost:40000/pwc?authSource=admin&retryWrites=true';

mongodb.MongoClient.connect(uri,function(error, client) {
  assert.ifError(error);
  var db=client.db('pwc');
  var tests = db.collection('test');
  var locations = ["APAC","US"];  

  for (var i=0; i<1000; i++) {

  if(i & 1)
     {
     //insert the doc with the location of "APAC" and "US" randomly;
     //if i is odd, insert the doc with the location of "APAC";
      tests.insert({location: locations[0], userid: new ObjectID()},function(err,result){
                  if(err) throw err;
                  console.log("the document with the location of " + locations[0] + " is inserted" );      
                  });
     }
  else
     {
     //if i is even, insert the doc with the location of "US";
     tests.insert({location: locations[1], userid: new ObjectID()},function(err,result){
                 if(err) throw err;
                 console.log("the document with the location of " + locations[1] + " is inserted" );
                 });
     }
  };
})

