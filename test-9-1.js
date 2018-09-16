let MongoClient = require('mongodb').MongoClient

// Connection URL
let url = 'mongodb://pwcuser:password@localhost:40000';

let MinKey = require('mongodb').MinKey;
let MaxKey = require('mongodb').MaxKey;

test();

async function test() {

  let client = await MongoClient.connect(url);
  let db = client.db("admin");

  let adminDb = db.admin();

  await adminDb.command({ addShardToZone : "shard01" , zone : "APAC" });

  await adminDb.command({ addShardToZone : "shard02" , zone : "US" });

  await adminDb.command({ enablesharding: 'pwc' });

  await adminDb.command({ shardCollection: 'pwc.test', key: {location: 1, userid: 1}});

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.test',
                  min: { "location" : "APAC", "userid" : new MinKey() },
                  max: { "location" : "APAC", "userid" : new MaxKey() },
                  zone: "APAC"
                  });

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.test',
                  min: { "location" : "US", "userid" : new MinKey() },
                  max: { "location" : "US", "userid" : new MaxKey() },
                  zone: "US"
                  });

  await adminDb.command({shardCollection: 'pwc.fs.files', key: {"_id": 1}})

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.fs.files',
                  min: { "_id" : {"location": "APAC", "fileId" : MinKey() }},
                  max: { "_id" : {"location": "APAC", "fileId" : MaxKey() }},
                  zone: "APAC"
                  });

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.fs.files',
                  min: { "_id" : {"location": "US", "fileId" : MinKey() }},
                  max: { "_id" : {"location": "US", "fileId" : MaxKey() }},
                  zone: "US"
                  });

  await adminDb.command({shardCollection: 'pwc.fs.chunks', key: {"files_id": 1}})

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.fs.chunks',
                  min: { "files_id" : {"location": "APAC", "fileId" : MinKey() }},
                  max: { "files_id" : {"location": "APAC", "fileId" : MaxKey() }},
                  zone: "APAC"
                  });

  await adminDb.command({
                  updateZoneKeyRange: 'pwc.fs.chunks',
                  min: { "files_id" : {"location": "US", "fileId" : MinKey() }},
                  max: { "files_id" : {"location": "US", "fileId" : MaxKey() }},
                  zone: "US"
                  });

   console.log("The zoned-sharding configuration is done successfully!");
   process.exit(0);

}
