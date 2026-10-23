import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([]);
    let nextId = 0;

    const hasToasts = computed(() => toasts.value.length > 0)

    function showToast(message, type = 'success') {
        const id = nextId++;
        toasts.value.push({ id, message, type })

        setTimeout(() => {
            toasts.value = toasts.value.filter((toast) => toast.id !== id)
        }, 3000)
    }

    return {
        toasts,
        hasToasts,
        showToast
    }
})