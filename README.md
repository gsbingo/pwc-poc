ReadMe.md

1. Prepare MongoDB cluster for testing.

Create the MongoDB cluster with 2 shards.

mlaunch init --sharded 2 --config 3 --mongos 1 --nodes 3 --replicaset --port 40000 --auth --username pwcuser --password password

2. Test case 9.1

test-9-1.js

3. Test case 9.2

test-9-2.js

4. Test case 9.3

test/driverBench/test-9-3.js

5. Test case 9.4

test/driverBench/test-9-4.js

6. Test case 9.5

generate workload with test-9-3.js, and monitor the replication lag with MongoDB Ops Manager