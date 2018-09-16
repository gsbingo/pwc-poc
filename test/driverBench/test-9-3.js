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

function uploadFile(bucket, path) {
    
    return new Promise((resolve, reject) => {

        const gridStream = bucket.openUploadStream(path.slice(2));

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

        console.log("download is stringify " + JSON.stringify(path));

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

function average(arr) {
  return arr.reduce((x, y) => x + y, 0) / arr.length;
}

function loadGridFs() {
  this.bin = loadSpecFile(['single_and_multi_document', 'gridfs_50m.bin']);
  //console.log("%%%%%%%%single bin");
  //console.log(this.bin);
}

function gridFsInitUploadStream() { //location "US" for local upload, "APAC" for remote upload
  this.stream = this.bucket.openUploadStreamWithId({location: "APAC", fileId: new objectId()},'gridfstest');
}

function writeSingleByteToUploadStream() {
  return new Promise((resolve, reject) => {
    this.stream.write('\0', null, err => (err ? reject(err) : resolve()));
  });
}

const benchmarkRunner = new Runner({minExecutionCount : 100})
  .suite('multiBench', suite =>
    suite
      .benchmark('gridFsUpload', benchmark =>
        benchmark
          .taskSize(1)
          .setup(loadGridFs)
          .setup(makeClient)
          .setup(connectClient)
          .setup(initDb)
          //.beforeTask(dropBucket)
          .beforeTask(initBucket)
          .beforeTask(gridFsInitUploadStream)
          .beforeTask(writeSingleByteToUploadStream)
          .task(function(done) {
            this.stream.on('error', done).end(this.bin, null, () => done());
          })
          //.teardown(dropDb)
          .teardown(disconnectClient)
      )
  );

benchmarkRunner
  .run()
  .then(microBench => {
    
    const multiBench = average(Object.values(microBench.multiBench));

    return {
      multiBench
    };
  })
  .then(data => console.log(data))
  .catch(err => console.error(err));
