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

      <h1 class="ui dividing header">アルコールの記録</h1>
      
      <!-- お酒登録ボックス -->
      <div class="ui segment">
        <form class="ui form" @submit.prevent="postAlcohol">
          <div class="field">
            <label for="Date">日付</label>
            <input
              type="date"
              id="Date"
              name="Date"
            />
          </div>

          <div class="inline field">
            <label for="AlcoholContent">アルコール度数</label><br>
            <input
              v-model="post.alcoholContent"
              type="number"
              id="AlcoholContent"
              name="AlcoholContent"
              placeholder="%"
            />
          </div>

          <div class="inline field">
            <label for="AlcoholQuantity">飲んだ量</label><br>
            <input
              v-model="post.alcoholQuantity"
              type="number"
              id="AlcoholQuantity"
              name="AlcoholQuantity"
              placeholder="ml"
            />
          </div>
          
          <div class="inline field">
            <label for="AlcoholNum">飲んだ本数</label><br>
            <input
              v-model="post.alcoholNum"
              type="number"
              id="AlcoholNum"
              name="AlcoholNum"
              placeholder="本・缶・杯"
            />
          </div>​
          
          <div class="inline field">
            <label for="CurrentIntoxicationLevel">あなたの酔い度を選択してください</label>
              <select id="CurrentIntoxicationLevel" v-model="post.currentIntoxicationLevel">
                <option v-for="CurrentIntoxicationLevel in CurrentIntoxicationLevels" :value="CurrentIntoxicationLevel.value" :key="CurrentIntoxicationLevel.value">
                  {{ CurrentIntoxicationLevel.text }}
                </option>
             </select>
          </div>
          
          <div class="right-align">
            <button
              class="ui green button"
              type="submit"
              :disabled="isPostButtonDisabled"
            >
              登録
            </button>
          </div>
        </form>
      </div>


      <!-- 飲酒履歴 -->
      <h3 class="ui dividing header">飲酒履歴</h3>
      <div class="ui segment">
        <ul class="ui comments divided alcohol-list">
          <template v-for="(alcohol, index) in alcohols" :key="index">
            <li class="comment">
              <div class="content">
                <span class="author">{{ alcohol.userId }}</span>
                <div class="metadata">
                  <span class="date">{{
                    convertToLocaleString(alcohol.timestamp)
                  }}</span>
                </div>
                <button
                  v-if="isMyAlcohol(alcohol.userId)"
                  class="ui negative mini button right floated"
                  @click="deleteAlcohol(alcohol)"
                >
                  削除
                </button>
                <p class="text">
                  アルコール度数: {{ alcohol.alcoholContent }}%、 飲んだ量: {{ alcohol.alcoholQuantity }}ml、 本数: {{ alcohol.alcoholNum }} 
                </p>
                <span class="ui green label">
                  酔い度: {{ alcohol.currentIntoxicationLevel }}</span>
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
import { baseUrl } from "@/assets/config.js";

export default {
  name: "Home",

  data() {
    return {
      CurrentIntoxicationLevels: [
        { value: '1', text: 'ほろ酔い' },
        { value: '2', text: 'そこそこ酔い' },
        { value: '3', text: 'マジ酔い' },
      ],
      post: {
        alcoholContent: null,
        alcoholNum: null,
        alcoholQuantity: null,
        currentIntoxicationLevel: null,
      },
      alcohols: [],
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
        
    isPostButtonDisabled() {
      return (
        !this.post.alcoholContent ||
        !this.post.alcoholNum ||
        !this.post.alcoholQuantity ||
        !this.post.currentIntoxicationLevel
      );
    },
  },

  created: async function () {
    if (
      window.localStorage.getItem("userId") &&
      window.localStorage.getItem("token")
    ) {
      this.iam = window.localStorage.getItem("userId");
      await this.getAlcoholRecords();
    } else {
      window.localStorage.clear();
      this.$router.push({ name: "Login" });
    }
  },

  methods: {
    clearMsg(target) {
      if (target === "error") {
        this.errorMsg = "";
      } else {
        this.successMsg = "";
      }
    },

    isMyAlcohol(id) {
      return this.iam === id;
    },

    async getAlcoholRecords() {
      this.isCallingApi = true;

      try {
        const res = await fetch(baseUrl + "/records", {
          method: "GET",
          headers: {
            'Authorization': 'mtiToken' // 適切なトークンを設定してください
          }
        });

        const text = await res.text();
        const jsonData = text ? JSON.parse(text) : {};

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
        
        this.alcohols = jsonData.alcohol ?? [];
        
        
      } catch (e) {
        this.errorMsg = `飲酒記録取得時にエラーが発生しました: ${e.message}`;
      } finally {
        this.isCallingApi = false;
      }
    },
    
    async postAlcohol() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;
    
      const reqBody = {
        userId: this.iam,
        alcoholContent: this.post.alcoholContent,
        alcoholQuantity: this.post.alcoholQuantity,
        alcoholNum: this.post.alcoholNum,
        currentIntoxicationLevel: this.post.currentIntoxicationLevel
      };
      
      try {
        const res = await fetch(baseUrl + "/record", {
          method: "POST",
          body: JSON.stringify(reqBody),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'mtiToken' // ここを適切なトークンに変更
          }
        });
    
        const jsonData = await res.json();
    
        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
    
        this.alcohols.unshift({ ...reqBody, timestamp: Date.now() });
        this.successMsg = "お酒を登録出来ました！";
        this.post.alcoholContent = "";
        this.post.alcoholQuantity = "";
        this.post.alcoholNum = "";
        this.post.currentIntoxicationLevel = "";
      } catch (e) {
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },
    
    async deleteAlcohol(alcohol) {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const { userId, timestamp } = alcohol;
      try {
        const res = await fetch(
          `${baseUrl}/record?userId=${userId}&timestamp=${timestamp}`,
          {
            method: "DELETE",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${window.localStorage.getItem('token')}`
            }
          }
        );

        const jsonData = await res.json();

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        const deleted = this.alcohols.findIndex(
          (a) => a.userId === userId && a.timestamp === timestamp
        );
        this.alcohols.splice(deleted, 1);
        this.successMsg = "履歴が削除されました！";
      } catch (e) {
        this.errorMsg = e.message;
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
.article-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 100%;
}
.right-align {
  text-align: right;
}
.date {
  text-align: left;
  width: 150px;
}
.alcoholContent {
  width: 150px;
}
.alcoholNum {
  text-align: left;
  width: 150px;
}
.selectToxication {
  text-align: left;
  width: 300px;
}
</style>
