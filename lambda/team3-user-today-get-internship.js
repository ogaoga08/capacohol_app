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
  // 今日の日時を取得
  const now = new Date();
  // 今日の開始時刻を取得（年、月、日を指定し、時刻を00:00:00に設定）
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  // 今日の終了時刻を取得（年、月、日を指定し、時刻を23:59:59に設定）
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
  const percentageOfAlcohol = 7 //アルコール度数
  const Quantity = 500　// 酒の量

  // 指定された酔い度（currentIntoxicationLevel）を検索キーに指定して検索，型に注意！！！！！！！！！！！！！！！！！！！！
  const queryParam = {
    TableName, // TableName: TableNameと同じ意味
    Limit: 100,

    // 一つのキーに複数の条件をつけることはできないため、BETWEEN演算を利用する
    KeyConditionExpression: "userId = :uid and #ts BETWEEN :start AND :end",
    // timestampは予約後であるため、プレースホルダ経由じゃないと指定できない。
    ExpressionAttributeNames: {
      "#ts": "timestamp",
    },
    ExpressionAttributeValues: {
      ":uid": { S: userId },
      // startが無効な場合は、0以上という条件にすることで、実質フィルタリング無効化
      ":start": { N: startOfDay.toString() },
      // endが無効な場合は、現在時刻以下という条件にすることで、実質フィルタリング無効化
      ":end": { N: endOfDay.toString() },
    },
  };
  const command = new QueryCommand(queryParam);

  try {
    //DBからデータを取得
    const data = (await client.send(command))?.Items;
    if (data.length === 0) {
      throw new Error("データが見つかりませんでした。");
    }
    
    // json形式に変換
    const unmarshallUsersItems = data.map((item) => unmarshall(item));
    console.log(unmarshallUsersItems);
    console.log(unmarshallUsersItems.length);
    // アルコール摂取量計算結果用
    var TodayAlcoholIntakeSum = 0;
    // 指定された酔い度について，今までのデータからアルコール摂取量を計算＆今日のアルコール摂取量を計算
    for (var i=0; i<unmarshallUsersItems.length; i++){
      const alcoholQuantity = parseInt(unmarshallUsersItems[i].alcoholQuantity, 10);
      const alcoholContent = parseInt(unmarshallUsersItems[i].alcoholContent, 10);
      const alcoholNum = parseInt(unmarshallUsersItems[i].alcoholNum, 10);
      const alcoholIntake = parseInt(alcoholQuantity * (alcoholContent/100) * alcoholNum);
      TodayAlcoholIntakeSum += alcoholIntake;
    }
    const TodayAlcoholIntakeNum = parseInt(TodayAlcoholIntakeSum / (percentageOfAlcohol/100) / Quantity, 10);

    response.body = JSON.stringify({ "TodayAlcoholIntakeNum": TodayAlcoholIntakeNum });
    
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
