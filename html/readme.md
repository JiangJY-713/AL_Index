# Indexing Anne Lister's Journal
As some [#AnneListerCodeBreakers](https://wyascatablogue.wordpress.com/exhibitions/anne-lister/anne-lister-diary-transcription-project/) might have noticed (well, at least myself), judging from the pages sent by WYAS recently,  we are wrapping up the first stage of transcribing. It is hard to predict how long the remaining checking would take, but if with the same speed as last year, could be years.   
  
Meanwhile, about 85% of the entries have already been posted at various platforms, and a [Transcription Blog List](https://www.packedwithpotential.org/resources/anne-lister-diary-transcripts) has been created by [PackedwithPotential](https://www.packedwithpotential.org/home). Yet still, there is inconvenience: the batches each transcriber received are well scattered, with one glance one can hardly know if a specific entry has been posted, or generally which period has been mostly available.  
  
Based on [js year calendar](https://github.com/year-calendar/js-year-calendar) created by Paul David-Sivelle, I compiled the transcripts links in a calendar, which is at present the best form I can think of. Also its potential won't be limited to this. For example, as much as we love spreadsheets, indicating the multiple mentions of a book/person/place etc. in the journal is still a problem. I feel it would be possible for this to interact with PwP trackers, so as to increase readability and avoid repetitive work without sacrificing the easiness of editing.


## Visit the page
- Available transcripts and their original pages can be found [here](https://jiangjy-713.github.io/AL_Index/index.html). A transcription is included only if it is fully transcribed and publicly accessible.   

## Full text search

The search feature is case insensitive. 

### Search with SQLite FTS5 extension
- The page uses [sql.js](https://github.com/sql-js/sql.js) to run an SQLite database (`data/journal.db`) with [FTS5 extension](https://www.sqlite.org/fts5.html) to support keyword search.  
- The tokenizer used is [Porter Tokenizer](https://www.sqlite.org/fts5.html#Porter_Tokenizer), allowing search terms like "correction" to match similar words such as "corrected" or "correcting".  
- The fts5 full-text query syntax allows you to carry out more advanced searches, such as phrase queries, prefix queries, using boolean operators (`NOT`/`AND`/`OR`) etc. The detailed explanation of the syntax [can be read here](https://www.sqlite.org/fts5.html#full_text_query_syntax). 
  
### Pattern matching
Apart from the default full text search with `MATCH` operator, pattern matching with `LIKE` operator is also supported. You can choose this mode in the search box. It is slower than fts MATCH.  
SQLite provides two wildcards for constructing patterns: percent sign (`%`) and underscore (`_`). The percent sign (`%`) wildcard matches any sequence of zero or more characters, and the underscore (`_`) wildcard matches any single character. Below are some examples of pattern constructing:  
| Pattern | Uses |
| ---- | ---- |
| XYZ% | Fetch entries that start with XYZ |
| %XYZ% | Fetch entries that have XYZ in any position |
| \_XY% | Fetch entries that have XY in the second and third positions |
| %X | Fetch entries that end with X |
| %X_YZ% | Fetch entries that have strings where there is a single character between X and YZ |
| %X%YZ% | Fetch entries that have X before YZ |


### Result presentation
The results will be highlighted in the calendar. Click the date and in the search box its abstracts will be scrolled to the top. The page also provides a heat map for results in each year, and by clicking on the squares the calendar and the abstracts will be set to that year. If the total number of results < 300, all the abstracted will be printed out.
  
### Notes
- The format of the journal (e.g. transition between plainhand and crypthand, the underlied, the strike-through & the sketches), and the distinctions between transcriber's annotations and the actual entry are not reflected in the abstracts, so it is recommended to read the original post for such info, as well as the context of the day. Btw, transcripts on WYAS pages also don't preserve format info (tho' the PDF version does), which I hoped can be improved in the future. 
- It is well possible that some entries might be missed due to Anne's spelling, or the transcriber didn't complete abbreviated names. E.g., for Mariana Lawton, better try "M"/"π"/"Pi" as well, and also use full-text query syntax to refine your results. I think tagging the entries (by name, place, topic etc.) would be the next well desired feature, but I haven't thought through this.  
- Context is everything.

## General notes
- Links to newly posted transcriptions are updated regularly (lag < 5 days). For update history, click `update log` on the page.
- Anne sometimes made mistakes in recording dates, e.g., 1840 is a bit of wibbly wobbly. In this case, I assign the entries to their real dates, rather than how she wrote them. 
- Where there are repetitive transcripts, I would recommend having a quick look at each of them. Sometimes there would be useful infomation collected by our fantastic transcribers .
- Currently the data (`data/data.json`) will be maintained by myself, probably until I figured out server-side programming. Though I have programming experience with MATLAB, I only started to learn web development not so long ago, for this purpose, obviously. 
- But most likely, I can't implement all my ideas alone. I have included the source code on the above for anyone interested. I am also eager to hear your thoughts! You can contact me via Github ,[Twitter](https://twitter.com/water_in_forest), or [this form](https://forms.gle/Ab1GXBibJraTtMzZ7). And if you find any error or invalid links, do please get in touch.

## To-do List
- [x] Register WYAS reference
- [x] Display days that have blank pages/travel notes/Anne's index 
- [x] Transcipts 
    - [x] Register online journal transcripts
    - [x] Register online travel notes transcripts
    - [x] Display percentage of online transcripts for each year
- [ ] Journal volume/travel notes structure guide. 
- [ ] Make collaborative contribution to the data possible
- [ ] Indexing 
    - [ ] Interaction with PwP trackers and proper visualization
    - [ ] D[itt]o with Google Map and d[itt]o?
    - [x] Keyword search
    - [ ] Tagging system
- [ ] I wonder how WYAS would carry out annotating? 
