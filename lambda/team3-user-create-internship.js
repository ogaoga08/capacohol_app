const { DynamoDBClient, PutItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team3_User";
const crypto = require('crypto');

function sha256(message) {
  // SHA-256ハッシュ計算のためのハッシュオブジェクトを初期化する
  const hash = crypto.createHash('sha256');
  // ハッシュに入力データを供給する
  hash.update(message);
  // 16進数の文字列としてハッシュを完成させる
  const hashHex = hash.digest('hex');
  // SHA-256ハッシュの16進数の文字列を返す
  return hashHex;
}

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const body = event.body ? JSON.parse(event.body) : null;
  console.log(body);
  if (!body || !body.userId || !body.affilicationId || !body.password || !body.likeSake || !body.weight) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:
        "無効なリクエストです。request bodyに必須パラメータがセットされていません。",
    });

    return response;
  }

  // { varName }のような形式を分割代入と呼び、右側のオブジェクトの中からvarNameプロパティを変数varNameとして切り出すことができる
  // (https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
  const { userId, affilicationId, password, likeSake, weight } = body;

  // 重複を回避する
  const serchParam = {
    TableName,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: marshall({
      ":uid": userId,
    }),
  };

  // userIdが一致するデータを検索するコマンドを用意
  const serchCommand = new QueryCommand(serchParam);
  
  
  const param = {
    // ↓プロパティ名と変数名が同一の場合は、値の指定を省略できる。
    TableName, // TableName: TableNameと同じ意味
    Item: marshall({
      userId, // userId: userIdと同じ意味
      affilicationId, // 所属コード
      password: sha256(password), // password: ハッシュ化されたpassword
      weight, // 体重
      likeSake, // 好きな酒
    }),
  };

  const command = new PutItemCommand(param);

  try {
    const count = (await client.send(serchCommand)).Count;
    if (count){
      throw new Error("同じuserIdが登録されています．");
    }
    
    await client.send(command);
    response.statusCode = 201;
    response.body = JSON.stringify({
      userId,
      affilicationId,
      weight,
      likeSake,
      token: "mtiToken",
    });
  } catch (e) {
    if (e.message == "同じuserIdが登録されています．"){
        response.statusCode = 409;
        response.body = JSON.stringify({ message: e.message });
    } else {
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "予期せぬエラーが発生しました。",
        errorDetail: e.toString(),
      });
    }
  };
  return response;
};
