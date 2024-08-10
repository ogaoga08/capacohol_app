<template>
  <div>
    <div class="ui main container">
      <!-- 基本的なコンテンツはここに記載する -->
      <h1 class="ui dividing header">お酒カレンダー</h1>
      <VDatePicker :attributes='attributes' :max-date="new Date()" v-model="date" class="custom-calendar"/>
    </div>
  </div>
</template>

<script>
// 必要なものはここでインポートする
// @は/srcの同じ意味です
// import something from '@/components/something.vue';
import { baseUrl } from "@/assets/config.js";
import { Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
const headers = { Authorization: "mtiToken" };

export default {
  name: "User",

  components: {
    // 読み込んだコンポーネント名をここに記述する
     Calendar,
     DatePicker,
  },

  data() {
    // Vue.jsで使う変数はここに記述する
    return {
       date: new Date(),
    };
  },

  computed: {
    // 計算した結果を変数として利用したいときはここに記述する
    filteredUsers() {
      return this.users.filter((e) => {
        // nicknameのマッチングチェック
        const matchNickname = this.nickname
          ? e.nickname?.match(this.nickname)
          : true;

        // ageの範囲チェック
        const withinAgeRange =
          (this.start ? e.age >= this.start : true) &&
          (this.end ? e.age <= this.end : true);

        return matchNickname && withinAgeRange;
      });
    },
  },

  methods: {
    // Vue.jsで使う関数はここで記述する
    // 発展課題のエラーメッセージ用
    clearError() {
      this.errorMsg = "";
    },
  },

  created: async function () {
    this.isCallingApi = true;

    try {
      /* global fetch */
      const res = await fetch(baseUrl + "/users", {
        method: "GET",
        headers,
      });

      const text = await res.text();
      const jsonData = text ? JSON.parse(text) : {};

      // fetchではネットワークエラー以外のエラーはthrowされないため、明示的にthrowする
      if (!res.ok) {
        const errorMessage = jsonData.message ?? "エラーメッセージがありません";
        throw new Error(errorMessage);
      }

      this.users = jsonData.users ?? [];
    } catch (e) {
      this.errorMsg = `ユーザーリスト取得時にエラーが発生しました: ${e}`;
    } finally {
      this.isCallingApi = false;
    }
  },
};
</script>

<style scoped>
/* このコンポーネントだけに適用するCSSはここに記述する */
.ui.main.container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  transition: all 0.2s;
  text-align: center;
}

.ui.main.container h1 {
  margin-bottom: 20px; /* 下部マージンを追加 */
  text-align: left;
}

.custom-calendar {
  /* カレンダーのサイズを調整 */
  width: 100%; /* 幅を100%に設定 */
  max-width: 800px; /* 最大幅を800pxに設定 */
  margin: 0 auto; /* 中央に配置 */
  font-size: 1.5em; /* フォントサイズを大きく設定 */
}

</style>
