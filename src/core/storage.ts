/*
Mia Celeste, June 2021

This module handles storing arbitrarily large data into the browser's storage.
Per Origin Eviction policy
(https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria),
the maximum amount of data the browser can store for this project is 10% of the
free-disk space, up to 2GB, which should be more than enough in most cases.

While all data interfaces referred to within this project are called storage,
the data actually go into IndexedDB. This is because LocalStorage cannot handle
binary data, but calling the object database would be too confusing for anyone
who doesn't care about implementation details as the only purpose of it is to
store some binary (deflated text) data.
 */

import Dexie from 'dexie'
import {compress, decompress} from './compression'
import {displayMessage} from "./message";

interface LDAModelData {
    key: string,
    content: Uint8Array,
    contentType: string
}

// This is necessary for typescript type inferences
// see https://dexie.org/docs/Typescript

class LDAModelStorage extends Dexie {

    data: Dexie.Table<LDAModelData, string>

    constructor() {
        super("LDAModelStorage");
        this.version(1).stores(
            {
                data: "key"
            }
        )
        this.data = this.table("data")
    }
}

const db = new LDAModelStorage();

/*
Saves the given data to the browser storage, associated with a given key. The
key can be any arbitrary string, which is needed to retrieve the data from the
storage later. If the data is a string, it is saved to the storage as-is. If it
is an object, it will be passed into JSON.stringify() first, which implies that
not all objects can be perfectly reconstructed from the storage, so some caution
is required before passing arbitrary objects into this function.
 */
export async function saveToStorage(key: string, data: string | object, contentType: string = "text/plain"): Promise<void> {
    let compressed = await compress(data);
    await db.data.put({
        key,
        contentType,
        content: compressed
    })
}

/*
Retrieve the data associated with the given key from the browser storage. If
no data is associated with the given key, null is returned.
 */
export async function getFromStorage(key: string): Promise<{ data: string, contentType: string } | null> {
    let compressed = await db.data.get(key)
    if (compressed === undefined) {
        return null
    }
    return {
        data: await decompress(compressed.content),
        contentType: compressed.contentType
    }

}
