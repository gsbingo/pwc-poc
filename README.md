ReadMe.md

1. Create the MongoDB cluster with 2 shards.

mlaunch init --sharded 2 --config 3 --mongos 1 --nodes 3 --replicaset --port 40000 --auth --username pwcuser --password password