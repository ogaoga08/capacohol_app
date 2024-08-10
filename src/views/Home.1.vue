<template>
  <div>
    <div class="ui main container">
      <!-- 基本的なコンテンツはここに記載する -->
      <!-- loading表示用 -->
      <div class="ui active inverted page dimmer" v-if="isCallingApi">
        <div class="ui text loader">Loading</div>
      </div>

      <!-- エラーメッセージ用-->
      <p class="ui negative message" v-if="errorMsg">
        <i class="close icon" @click="clearMsg('error')"></i>
        <span class="header">エラーが発生しました！</span>
        {{ errorMsg }}
      </p>

      <!-- 成功メッセージ用-->
      <p class="ui positive message" v-if="successMsg">
        <i class="close icon" @click="clearMsg"></i>
        <span class="header">成功！</span>
        {{ successMsg }}
      </p>

      <!-- 投稿ボックス -->
      <div class="ui segment">
        <form class="ui form" @submit.prevent="postArticle">
          <div class="field">
            <textarea
              v-model="post.text"
              name="article-content"
              placeholder="あなたの投稿を発信しましょう！"
            />
          </div>

          <div class="inline field">
            <label for="article-category">カテゴリー</label>
            <input
              v-model="post.category"
              type="text"
              id="article-category"
              name="article-category"
            />
          </div>
          <div class="right-align">
            <button
              class="ui green button"
              v-bind:disabled="isPostButtonDisabled"
              type="submit"
            >
              投稿
            </button>
          </div>
        </form>
      </div>

      <!-- 検索ボックス -->
      <div class="ui segment">
        <form class="ui form" @submit.prevent="getSearchedArticles">
          <div class="field">
            <label for="userId">ユーザーID</label>
            <input
              v-model="search.userId"
              type="text"
              id="userId"
              name="userId"
              placeholder="ユーザーID"
            />
          </div>

          <div class="field">
            <label for="category">カテゴリー名</label>
            <input
              v-model="search.category"
              type="text"
              id="category"
              name="category"
              placeholder="カテゴリ"
            />
          </div>

          <div class="field">
            <label>投稿日時</label>
            <div class="inline fields">
              <div class="field">
                <input
                  v-model="search.start"
                  type="datetime-local"
                  id="timestampstart"
                  name="timestampstart"
                />
                <label for="timestampstart">から</label>
              </div>

              <div class="field">
                <input
                  v-model="search.end"
                  type="datetime-local"
                  id="timestampend"
                  name="timestampend"
                />
                <label for="timestampend">まで</label>
              </div>
            </div>
          </div>
          <div class="right-align">
            <button
              class="ui green button"
              type="submit"
              v-bind:disabled="isSearchButtonDisabled"
            >
              検索
            </button>
          </div>
        </form>
      </div>

      <!-- 投稿一覧 -->
      <h3 class="ui dividing header">投稿一覧</h3>
      <div class="ui segment">
        <ul class="ui comments divided article-list">
          <template v-for="(article, index) in articles" :key="index">
            <li class="comment">
              <div class="content">
                <span class="author">{{ article.userId }}</span>
                <div class="metadata">
                  <span class="date">{{
                    convertToLocaleString(article.timestamp)
                  }}</span>
                </div>
                <button
                  v-if="isMyArticle(article.userId)"
                  class="ui negative mini button right floated"
                  @click="deleteArticle(article)"
                >
                  削除
                </button>
                <p class="text">
                  {{ article.text }}
                </p>
                <span v-if="article.category" class="ui green label">{{
                  article.category
                }}</span>
                <div class="ui divider"></div>
              </div>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
// 必要なものはここでインポートする
// @は/srcと同じ意味です
// import something from '@/components/something.vue';
import { baseUrl } from "@/assets/config.js";

const headers = { Authorization: "mtiToken" };

export default {
  name: "Home",

  components: {
    // 読み込んだコンポーネント名をここに記述する
  },

  data() {
    // Vue.jsで使う変数はここに記述する
    return {
      post: {
        text: null,
        category: null,
      },
      search: {
        userId: null,
        category: null,
        start: null,
        end: null,
      },
      articles: [],
      iam: null,
      successMsg: "",
      errorMsg: "",
      isCallingApi: false,
    };
  },

  computed: {
    getToday(){
        const today = new Date();
        function dateFormat(today, format){
          format = format.replace("YYYY", today.getFullYear());
          format = format.replace("MM", ("0"+(today.getMonth() + 1)).slice(-2));
          format = format.replace("DD", ("0"+ today.getDate()).slice(-2));
          return format;
        }
        const data = dateFormat(today,'YYYY-MM-DD');
        const field = document.date(dateに付与した任意ID);
        field.value = data;
        field.setAttribute("min", data);
      },
    // 計算した結果を変数として利用したいときはここに記述する
    isPostButtonDisabled() {
      return !this.post.text;
    },

    isSearchButtonDisabled() {
      return !this.search.userId;
    },
  },

  created: async function () {
    // Vue.jsの読み込みが完了したときに実行する処理はここに記述する
    // apiからarticleを取得する

    if (
      window.localStorage.getItem("userId") &&
      window.localStorage.getItem("token")
    ) {
      this.iam = window.localStorage.getItem("userId");
      await this.getArticles();
    } else {
      window.localStorage.clear();
      this.$router.push({ name: "Login" });
    }
  },

  methods: {
    // Vue.jsで使う関数はここで記述する
    clearMsg(target) {
      if (target === "error") {
        this.errorMsg = "";
      } else {
        this.successMsg = "";
      }
    },

    isMyArticle(id) {
      return this.iam === id;
    },

    async getArticles() {
      this.isCallingApi = true;

      try {
        /* global fetch */
        const res = await fetch(baseUrl + "/articles", {
          method: "GET",
          headers,
        });

        const text = await res.text();
        const jsonData = text ? JSON.parse(text) : {};

        // fetchではネットワークエラー以外のエラーはthrowされないため、明示的にthrowする
        if (!res.ok) {
          const errorMessage =
            jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        // 記事がなかった場合undefinedとなり、記事追加時のunshiftでエラーとなるため、空のarrayを代入
        this.articles = jsonData.articles ?? [];
      } catch (e) {
        this.errorMsg = `記事一覧取得時にエラーが発生しました: ${e}`;
      } finally {
        this.isCallingApi = false;
      }
    },

    async postArticle() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const reqBody = {
        userId: this.iam,
        text: this.post.text,
        category: this.post.category,
      };
      try {
        /* global fetch */
        const res = await fetch(baseUrl + "/article", {
          method: "POST",
          body: JSON.stringify(reqBody),
          headers,
        });

        const text = await res.text();
        const jsonData = text ? JSON.parse(text) : {};

        // fetchではネットワークエラー以外のエラーはthrowされないため、明示的にthrowする
        if (!res.ok) {
          const errorMessage =
            jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        this.articles.unshift({ ...reqBody, timestamp: Date.now() });
        this.successMsg = "記事が投稿されました！";
        this.post.text = "";
        this.post.category = "";
      } catch (e) {
        console.error(e);
        this.errorMsg = e;
      } finally {
        this.isCallingApi = false;
      }
    },

    async getSearchedArticles() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const { userId, category, start, end } = this.search;
      const startTS = start ? new Date(start).getTime() : "";
      const endTS = end ? new Date(end).getTime() : "";
      const qs = `userId=${userId}&category=${
        category ?? ""
      }&start=${startTS}&end=${endTS}`;

      try {
        /* global fetch */
        const res = await fetch(baseUrl + `/articles?${qs}`, {
          method: "GET",
          headers,
        });

        const text = await res.text();
        const jsonData = text ? JSON.parse(text) : {};

        // fetchではネットワークエラー以外のエラーはthrowされないため、明示的にthrowする
        if (!res.ok) {
          const errorMessage =
            jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        this.articles = jsonData.articles;
      } catch (e) {
        console.error(e);
        this.errorMsg = e;
      } finally {
        this.isCallingApi = false;
      }
    },

    async deleteArticle(article) {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const { userId, timestamp } = article;
      try {
        /* global fetch */
        const res = await fetch(
          `${baseUrl}/article?userId=${userId}&timestamp=${timestamp}`,
          {
            method: "DELETE",
            headers,
          }
        );

        const text = await res.text();
        const jsonData = text ? JSON.parse(text) : {};

        // fetchではネットワークエラー以外のエラーはthrowされないため、明示的にthrowする
        if (!res.ok) {
          const errorMessage =
            jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        const deleted = this.articles.findIndex(
          (a) => a.userId === userId && a.timestamp === timestamp
        );
        this.articles.splice(deleted, 1);
        this.successMsg = "記事が削除されました！";
      } catch (e) {
        console.error(e);
        this.errorMsg = e;
      } finally {
        this.isCallingApi = false;
      }
    },

    convertToLocaleString(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
  },
};
</script>

<style scoped>
/* このコンポーネントだけに適用するCSSはここに記述する */
.article-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 100%;
}
.right-align {
  text-align: right;
}
</style>
