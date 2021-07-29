import jsZip from 'jszip'

/*
Compress the data using deflate. Returns an UInt8Array that can be decompressed
to get the data back. Since UInt8Array is supported on IE10+,
(https://caniuse.com/mdn-javascript_builtins_uint8array) no browser compatibility
check is performed. If an object is given, it will first be stringified
 */
export async function compress(data: string | object): Promise<Uint8Array> {
    let toCompress: string = typeof data === "object" ? JSON.stringify(data) : data
    let zip = new jsZip();

    zip.file('data', toCompress, {
        comment: typeof data
    })

    return await zip.generateAsync({
        compression: 'DEFLATE',
        type: 'uint8array',
        compressionOptions: {
            level: 6
        }
    })
}

/*
The reverse operation of compress
 */
export async function decompress(data: Uint8Array): Promise<string> {
    let zip = new jsZip();
    await zip.loadAsync(data)
    let file = zip.file('data')
    if (file === null) {
        throw Error("Error during decompressing data")
    }
    let content = await file.async('string')
    switch (file.comment) {
        case "string":
            return content
        case "object":
            return JSON.parse(content)
        default:
            throw Error("Unable to decode file type")
    }
}

export async function createZip(files: { [key: string]: string }): Promise<Blob> {
    let zip = new jsZip();
    let dir = zip.folder("LDAModel")
    if (dir === null) {
        throw Error("Error creating zip")
    }
    for (let name in files) {
        dir.file(name, files[name])
    }
    return await zip.generateAsync({
        compression: "DEFLATE",
        type: "blob",
        compressionOptions: {
            level: 6
        }
    })
}

export async function readZip(file: Blob) {
    let zip = await jsZip.loadAsync(file, {createFolders: true});
    let dir = zip.folder("LDAModel")
    if (!dir) {
        throw Error("Cannot find LDAModel folder in the zip file")
    }
    let files: { [key: string]: string | undefined } = {}
    for (let path in dir.files) {
        path = path.substring(9)
        if (path === "") continue
        files[path] = await dir.file(path)!.async("string")
    }
    return files
}
