<template>
  <div class="ui main container">
    <div class="ui active inverted page dimmer" v-if="isCallingApi">
      <div class="ui text loader">Loading</div>
    </div>
    <div class="ui dividing header">
      <h1>お酒免許証</h1>
      <a @click="logout" class="item" style="display: block; margin-top: 10px; cursor: pointer;">Logout</a>
    </div>
    <div class="ui grid">
      <div class="row">
        <div class="ui six wide column" style="display: flex; align-items: center; justify-content: center;">
          <i class="user icon" style="font-size: 4em;"></i>
        </div>
        <div class="ui ten wide column">
          <table class="ui single line table">
            <tbody>
              <div class="ui grid">
                <div class="row" style="background-color: #ffffff;">
                  <div class="eight wide column" style="text-align: left;">名前</div>
                  <div class="eight wide column" style="text-align: right;">{{ user.userId }}</div>
                </div>
                <div class="row" style="background-color: #f0f0f0;">
                  <div class="eight wide column" style="text-align: left;">好きなお酒</div>
                  <div class="eight wide column" style="text-align: right;">{{ user.likeSake }}</div>
                </div>
                <div class="row" style="background-color: #ffffff;">
                  <div class="eight wide column" style="text-align: left;">お酒の強さ</div>
                  <div class="eight wide column" style="text-align: right;">{{ user.currentIntoxicationLevel }}</div>
                </div>
              </div>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="ui divider"></div>
    <table class="ui single line table">
      <tbody>
        <div class="ui three column grid">
          <div class="row">
            <div class="eight wide column" 
              style="text-align: left; font-weight: bold; font-size: 1.5rem;">ほろ酔いまで</div>
            <div class="six wide column" style="text-align: right;">
              <a class="ui big blue circular label">2</a></div>
            <div class="two wide column">缶</div>
          </div>
        </div>
        <div class="ui grid">
          <div class="row">
            <div class="ten wide column" 
              style="text-align: left; font-weight: bold; font-size: 1.5rem;">そこそこ酔いまで</div>
            <div class="four wide column" style="text-align: right;">
              <a class="ui big blue circular label">2</a></div>
            <div class="two wide column">缶</div>
          </div>
        </div>
        <div class="ui grid">
          <div class="row">
            <div class="eight wide column" style="text-align: left; font-weight: bold; font-size: 1.5rem;">マジ酔いまで</div>
            <div class="six wide column" style="text-align: right;">
              <a class="ui big blue circular label">2</a></div>
            <div class="two wide column">缶</div>
          </div>
        </div>
      </tbody>
    </table>
    <div class="ui divider"></div>
    <div class="ui grid">
      <div class="row" style="background-color: #f0f0f0;">
        <div class="eight wide column" style="text-align: left;">今月飲んだ本数</div>
        <div class="eight wide column" style="text-align: right;">7本</div>
      </div>
      <div class="row" style="background-color: #f0f0f0;">
        <div class="eight wide column" style="text-align: left;">生活習慣病リスク</div>
        <div class="eight wide column" style="text-align: right;">なし</div>
      </div>
    </div>
    <h2 class="blue-text">今月のグラフ</h2>
    <Bar
      id="userId"
      :options="chartOptions"
      :data="chartData"
    />
  </div>
</template>

<script>
import { baseUrl } from '@/assets/config.js';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: 'Profile',

  components: {
    Bar
  },

  data() {
    return {
      user: {
        userId: window.localStorage.getItem('userId'),
        affilicationId: window.localStorage.getItem('affilicationId'),
        likeSake: '',
        currentIntoxicationLevel: '',
        limitHoroyoi:  null,
        limitSokoyoi:  null,
        limitGatiyoi:  null
      },
      succeedMsg: false,
      errorMsg: "",
      isCallingApi: false,
      chartData: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: 'blue'
        }]
      },
      chartOptions: {
        responsive: true,
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: '本数'
            }
          }
        }
      }
    };
  },
  methods: {
    logout() {
      window.localStorage.clear();
      this.$router.push({name: "Login"});
    },
    
    async fetchUserId() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const headers = { Authorization: "mtiToken", "Access-Control-Allow-Origin": "*" };
      
      try {
        const res = await fetch(`${baseUrl}/user?userId=${this.user.userId}&affilicationId=${this.user.affilicationId}`, {
          method: "GET",
          headers
        });

        const jsonData = await res.json();
        console.log(jsonData);
        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
        this.user.likeSake = jsonData.likeSake;
        
      } catch (e) {
        console.error('ユーザーIDの取得中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },

    async fetchlimitHoroyoi() {
      const headers = { Authorization: "mtiToken" };
      const limitType = 1

      
      try {
        const res = await fetch(`${baseUrl}/user/limit?userId=${this.user.userId}&sucurrentIntoxicationLevel=${limitType}`, {
          method: "GET",
          headers
        });

        const jsonData = await res.json();
        console.log(jsonData);
        
        
        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
        this.user.limitHoroyoi = jsonData.limitAlcoholNum;
        
      } catch (e) {
        console.error('ユーザーIDの取得中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },
    
    async fetchlimitSokoyoi() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const headers = { Authorization: "mtiToken" };
      const limitType = 2

      try {
        const res = await fetch(`${baseUrl}/user/limit?userId=${this.user.userId}&sucurrentIntoxicationLevel=${limitType}`, {
          method: "GET",
          headers
        });

        const jsonData = await res.json();

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
        this.user.limitSokoyoi = jsonData.limitAlcoholNum;
        
      } catch (e) {
        console.error('ユーザーIDの取得中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },
    
    async fetchlimitGatiyoi() {
      if (this.isCallingApi) {
        return;
      }
      this.isCallingApi = true;

      const headers = { Authorization: "mtiToken" };
      const limitType = 3

      try {
        const res = await fetch(`${baseUrl}/user/limit?userId=${this.user.userId}&sucurrentIntoxicationLevel=${limitType}`, {
          method: "GET",
          headers
        });

        const jsonData = await res.json();

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }
        this.user.limitGatiyoi = jsonData.limitAlcoholNum;
        
      } catch (e) {
        console.error('ユーザーIDの取得中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },

    async fetchDate() {
      this.isCallingApi = true;

      const headers = { Authorization: "mtiToken" };

      try {
        const res = await fetch(`${baseUrl}/date`, { // APIエンドポイントを設定
          method: "GET",
          headers
        });

        const jsonData = await res.json();

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        const date = new Date(jsonData.date); // APIから取得したdate
        this.updateChartData(date);
        
      } catch (e) {
        console.error('日付の取得中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    },

    updateChartData(date) {
      const dateList = [
        date.toISOString().split('T')[0], // 今日の日付
        new Date(date).setDate(date.getDate() - 1).toISOString().split('T')[0], // 前日
        new Date(date).setDate(date.getDate() - 2).toISOString().split('T')[0]  // さらに前日
      ];

      this.chartData = {
        labels: dateList,
        datasets: [{
          data: [40, 20, 12], // ここに実際のデータを設定
          backgroundColor: '#f87979'
        }]
      };
    },

    async submit() {
      if (this.isCallingApi) {
        return;
      }

      this.isCallingApi = true;

      const headers = { Authorization: "mtiToken" };
      const { userId, likeSake } = this.user;
      const reqBody = { userId, likeSake };

      try {
        const res = await fetch(`${baseUrl}/user`, {
          method: "PUT",
          body: JSON.stringify(reqBody),
          headers
        });

        const jsonData = await res.json();

        if (!res.ok) {
          const errorMessage = jsonData.message ?? "エラーメッセージがありません";
          throw new Error(errorMessage);
        }

        this.succeedMsg = true;
      } catch (e) {
        console.error('更新中にエラーが発生しました:', e);
        this.errorMsg = e.message;
      } finally {
        this.isCallingApi = false;
      }
    }
  },

  created() {
    this.fetchUserId();
    this.fetchlimitHoroyoi();
    this.fetchlimitSokoyoi();
    this.fetchlimitGatiyoi();
  }
}
</script>

<style scoped>
/* このコンポーネントだけに適用するCSSはここに記述する */
</style>
