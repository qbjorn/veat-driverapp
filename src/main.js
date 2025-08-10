import { createApp, provide, h } from 'vue'
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core'
import App from './App.vue'
import multilogSetup from './multilog';

// Access the mode the application was built for
const mode = import.meta.env.MODE;

const apiUrl = mode === 'dev' ? 'http://ubuntu-ai:9000/graphql' : mode === 'stage' ? 'https://stage.veat.se/graphql/': 'https://veat.se/graphql/';
// const apiUrl = 'https://veat.se/graphql/';

const cache = new InMemoryCache()

function getHeaders() {
  const headers = {};
  const token = '6c286684-05e0-4028-a8d1-52ad97a3ba7a';
  headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = "application/json";
  return headers;
}

// Create an http link:
const uri = apiUrl;
const httpLink = new HttpLink({
  uri,
  fetch: (uri, options) => {
    options.headers = getHeaders();
    return fetch(uri, options);
  },
});

const apolloClient = new ApolloClient({
  cache,
  link: httpLink,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only'
    },
    query: {
      fetchPolicy: 'network-only'
    }
  }
})

const app = createApp({
  setup () {
    provide(DefaultApolloClient, apolloClient)
    provide('multilog', multilogSetup); // Provide 'multilog' so it can be accessed globally
  },
  render: () => h(App),
});

app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
})

app.mount('#app');
