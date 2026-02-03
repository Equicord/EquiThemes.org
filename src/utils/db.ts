import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

declare global {
    // eslint-disable-next-line no-unused-vars
    var _mongoClientPromise: Promise<MongoClient>;
}

class Singleton {
    private static _instance: Singleton;
    private client: MongoClient;
    private clientPromise: Promise<MongoClient>;
    private constructor() {
        if (uri) {
            this.client = new MongoClient(uri, options);
            this.clientPromise = this.client.connect();
            if (process.env.NODE_ENV === "development") {
                global._mongoClientPromise = this.clientPromise;
            }
        } else {
            this.clientPromise = Promise.resolve({} as MongoClient);
        }
    }

    public static get instance() {
        if (!this._instance) {
            this._instance = new Singleton();
        }
        return this._instance.clientPromise;
    }
}
const clientPromise = Singleton.instance;

export default clientPromise;
