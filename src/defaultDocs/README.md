# Default Data Sets
## 1. State of The Union Speeches 
This dataset contains the text from US state of the union addresses ranging from 1914 to 2009. It has 3 rows: id, date-tag, text. The text is a segment of the speech. The id is the year the speech was given followed by a dash and then a number indicating which segment that row contains. The date_tag is simply the year that speech was given. 
## 2. Wikipedia Movie Summaries
This dataset is a version of the one found [here](https://www.kaggle.com/jrobischon/wikipedia-movie-plots) that has been adapted for this project. It has 6 rows: date_tag, id, Origin/Ethnicity, Director, Cast, Genre, Wiki Page, text. The date_tag is the year it was released. The text is the wikipedia plot summary for that movie. Id is the title of the movie. Rows with identical plot descriptions have been dropped from the original dataset. From here, the dataset was cut down to 3000 random movies to speed up analysis of this demo dataset. Release dates of movies in the final dataset range from 1901 to 2017.
## 3. Yelp Reviews
This dataset has been adapted from [Yelp's academic dataset](https://www.yelp.com/dataset). In total there are 12 rows. The data held in each row is as follows:
 - stars: the number of stars left on this review
 - useful: the number of users that marked this review as useful
 - funny: the number of users that marked this review as funny
 - cool: the number of users that marked this review as cool
 - text: the text left in the review
 - date_tag: the year and month the review was left
 - state: the 2 letter code indicating the state the review was left in
 - average business stars: the average star rating given to the subject of the review
 - business review count: the number of reviews given to this business
 - user review count: the number of reviews this user has left
 - average user stars: the average number of stars this reviewer gives
 - ID: the name of the business being reviewed