import {LDAModel} from "./LDAModel";
import {getFromStorage} from "./storage";
import {createZip} from "./compression";
import {displayMessage} from "./message";

const FileSaver = require("filesaver.js-npm")

const testString = `#doc source pos typeindex type topic
#alpha : 0.15649079156991014 0.06887579016155862 0.1855743979671839 0.19340526269604397 0.1778038889715676 0.039678540800321 0.10123579835908122 0.0518365547569033 0.05323361206105949 0.023974965701155312 0.16834872782407512 0.019771220957474488 0.02174696115013276 0.15026734378684603 0.04351233224529447 0.0378662714627269 0.07334423224446168 0.01399607061091689 0.19496104719957222 0.06727591832075384 0.06208767479480345 0.08024928810497696 0.12966226844579593 0.9097790767004938 0.0544908793950503 0.250176925906939 0.45385526039868174 0.02647894333795857 0.171966914036673 0.04172931073835679 0.49408361570366216 0.030357712455979027 0.013207749213176492 0.02512277961622844 0.036321230986584935 0.017714506415210784 0.03216549415145754 0.14011908244908255 0.05326600654578091 0.02405308688078503 0.8230128443657644 0.06739508632215263 0.2016685370980895 0.14569272937964717 0.027157750590292497 0.29339531106013084 0.28142457541544574 0.280614580816259 0.22566876112358572 0.06135366078575892 
#beta : 0.009489391213368165
0 NA 0 0 dies 47
0 NA 1 1 sein 26
0 NA 2 2 der 47
0 NA 3 3 wort 3
0 NA 4 4 in 28
0 NA 5 2 der 34
0 NA 6 5 brief 25
0 NA 7 6 punct 42
0 NA 8 2 der 42
0 NA 9 2 der 42
0 NA 10 7 prophet 34
0 NA 11 8 jeremia 34
0 NA 12 9 senden 25
0 NA 13 10 von 45
0 NA 14 11 jerusalem 34
0 NA 15 12 an 47
0 NA 16 2 der 28
0 NA 17 13 übrig 34
0 NA 18 14 älteste 45
0 NA 19 6 punct 23
0 NA 20 2 der 23
0 NA 21 15 wegführen 34`

// doc index, throw, index into token, recompute, token, recompute topicwordcount ++

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
    for (let documentIndex in model.documents) {
        let doc = model.documents[documentIndex]
        for (let tokenIndex in doc.tokens) {
            let token = doc.tokens[tokenIndex]
            if (token.isStopword) continue
            serialized += `${documentIndex} NA ${tokenIndex} ${model.tokenTypes[token.word]} ${token.word} ${token.topic}\n`
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
