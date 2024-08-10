<template>
    <div class="ui secondary pointing yellow inverted massive menu" v-if="isMenuNeeded" style="position: fixed; bottom: 0; width: 100%; margin: 0;">
        <div class="ui three column grid" style="width: 100%; margin: 0;">
            <div class="column" style="text-align: center; display: flex; align-items: center; justify-content: center;">
                <router-link active-class="active" class="item" exact to="/" style="width: 100%; align-items: center;">
                    <i class="edit icon"></i>
                </router-link>
            </div>
            <div class="column" style="text-align: center; display: flex; align-items: center; justify-content: center;">
                <router-link active-class="active" class="item" exact to="/user" style="width: 100%; text-align: center;">
                    <i class="calendar outline icon"></i>
                </router-link>
            </div>
            <div class="column" style="text-align: center; display: flex; align-items: center; justify-content: center;">
                <router-link active-class="active" class="item" exact to="/profile" style="width: 100%; text-align: center;">
                    <i class="address card outline icon"></i>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Menu',
        
        data() {
            return {
            
            };
        },
        
        computed: {
            isMenuNeeded() {
                return this.$route.name !== 'Login';
            },
        },
        
        methods: {
            logout() {
                window.localStorage.clear();
                this.$router.push({name: "Login"});
            }
        },
    };
</script>

<style scoped>
.ui.secondary.pointing.menu {
  z-index: 1000;/* 必要に応じて値を調整してください */
}
.item {
    width: 100%;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem; /* アイコンのサイズを大きくします */
}
.ui.main.container {
  margin-bottom: 120px; /* ナビゲーションバーの高さと同じ値に設定 */
}
</style>
