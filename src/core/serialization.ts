import {LDAModel} from "./LDAModel";
import {createZip} from "./compression";
import {displayMessage} from "./message";
import {getQueryVariable} from "../funcs/utilityFunctions";


function exportToMallet(model: LDAModel): string {
    let serialized = "#doc source pos typeindex type topic\n#alpha : "
    for (let n of model._documentTopicSmoothing) {
        serialized += `${n} `
    }
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
    let id = getQueryVariable("id");
    if (id===undefined){
        await displayMessage("Logging failed: missing ID", 1500, "promise")
        throw Error("No ID")
    }

    await displayMessage("Generating stoplist", 0, "promise")

    let stops: string = "";
    for (let key in model.stopwords) {
        stops += key + "\n"
    }
    files["stopwords.txt"] = stops

    await displayMessage("Serializing model", 0, "promise")
    files["model.txt"] = exportToMallet(model)

    await displayMessage("Compressing model", 0, "promise")
    let zip = await createZip(files)

    await displayMessage("Uploading model", 0, "promise")

    let form=new FormData()

    form.append("id",id)
    form.append("model.zip",zip)

    await fetch("http://134.173.42.100:9191/upload",{
        method:"PUT",
        body:form
    })
}


