'use strict';

const MongoBench = require('../mongoBench');
const fs = require('fs');
const Runner = MongoBench.Runner;
const commonHelpers = require('./common');
const objectId = require('mongodb').ObjectID;

const Promise = require('bluebird')

const makeClient = commonHelpers.makeClient;
const connectClient = commonHelpers.connectClient;
const disconnectClient = commonHelpers.disconnectClient;
const initDb = commonHelpers.initDb;
const dropDb = commonHelpers.dropDb;
const createCollection = commonHelpers.createCollection;
const initCollection = commonHelpers.initCollection;
const dropCollection = commonHelpers.dropCollection;
const makeLoadJSON = commonHelpers.makeLoadJSON;
const loadSpecString = commonHelpers.loadSpecString;
const loadSpecFile = commonHelpers.loadSpecFile;
const initBucket = commonHelpers.initBucket;
const dropBucket = commonHelpers.dropBucket;

function hrtimeToSeconds(hrtime) {
  return hrtime[0] + hrtime[1] / 1e9;
}
/**
 * In the test case, firstly upload the files, then query these files.
 * upload the files to shard with location 'US' and 'APAC', then query 
 * these files with the readPreference nearest and get average query time;
 */

function uploadFile(bucket, loc, path) {
    
    return new Promise((resolve, reject) => {

        const gridStream = bucket.openUploadStreamWithId({location: loc, fileId: new objectId()},path.slice(2));

        fs.createReadStream(path).
            pipe(gridStream).
            on('error', function (error) {
                reject(error)
            }).
            on('finish', function () {
                return resolve(gridStream.id);
            })
    })
}

function downloadFile(bucket, path) {

    return new Promise((resolve, reject) => {

        const paraStart = process.hrtime();

        bucket.openDownloadStream(path).
                  resume().
                  on('error', function(error) {
                        reject(error);
                  }).
                  on('end',function() { 
                        let paraTime = process.hrtime(paraStart);
                        resolve(hrtimeToSeconds(paraTime));
                  });
    })
}

function loadMulGridFs() {      //Change the array size to set how many files for upload/download

  this.files = Array.apply(null, Array(100)).map((v, i) => {      
        return `./spec/single_and_multi_document/gridfs_5m.bin`;
     })
}

async function timer(){ 
    console.log("     wait for 500s for uploading finishment");
    await new Promise(done => setTimeout(done, 500000));
}

const benchmarkRunner = new Runner({minExecutionCount : 1})     //set the executionCount to 1
  .suite('parallelBench', suite =>
    suite
      .benchmark('paraGridFsDownload', benchmark =>
        benchmark
          .taskSize(1)
          .setup(loadMulGridFs)
          .setup(makeClient)
          .setup(connectClient)
          .setup(initDb)
          //.setup(dropBucket)
          .setup(initBucket)
          .setup(function() {     //multi-upload grid.fs
                 this.filesId=[];
                 console.log('     begin to upload files');
                 return Promise.map(
                 this.files,
                 (f,i) => {
                    //console.log("number is " + i);
                    if(i & 1) {var loc = "US";} else {var loc = "APAC";}
                    return uploadFile(this.bucket, loc, f)     //"US" for local read,"APAC" for remote read.
                        .then(v => {
                            this.filesId.push(Object.assign({}, v));
                            return {}
                         })
                        .catch(err => {
                           console.dir(err)
                           return err
                        });
                  },
                   { concurrency: 72 }
                  ).then(res => {
                  console.log('     files are uploaded');
                  }).catch(err => {
                  console.dir(err)
                   })
          })
          .setup(timer)     //set the timer to make sure the uploading are completed and replicated to secondary nodes.
          .task(function(done) {      //concurrent query grid.fs
                console.log('     begin to query files');
                return Promise.map(
                 this.filesId,
                 fid => {
                    return downloadFile(this.bucket, fid)
                      .then(v => {
                            const paraRaw = [];
                            paraRaw.push(v);
                            return paraRaw;
                      })
                      .catch(err => {
                           console.dir(err)
                           return err
                      });
                  },
                  {concurrency: 36}     //set up the concurrent user number
                  ).then(paraRaw => {
                    console.log("     files are queried");
                    const paraSum = paraRaw.reduce((x, y) => Number(x) + Number(y), 0);
                    console.log("     ---Total query time---" + paraSum);
                    const paraAverage = paraSum/paraRaw.length;
                    console.log("     ---Total queried files---" + paraRaw.length);
                    console.log("     ---paraAverage---" + paraAverage);
                    return done();
                  }).catch(err => {
                    console.dir(err)
                  })
          })
          //.teardown(dropDb)
          .teardown(disconnectClient)
      )
  );

benchmarkRunner
  .run()
  .then((data) => console.log("Concurrent Quries are completed"))
  .catch(err => console.error(err));
