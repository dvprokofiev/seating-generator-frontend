/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import App from './App.vue'
import Generator from './Generator.vue';
import ClassesList from './ClassesList.vue'
import ClassEditor from './ClassEditor.vue';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: ClassesList},
        {path: '/generate/:id', name: 'Generator', component: Generator, props: true},
        {path: '/classes-list', component: ClassesList},
        {path: '/class/:id', name: 'ClassEditor', component: ClassEditor, props: true},
        {path: '/class/:id/history', name: 'SeatingHistory', component: () => import('./SeatingHistory.vue')},
    ]
})
const app = createApp(App);
app.use(router);
app.mount('#app');