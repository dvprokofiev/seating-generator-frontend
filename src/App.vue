<script setup>
/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import useClasses from "./composables/useClasses.js";

const route = useRoute();
const router = useRouter();
const { classes, loadClasses, saveClasses, hasErrors } = useClasses();

onMounted(() => {
  loadClasses();
});

const activeClass = computed(() => {
  const id = route.params.id;
  if (!id) return null;
  return classes.value.find((c) => String(c.id) === String(id));
});

const handleSeating = () => {
  saveClasses();
  const id = route.params.id;
  if (!hasErrors.value && id) {
    router.push(`/generate/${id}`);
  }
};
</script>
<template>
  <div id="app" class="d-flex flex-column vh-100 overflow-hidden">
    <nav
      class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm flex-shrink-0 py-1"
    >
      <div class="container-fluid">
        <div class="d-flex align-items-center">
          <router-link class="navbar-brand fw-bold me-1" to="/">
            Генератор рассадок
          </router-link>

          <div class="border-start border-white border-opacity-25 ps-2 ms-1">
            <a
              href="https://github.com/dvprokofiev/seating-generator"
              target="_blank"
              class="text-white-50 text-decoration-none d-flex align-items-center"
              style="font-size: 0.7rem"
            >
              <i-bi-github class="me-1" />
              Исходный код
            </a>
          </div>
        </div>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto ms-4">
            <li class="nav-item">
              <router-link class="nav-link" to="/classes-list"
                >Мои классы</router-link
              >
            </li>
            <li
              v-if="activeClass"
              class="nav-item d-flex align-items-center text-white-50"
            >
              <span class="mx-2">/</span>
              <router-link
                class="nav-link active fw-bold text-white"
                :to="{ name: 'ClassEditor', params: { id: activeClass.id } }"
              >
                {{ activeClass.name }}
              </router-link>
            </li>
          </ul>

          <ul v-if="activeClass" class="navbar-nav ms-auto">
            <li v-if="!route.path.includes('generate')" class="nav-item">
              <BButton
                variant="light"
                class="rounded-pill px-4 fw-bold text-primary shadow-sm"
                :disabled="hasErrors"
                @click="handleSeating"
              >
                <i-bi-magic class="me-2" /> Рассадить
              </BButton>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="flex-grow-1 overflow-hidden overflow-y-auto bg-light">
      <router-view />
    </main>
  </div>
</template>

<style>
html,
body {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
</style>
