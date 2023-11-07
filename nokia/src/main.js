import Vue from "vue";
import { ref } from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

const vue = new Vue({
  render: (h) => h(App),
});

vue.$mount("#app");
