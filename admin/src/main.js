import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// 这里没有任何多余代码，干干净净 ✔️
const app = createApp(App);
app.use(router);
app.mount("#app");
