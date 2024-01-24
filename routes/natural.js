const express = require('express');
const router = express.Router();
var natural = require('natural');
var classifier = new natural.BayesClassifier();

// load classifier and classify a string
natural.BayesClassifier.load('./classifier.json', null, function (err, lClassifer) {
    classifier = lClassifer;
    classifier.train();
});

/**
 * @swagger
 * /natural/postivity/sentence/{sentence}:
 *  get:
 *      description: Get new tense
 *      parameters:
 *        - name : sentence
 *          description: verb to change
 *          in: path
 *          required: true
 *          type: string
 *          
 *      responses:
 *          200:
 *              description: Success
 * 
 */
router.get("/postivity/sentence/:sentence", async function (req, res) {
    var corpus = req.params.sentence;

    var tokenizer = new natural.WordTokenizer();
    var corpus = tokenizer.tokenize(req.params.sentence);
    var Analyzer = require('natural').SentimentAnalyzer;
    var stemmer = require('natural').PorterStemmer;
    var analyzer = new Analyzer("English", stemmer, "afinn");
    console.log(analyzer.getSentiment(corpus))
    // getSentiment expects an array of strings
    console.log();

    return res.json({ Prompt: corpus, Plural: analyzer.getSentiment(corpus) });


});

/**
 * @swagger
 * /natural/classifier/sentence/{sentence}:
 *  get:
 *      description: Get new tense
 *      parameters:
 *        - name : sentence
 *          description: verb to change
 *          in: path
 *          required: true
 *          type: string
 *          
 *      responses:
 *          200:
 *              description: Success
 * 
 */
router.get("/classifier/sentence/:sentence", async function (req, res) {
    var corpus = req.params.sentence;
    var tokenizer = new natural.WordTokenizer();
    return res.json({ classifier: classifier.getClassifications(corpus) });


});




module.exports = router;
