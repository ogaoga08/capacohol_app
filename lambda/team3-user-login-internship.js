const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
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

  const body = event.body ? JSON.parse(event.body) : null;
  if (!body || !body.userId || !body.password || !body.affilicationId) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message:
        "無効なリクエストです。request bodyに必須パラメータがセットされていません。",
    });

    return response;
  }

  const param = {
    TableName,
    //キー、インデックスによる検索の定義
    KeyConditionExpression: "userId = :uid",
    //プライマリーキー以外の属性でのフィルタ
    FilterExpression: "password = :pkey",
    //検索値のプレースホルダの定義
    ExpressionAttributeValues: marshall({
      ":uid": body.userId,
      ":pkey": sha256(body.password),
    }),
  };

  const command = new QueryCommand(param);
  try {
    const foundCount = (await client.send(command)).Count;
    if (foundCount == 0) {
      throw new Error("userIdまたはpasswordが一致しません");
    }
    response.body = JSON.stringify({ token: "mtiToken" });
  } catch (e) {
    if (e.message == "userIdまたはpasswordが一致しません") {
      response.statusCode = 401;
      response.body = JSON.stringify({ message: e.message });
    } else {
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "予期せぬエラーが発生しました。",
        errorDetail: e.toString(),
      });
    }
  }

  return response;
};
