// used by queueLoad in processing

function getStoplistUpload(callback) {
    if (stoplistFileArray.length === 0) {
        d3.text(stopwordsURL, callback);
      } else {
        var fileSelection = stoplistFileArray[0];
        var reader = new FileReader();
        reader.onload = function() {
          var text = reader.result;
          callback(null, text);
        };
        reader.readAsText(fileSelection);
      }
  }