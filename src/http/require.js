/**
 * Created by cx on 2018/10/19.
 * Include
 * description
 */
import Vue from 'vue';

const instance = Vue.axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' }
});
export default instance;
