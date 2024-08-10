const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team3_User";

exports.handler = async (event, context) => {
  //レスポンスの雛形
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
      message: "認証されていません．headersにtokenを指定してください",
    });
    
    return response;
  }
  
  const userId = event.queryStringParameters?.userId; //見たいユーザのuserId
  const affilicationId = event.queryStringParameters?.affilicationId; //見たいユーザのuserId
  if(!userId){
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: "無効なリクエストです．クエリストリングに必須パラメータをセットして下さい．",
    });
    
    return response;
  }

  //TODO: 取得対象のテーブル名と検索に使うキーをparamに宣言
  const param = {
    TableName,
    Key: marshall({
      userId,
      affilicationId,
    }),
  };

  const command = new GetItemCommand(param);

  //GetItemCommandの実行でDBからデータを取得
  try {
    const user = (await client.send(command)).Item;
    if(!user){
      throw new Error("指定のuserは見つかりませんでした．");
    }
    delete user?.password;
    response.body = JSON.stringify(unmarshall(user));
    
  } catch (e) {
    if(e.message == "指定のuserは見つかりませんでした．"){
      response.statusCode = 404;
      response.body = JSON.stringify({ message: e.message });
    } else{
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "予期せぬエラーが発生しました。",
        errorDetail: e.toString(),
      });
    }
  }

  return response;
};
