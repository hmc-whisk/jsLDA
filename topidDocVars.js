selectedTopic // in processVars (used by toggleTopicDocuments, reorderDocuments)
sortVocabByTopic // in processVars (used by toggleTopicDocuments)
documents // in processVars (used by reorderDocuments)

// used by reorderDocuments
var docSortSmoothing = 10.0;
var sumDocSortSmoothing = docSortSmoothing * numTopics; // (numTopics in processVars)
