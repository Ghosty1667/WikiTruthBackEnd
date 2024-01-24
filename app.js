const express  = require('express');

const swaggerUI = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

require('dotenv').config();

var cors = require('cors')

const naturalRouter = require('./routes/natural');
const wikipediaRouter = require('./routes/wikipedia')
const wikipediatestRouter = require('./routes/wikipediatest');
const credTestRouter = require('./routes/credTest');

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Natural API',
            version: "1.0.0",
        }
    },
    apis:['./routes/*.js','app.js'],      
}

const swaggerDocs = swaggerJSDoc(swaggerOptions)





const app = express();
const hostname = '127.0.0.1';
const port = process.env.PORT || 8080;

var allowedOrigins = process.env.FRONT_END_SOURCE;

let corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }

}

app.use(cors(corsOptions))
// app.use(cors())


app.use('/natural', naturalRouter);
app.use('/wikipediatest', wikipediatestRouter);
app.use('/wikipedia', wikipediaRouter);
app.use('/credtest', credTestRouter);
app.use('/api-docs', swaggerUI.serve,swaggerUI.setup(swaggerDocs));

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});

