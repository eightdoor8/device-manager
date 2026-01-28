/**
 * Firebase のタイムスタンプオブジェクトまたは Date オブジェクトを
 * 「YYYY年M月D日 HH:mm:ss」形式の文字列に変換（UTC+9）
 */
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) {
    return "-";
  }

  let date: Date;

  // Firebase Timestamp オブジェクトの場合
  if (timestamp && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  }
  // Date オブジェクトの場合
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // 数値（ミリ秒）の場合
  else if (typeof timestamp === "number") {
    date = new Date(timestamp);
  }
  // 文字列の場合
  else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  }
  // その他の場合
  else {
    return "-";
  }

  // 無効な日付の場合
  if (isNaN(date.getTime())) {
    return "-";
  }

  // UTC+9 に変換
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  // フォーマット: YYYY年M月D日 HH:mm:ss
  const year = jstDate.getUTCFullYear();
  const month = jstDate.getUTCMonth() + 1;
  const day = jstDate.getUTCDate();
  const hours = String(jstDate.getUTCHours()).padStart(2, "0");
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(jstDate.getUTCSeconds()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}
