import {LDAModel} from "./LDAModel";
import {getFromStorage} from "./storage";
import {createZip} from "./compression";
import {displayMessage} from "./message";

const FileSaver = require("filesaver.js-npm")

function readMallet(serializedModel: string) {
    let s = serializedModel.slice(serializedModel.indexOf("\n") + 1)
    s.split('\n').forEach((s, i) => {
        if (i == 0) {
            for (let n of s.slice(s.indexOf(": ") + 1).split(" ")) {
                console.log(parseFloat(n))
            }
        }
    })
}

function exportToMallet(model: LDAModel): string {
    let serialized = "#doc source pos typeindex type topic\n#alpha : "
    for (let n of model._documentTopicSmoothing) {
        serialized += `${n} `
    }
    console.log(model._documentTopicSmoothing)
    serialized += `\n#beta : ${model._topicWordSmoothing}\n`
    let typeIndicies: { [key: string]: number } = {}
    let nextType: number = 0;
    for (let documentIndex in model.documents) {
        let doc = model.documents[documentIndex]
        let docPos = 0;
        for (let tokenIndex in doc.tokens) {
            let token = doc.tokens[tokenIndex]
            if (token.isStopword) continue
            if (!typeIndicies.hasOwnProperty(token.word)){
                typeIndicies[token.word]=nextType++;
            }
            serialized += `${documentIndex} NA ${docPos++} ${typeIndicies[token.word]} ${token.word} ${token.topic}\n`
        }
    }

    return serialized
}


export async function saveModel(model: LDAModel) {


    let files: { [key: string]: string } = {}

    await displayMessage("Loading original document", 0, "promise")
    let document = (await getFromStorage("document"))!
    let filename: string;
    switch (document.contentType) {
        case "text/csv":
            filename = "document.csv"
            break
        case "text/tsv":
            filename = "document.tsv"
            break
        default:
            throw Error("incorrect content-type encountered during decompression")
    }

    files[filename] = document.data

    await displayMessage("Generating stoplist", 0, "promise")

    let stops: string = "";
    for (let key in model.stopwords) {
        stops += key + "\n"
    }
    files["stopwords.txt"] = stops

    await displayMessage("Serializing model", 0, "promise")
    files["model.txt"] = exportToMallet(model)

    await displayMessage("Compressing", 0, "promise")
    let zip = await createZip(files)

    await displayMessage("Initiating browser download", 1500, "promise")
    FileSaver.saveAs(zip, "LDAModel.zip")
}
