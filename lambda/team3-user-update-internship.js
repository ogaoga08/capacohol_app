const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "User";
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
  
  if(event.headers.authorization !== "mtiToken"){
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: "認証されていません．headersにトークンを指定して下さい",
    });
    
    return response;
  };
  
  const body = event.body ? JSON.parse(event.body) : null;
  if(!body || !body.userId || !body.password || !body.age || !body.nickname){
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: "無効なリクエストです．すべての項目に入力してください",
    });
    
    return response;
  }

  // TODO: リクエストボディの中身をJavaScriptオブジェクトに変換し、1つ、あるいは複数の変数に代入する
  const { userId, age, nickname, password } = body;
  // TODO: paramに更新対象のテーブル名と更新内容を記述
  const param = {
    TableName,
    Item:marshall({
      userId,
      age,
      nickname,
      password: sha256(password),
    }),
  };

  const command = new PutItemCommand(param);

  try {
    await client.send(command);
    // TODO: 更新に成功した場合の処理を記述(response bodyを設定する)
    response.body = JSON.stringify({ userId, age, nickname });
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};
