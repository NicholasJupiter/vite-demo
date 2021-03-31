<template>
  <p>this is title : {{ title }}</p>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
export default defineComponent({
  name: 'App',
  props: {},
  emits: [],
  setup() {
    const title = ref('hello world!');
    setInterval(() => {
      title.value = title.value.split('').reverse().join('');
    }, 1000);
    return {
      title,
    };
  },
});
</script>
<style lang="scss" scoped></style>
