const express = require('express');
const router = express.Router();
const axios = require('axios');
const redis = require('redis');

var natural = require('natural');
var classifier = new natural.BayesClassifier();

natural.BayesClassifier.load('./classifier.json', null, function (err, lClassifer) {
    classifier = lClassifer;
    classifier.train();
});

// Redis setup

const redisClient = redis.createClient();
(async () => {
    try {
      await  redisClient.connect();  
    } catch (err) {
      console.log(err);
    }
})();

/**
 * @swagger
 * /wikipedia/query/{subject}:
 *  get:
 *      description: Get data from wikipedia TEST
 *      parameters:
 *        - name : subject
 *          description: wikipedia subject
 *          in: path
 *          required: true
 *          type: string
 *          
 *      responses:
 *          200:
 *              description: Success
 *          404:
 *              description: Failure
 * 
 */
router.get("/query/:query", async function (req,res) {
    const query = req.params.query.trim();
    const otherUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
    const redisKey = `wikipedia: ${query}`

    const result = await redisClient.get(redisKey);

    if (result) {
      // Serve from redis
      const resultJSON = JSON.parse(result);
      res.status(200)
      return res.json(resultJSON);
  
    } else {

        try {

            const response = await axios.get(otherUrl);
            console.log("Searching for: " + query)
            const responseJSON = response.data.extract;
            console.log(responseJSON);

            redisClient.setEx(
                redisKey,
                3600,
                JSON.stringify(
                    {
                        Summary: responseJSON,
                        Source: "Cache"
                    }
                )
            );
            
            res.status(200)
            return res.json(
                {
                    Summary: responseJSON, 
                    Source: "Wikipedia"
                }
            )
        }
        catch {
            console.log("'" + query + "' not found")
            res.status(404);
            return res.json({err: "article not found"})
        }
    }
});

/**
 * @swagger
 * /wikipedia/wikipositivity/{query}:
 *  get:
 *      description: Get positivity of a wikipedia summary
 *      parameters:
 *        - name : query
 *          description: name of wikipedia article
 *          in: path
 *          required: true
 *          type: string
 *          
 *      responses:
 *          200:
 *              description: Success
 *          404:
 *              description: Failure
 * 
 */
router.get("/wikipositivity/:query", async function (req, res) {

    const query = req.params.query.trim();
    const otherUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
    const redisKey = `wikipedia: ${query}`

    const result = await redisClient.get(redisKey);

    //If the article is found in Redis, return based on summary stored in Redis
    if (result) {
        // Serve from redis
        const resultJSON = JSON.parse(result);

        var corpus = resultJSON.Summary;

        var tokenizer = new natural.WordTokenizer();
        var corpus = tokenizer.tokenize(corpus);
        var Analyzer = require('natural').SentimentAnalyzer;
        var stemmer = require('natural').PorterStemmer;
        var analyzer = new Analyzer("English", stemmer, "afinn");
        res.status(200)
        return res.json(
          {
              Summary: resultJSON.Summary,
              PositivityValue: analyzer.getSentiment(corpus),
              Source: resultJSON.Source
          }
        );
    
    } else {

        try {
            const response = await axios.get(otherUrl);
            console.log("Searching for: " + query)
            const responseJSON = response.data.extract;

            console.log(responseJSON)

            redisClient.setEx(
                redisKey,
                3600,
                JSON.stringify(
                    {
                        Summary: responseJSON,
                        Source: "Cache"
                    }
                )
            );

            var corpus = responseJSON;

            var tokenizer = new natural.WordTokenizer();
            var corpus = tokenizer.tokenize(responseJSON);
            var Analyzer = require('natural').SentimentAnalyzer;
            var stemmer = require('natural').PorterStemmer;
            var analyzer = new Analyzer("English", stemmer, "afinn");
            console.log(analyzer.getSentiment(corpus))
            // getSentiment expects an array of strings
            console.log();

            res.status(200)
            return res.json(
                { 
                    Summary: responseJSON, 
                    PositivityValue: analyzer.getSentiment(corpus),
                    Source: "Wikipedia"
                }
            );
        }
        catch {
            console.log("'" + query + "' not found")
            res.status(404);
            return res.json({err: "article not found"})
        }
    }
    
    


});

/**
 * @swagger
 * /wikipedia/wikitense/{subject}:
 *  get:
 *      description: Get tense from wikipedia TEST
 *      parameters:
 *        - name : subject
 *          description: wikipedia subject
 *          in: path
 *          required: true
 *          type: string
 *          
 *      responses:
 *          200:
 *              description: Success
 *          404:
 *              description: Failure
 * 
 */
router.get("/wikitense/:query", async function (req,res) {
    const query = req.params.query.trim();
    const otherUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
    const redisKey = `wikipedia: ${query}`

    const result = await redisClient.get(redisKey);

    //If the article is found in Redis, return based on summary stored in Redis
    if (result) {
      // Serve from redis
      const resultJSON = JSON.parse(result);
      res.status(200)
      return res.json(
        {
            Summary: resultJSON.Summary,
            FictionalityValue: classifier.getClassifications(resultJSON.Summary),
            classfication: classifier.classify(resultJSON.Summary),
            Source: resultJSON.Source
        }
      );
  
    } else {
        try {
            const response = await axios.get(otherUrl);
            console.log("Searching for: " + query)
            const responseJSON = response.data.extract;
            console.log(responseJSON);

            redisClient.setEx(
                redisKey,
                3600,
                JSON.stringify(
                    {
                        Summary: responseJSON,
                        Source: "Cache"
                    }
                )
            );
        
            return res.json(
                {
                    Summary: responseJSON, 
                    FictionalityValue: classifier.getClassifications(responseJSON),
                    classfication: classifier.classify(responseJSON),
                    Source: "Wikipedia"
                });
        }
        catch {
            console.log("'" + query + "' not found")
            res.status(404);
            return res.json({err: "article not found"})
        }
    }
});


/**
 * @swagger
 * /wikipedia/classifier/newEntry/{newEntry}/value/{value}:
 *  get:
 *      description: Get new tense
 *      parameters:
 *        - name : newEntry
 *          description: verb to change
 *          in: path
 *          required: true
 *          type: string
 *        - name : value
 *          description: 0 fiction 1 non-fictional
 *          in: path
 *          type: int
 *          
 *      responses:
 *          200:
 *              description: Success
 * 
 */
router.get("/classifier/newEntry/:newEntry/value/:value", async function (req, res) {
    console.log(req.params.newEntry)
    var corpus = req.params.newEntry;

    var tokenizer = new natural.WordTokenizer();
    var corpus = tokenizer.tokenize(corpus);

    try {
        switch (req.params.value) {
            case "0":
                classifier.addDocument(corpus, "fictional")
                break;
            case "1":
                classifier.addDocument(corpus, "non-fictional")
                break;
            default:
                throw ("Invaild Number");
        }
        console.log("Saved")
        classifier.save('./classifier.json', function (err, classifier) { });
        console.log("Loaded ")
        // load classifier and classify a string
        natural.BayesClassifier.load('./classifier.json', null, function (err, lClassifer) {
            classifier = lClassifer;
            classifier.train();
        });

        console.log("Success")
        res.json({ value: 0 });
    
    } catch (error) {
        console.log("Failed")
        res.json({ value: 1 });
    }

});



module.exports = router;