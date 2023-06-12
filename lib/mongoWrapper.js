const Mongo = require("mongodb");

const make_usable_object = (client, dbname) => {
    return {
        is_connected: () => client.isConnected(),
        objectid: (id) =>
            Mongo.ObjectID.isValid(id) ? Mongo.ObjectID(id) : null,
        is_valid_objectid: (id) => Mongo.ObjectID.isValid(id),
        create: (collection, data, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .insertMany(
                Array.isArray(data) ?
                data.map((k) => ({
                    createdAt: new Date(),
                    ...k,
                })) : [{
                    createdAt: new Date(),
                    ...data,
                }, ], {
                    ...options,
                }
            ),
        read: (
                collection,
                query = {},
                limit = 1,
                offset = 0,
                projection = {},
                sorting = {
                    _id: -1
                }
            ) =>
            client
            .db(dbname)
            .collection(collection)
            .find(query)
            .project(projection)
            .sort(sorting)
            .skip(offset)
            .limit(limit === "all" ? 0 : parseInt(limit, 10) || 1)
            .toArray(),
        update: (collection, query = {}, change = {}, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .updateMany(
                query,
                Object.keys(change).find((i) => i.indexOf("$") !== -1) ? {
                    ...change
                } : {
                    $set: {
                        ...change
                    },
                }, {
                    ...options
                }
            ),
        delete: (collection, query = {}, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .deleteMany(query, {
                ...options
            }),
        count: (collection, query = {}, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .find(query)
            .count({
                ...options
            }),
        aggregate: (collection, pipeline = [], options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .aggregate(pipeline, {
                allowDiskUse: true,
                ...options
            })
            .toArray(),
        drop_collection: (collection, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .drop({
                ...options
            }),
        distinct: (collection, key, query = {}, options = {}) =>
            client
            .db(dbname)
            .collection(collection)
            .distinct(key, query, {
                ...options
            }),
        close: (force = false) => client.close(force),
    };
};
module.exports = (dbUrl, dbname, options = {}) =>
    new Promise((resolve, reject) => {
        Mongo.MongoClient.connect(dbUrl, {
                useUnifiedTopology: true,
                // ...options,
                // poolSize: 5,
            })
            .then((client) =>
                resolve({
                    ...make_usable_object(client, dbname),
                    dbInstance: client.db(dbname),
                    db: (dbName) => make_usable_object(client, dbName),
                    clientInstance: client,
                })
            )
            .catch((e) => reject(e));
    });