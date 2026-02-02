# Генератор рассадок - Frontend
[![Main Repo](https://img.shields.io/badge/Main_Project-Meta--Repo-orange?logo=github)](https://github.com/dvprokofiev/seating-generator)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4fc08d?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite)](https://vitejs.dev/)
[![BootstrapVueNext](https://img.shields.io/badge/BootstrapVueNext-0.40.x-7952b3?logo=bootstrap)](https://bootstrap-vue-next.github.io/bootstrap-vue-next/)

Клиентское веб-приложение для взаимодействия с системой рассадки учеников. Построено на Vue 3.

> [!IMPORTANT]
> Данный репозиторий является частью комплексной системы. 
> Основная документация, инструкции по развертыванию через Docker и ссылка на репозиторий с бэкендом находятся в **[мета-репозитории](https://github.com/dvprokofiev/seating-generator)**.

<img width="1919" height="953" alt="image" src="https://github.com/user-attachments/assets/162a9e90-0fda-4639-a91e-8e5b316ec457" />

## Локальная разработка
0. Склонируйте репозиторий:
 ```bash 
 git clone https://github.com/dvprokofiev/seating-generator-frontend/ && cd seating-generator-frontend
 ```
1. Установите зависимости:
 ```bash
 npm install
 ```
2. Запустите сервер для разработки (с Hot Reload):
```bash
npm run dev
```
3. Сборка проекта:
```bash
npm run build
```

## 🛠 Используемые технологии

* **Фреймворк:** [Vue 3](https://vuejs.org/)
* **Сборка:** [Vite](https://vitejs.dev/)
* **Стили и компоненты:** [Bootstrap 5](https://getbootstrap.com/) & [BootstrapVueNext](https://bootstrap-vue-next.github.io/bootstrap-vue-next/)
* **Иконки:** [Iconify / Unplugin Icons](https://github.com/antfu/unplugin-icons)
* **Экспорт:** [jsPDF](https://github.com/parallax/jsPDF) (генерация PDF файлов рассадок)
* **HTTP-клиент:** [Axios](https://axios-http.com/)

# ⚖️ Лицензия
Код в репозитории является частью проекта "Генератор рассадок" и лицензирован под **GNU Affero General Public License v3.0 (AGPLv3)**. Подробности см. в файлах [LICENSE](./LICENSE) и [NOTICE](./NOTICE) данного репозитория и в [мета-репозитории](https://github.com/dvprokofiev/seating-generator).

Copyright (C) 2026 Прокофьев Даниил <[d@dvprokofiev.ru](mailto:d@dvprokofiev.ru)>
