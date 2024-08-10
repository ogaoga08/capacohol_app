const {
  DynamoDBClient,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "User";


exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };


  if(event.headers.authorization !== "mtiToken"){
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: "認証されていません。HeaderにTokenを指定してください",
    });
    
    return response;
  }
  
  const userId = event.queryStringParameters?.userId;
  if(!userId){
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
    }),
  };

  const command = new DeleteItemCommand(param);

  try {
    await client.send(command);
    response.statusCode = 204;
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};