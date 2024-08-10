const {
  DynamoDBClient,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team3_alcohol-record";


exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

// console.log("Received headers:", event.headers); // デバッグ用のログ
// console.log("Received queryStringParameters:", event.queryStringParameters); // デバッグ用のログ

  console.log("Received event:", JSON.stringify(event, null, 2)); // イベント全体をログに出力

  if(event.headers.authorization !== "mtiToken"){
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: "認証されていません。HeaderにTokenを指定してください",
    });
    
    return response;
  }
  
  const userId = event.queryStringParameters?.userId;
  const timestamp = parseInt(event.queryStringParameters?.timestamp);
  if(!userId || !timestamp){
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:"無効なリクエストです。request bodyに必須パラメータがセットされていません。",
    });
    
    return response;
  }
  
  const param = {
    TableName,
    Key: marshall({
      userId,
      timestamp,
    }),
  };

  const command = new DeleteItemCommand(param);

  try {
    await client.send(command);
    response.statusCode = 204;
     response.body = JSON.stringify({
      // message:"204 No Content",
     });
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};