const app = require("./server") ;
// import { APIGatewayProxyHandler } from 'aws-lambda';
const serverlessExpress = require( '@vendia/serverless-express');
const serverlessHandler = serverlessExpress({ app });
module.exports.handler = serverlessHandler;