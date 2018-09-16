'use strict';

const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const GridFsBucket = require('mongodb').GridFSBucket;

const DB_NAME = 'pwc';

const SPEC_DIRECTORY = path.resolve(__dirname, 'spec');

function loadSpecFile(filePath, encoding) {
  const fp = [SPEC_DIRECTORY].concat(filePath);
  return fs.readFileSync(path.join.apply(path, fp), encoding);
}

function loadSpecString(filePath) {
  return loadSpecFile(filePath, 'utf8');
}

function makeClient() {
  this.client = new MongoClient('mongodb://pwcuser:password@localhost:40000/?readPreference=nearest');
}

function connectClient() {
  return this.client.connect();
}

function disconnectClient() {
  this.client.close();
}

function initDb() {
  this.db = this.client.db(DB_NAME);
}

function dropDb() {
  return this.db.dropDatabase();
}

function createCollection() {
  return this.db.createCollection(COLLECTION_NAME);
}

function initCollection() {
  this.collection = this.db.collection(COLLECTION_NAME);
}

function dropCollection() {
  return this.collection.drop();
}

function initBucket() {
  this.bucket = new GridFsBucket(this.db);
}

function dropBucket() {
  return this.bucket && this.bucket.drop();
}

function makeLoadJSON(name) {
  return function() {
    this.doc = JSON.parse(loadSpecString(['single_and_multi_document', name]));
  };
}

module.exports = {
  makeClient,
  connectClient,
  disconnectClient,
  initDb,
  dropDb,
  createCollection,
  initCollection,
  dropCollection,
  makeLoadJSON,
  loadSpecFile,
  loadSpecString,
  initBucket,
  dropBucket
};
