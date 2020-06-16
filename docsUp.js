// Used by queueLoad in processing

function getDocsUpload(callback) {
    if (documentsFileArray.length === 0) {
        d3.text(documentsURL, callback);
    } else {
        var fileSelection = documentsFileArray[0];
        var reader = new FileReader();
        reader.onload = function() {
          var text = reader.result;
          callback(null, text);
        };
        reader.readAsText(fileSelection);
    }
  }