import axios from 'axios';

export default axios.create({
  baseURL: 'https://api.unsplash.com',
  headers: {
    Authorization: 'Client-ID jILKBTex-0edV9Q4ezDWjGsKtRi3wj4JZ-pLZjifTQA',
  },
});
