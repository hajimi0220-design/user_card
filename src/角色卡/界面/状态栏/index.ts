import { waitUntil } from 'async-wait-until';
import App from './App.vue';

$(async () => {
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'chat' }), 'stat_data'));
  createApp(App).use(createPinia()).mount('#app');
});
