const express = require('express');
const router = express.Router();

var AWS = require("aws-sdk");
require('dotenv').config();

const bucketName = process.env.bucketname;
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

/**
 * @swagger
 * /credtest/gets3classifier:
 *  get:
 *      description: See if classifier exists
 *          
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Failure
 * 
 */
router.get("/gets3classifier", async function (req,res) {
    const s3Key = `classifier.json`;
    const params = { Bucket: bucketName, Key: s3Key };

    try {

        const s3Result = await s3.getObject(params).promise();
    
        // Serve from S3
        const s3JSON = JSON.parse(s3Result.Body);
        res.status(200);
        res.json(s3JSON);
    
      } catch (err) {
        res.status(400);
        res.json(err)
      }
})

/**
 * @swagger
 * /credtest/cred:
 *  get:
 *      description: See if aws credentials are successful
 *          
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Failure
 * 
 */
router.get("/cred", async function (req,res) {
    AWS.config.getCredentials(function(err) {
      if (err) {
        console.log(err.stack);
        res.status(400);
        return res.json({Credentials: "Failure"});
      // credentials not loaded
      }
      else {
        console.log("Access key:", AWS.config.credentials.accessKeyId);
        console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
        res.status(200)
        return res.json({Credentials: "Success"});
      }
    });
    
})

/**
 * @swagger
 * /credtest/testbucket/:
 *  get:
 *      description: Create bucket for storage test
 *          
 *      responses:
 *          200:
 *              description: Success
 *          400:
 *              description: Failure
 * 
 */
router.get("/testBucket", async function (req,res) {

    try {
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`Created bucket: ${bucketName}`);
        res.status(200)
        return res.json({Status: "Bucket Created"})

      } catch (err) {

        // We will ignore 409 errors which indicate that the bucket already exists
        if (err.statusCode !== 409) {
          console.log(`Error creating bucket: ${err}`);
          res.status(400)
          return res.json({Status: "Error creating bucket"})
        } 
        
        //If bucket already exists
        else {
            console.log(`Bucket already exists`);
            res.status(200)
            return res.json({Status: "Bucket already exists"})
        }
      }
})

module.exports = router;