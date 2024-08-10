const { DynamoDBClient, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "team3_alcohol-record";

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
  
  const userId = event.queryStringParameters?.userId; //userId
  const currentIntoxicationLevel = event.queryStringParameters?.currentIntoxicationLevel; //酔い度指定
  const percentageOfAlcohol = 7 //アルコール度数
  const Quantity = 500　// 酒の量

  // 指定された酔い度（currentIntoxicationLevel）を検索キーに指定して検索，型に注意！！！！！！！！！！！！！！！！！！！！
  const param = {
    TableName,
    KeyConditionExpression: "userId = :uid",
    FilterExpression: "currentIntoxicationLevel = :level",
    ExpressionAttributeValues: {
      ":uid": { S: userId},
      ":level": { N: currentIntoxicationLevel },
    },
  };
  const command = new QueryCommand(param);

  try {
    //DBからデータを取得
    const data = (await client.send(command))?.Items;
    if (data.length === 0) {
      throw new Error("データが見つかりませんでした。");
    }
    
    // json形式に変換
    const unmarshallUsersItems = data.map((item) => unmarshall(item));
    // 日数カウント用
    var uniqueDate = new Set();
    var count = 0;
    // アルコール摂取量計算結果用
    var alcoholIntakeSum = 0;
    var TodayAlcoholIntakeSum = 0;
    // 指定された酔い度について，今までのデータからアルコール摂取量を計算＆今日のアルコール摂取量を計算
    for (var i=0; i<data.length; i++){
      // timestamp → date型に
      const date = new Date(unmarshallUsersItems[i].timestamp);
      // 時間以降をなくす
      const formattedDate = date.toISOString().split('T')[0];
      // もし，一度も出てきていないならカウントアップ（日数カウント）
      if (!uniqueDate.has(formattedDate)){
        uniqueDate.add(formattedDate);
        count++;
      }
      const alcoholQuantity = parseInt(unmarshallUsersItems[i].alcoholQuantity, 10);
      const alcoholContent = parseInt(unmarshallUsersItems[i].alcoholContent, 10);
      const alcoholNum = parseInt(unmarshallUsersItems[i].alcoholNum, 10);
      const alcoholIntake = parseInt(alcoholQuantity * (alcoholContent/100) * alcoholNum);
      alcoholIntakeSum += alcoholIntake;
    }
    const limitAlcoholIntake = alcoholIntakeSum / count;
    const limitAlcoholNum = parseInt(limitAlcoholIntake / (percentageOfAlcohol/100) / Quantity, 10);

    response.body = JSON.stringify({ "limitAlcoholNum": limitAlcoholNum });
  } catch (e) {
    if(e.message == "指定のuserは見つかりませんでした．"){
      response.statusCode = 404;
      response.body = JSON.stringify({ message: e.message });
    } else if (e.message == "データが見つかりませんでした。") {
      response.statusCode = 204;
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
