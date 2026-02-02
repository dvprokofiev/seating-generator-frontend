<script setup>
/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { ref, watch, onMounted } from "vue";
import { BApp } from "bootstrap-vue-next";
import Papa from "papaparse";
import useClasses from "./composables/useClasses.js";

const {
  classes,
  newClassName,
  addNewClass,
  deleteClass,
  saveClasses,
  loadClasses,
} = useClasses();
const showModal = ref(false);

const handleDelete = (cls) => {
  if (
    confirm(
      `Вы уверены, что хотите удалить класс "${cls.name}" со всей историей рассадок?`
    )
  ) {
    deleteClass(cls.id);
  }
};

const getRandomColor = (id) => {
  const colors = [
    "bg-primary",
    "bg-success",
    "bg-warning",
    "bg-info",
    "bg-danger",
  ];
  return colors[id % colors.length];
};

const importCSV = (event) => {
  const newClass = {
    id: Date.now(),
    name: "Новый класс",
    classConfig: {
      rows: 3,
      columns: 2,
      deskType: "double",
    },
    students: [],
    preferences: [],
    forbidden: [],
  };
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const lines = content.split(/\r?\n/);

    let csvToParse = content;

    if (lines[0].startsWith("CONFIG;")) {
      const parts = lines[0].split(";");
      if (parts.length >= 5) {
        newClass.name = parts[1];
        newClass.classConfig.rows = parseInt(parts[2]) || 3;
        newClass.classConfig.columns = parseInt(parts[3]) || 2;
        newClass.classConfig.deskType = parts[4].trim();
      }
      lines.shift();
      csvToParse = lines.join("\n");
    }

    Papa.parse(csvToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        const importedStudents = rows.map((row) => ({
          id: Math.floor(Date.now() + Math.random() * 10000),
          name: row["Имя"] || "Без имени",
          preferredRows: row["Парты"] || "",
          preferredColumns: row["Ряды"] || "",
          medicalPreferredRow: row["Мед_Парты"] || "",
          medicalPreferredColumn: row["Мед_Ряды"] || "",
        }));

        const newPrefs = [];
        const newForbidden = [];

        rows.forEach((row) => {
          const currentName = row["Имя"];
          if (!currentName) return;

          if (row["Дружит_с"]) {
            const friendName = row["Дружит_с"].trim();
            const exists = newPrefs.find(
              (p) => p.includes(currentName) && p.includes(friendName)
            );
            if (!exists) newPrefs.push([currentName, friendName]);
          }

          if (row["Враждует_с"]) {
            const enemyName = row["Враждует_с"].trim();
            const exists = newForbidden.find(
              (p) => p.includes(currentName) && p.includes(enemyName)
            );
            if (!exists) newForbidden.push([currentName, enemyName]);
          }
        });
        newClass.students = importedStudents;
        newClass.preferences = newPrefs;
        newClass.forbidden = newForbidden;
        classes.value.push(newClass);
        saveClasses();
      },
      error: (err) => {
        console.error("Ошибка PapaParse:", err);
        alert("Ошибка при чтении CSV файла");
      },
    });
  };

  reader.readAsText(file, "UTF-8");
  event.target.value = "";
};

onMounted(() => {
  loadClasses();
});

watch(classes, () => saveClasses(), { deep: true });
</script>
<template>
  <BApp>
    <div class="container py-5">
      <div class="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 class="fw-bold display-6 mb-1 text-dark">Мои классы</h1>
          <p class="text-muted m-0">
            Управление списками и настройками геометрии кабинетов
          </p>
        </div>
        <div class="d-flex gap-3">
          <BButton
            variant="primary"
            size="lg"
            class="shadow-sm px-4 rounded-pill"
            @click="showModal = true"
          >
            <i-bi-plus-lg me-2></i-bi-plus-lg>Создать класс
          </BButton>
          <BButton
            variant="outline-primary"
            class="shadow-sm px-4 rounded-pill"
            size="sm"
            @click="$refs.csvInput.click()"
          >
            <i-bi-upload class="me-1" /> Импорт CSV
          </BButton>
          <input
            type="file"
            ref="csvInput"
            accept=".csv"
            style="display: none"
            @change="importCSV($event)"
          />
        </div>
      </div>

      <div v-if="classes.length === 0" class="text-center py-5">
        <div class="mb-3 text-muted opacity-25">
          <i class="bi bi-folder2-open" style="font-size: 4rem"></i>
        </div>
        <h5 class="text-muted">Список пуст</h5>
        <p class="small text-muted mb-4">
          Создайте первый класс, чтобы начать работу
        </p>
        <BButton variant="outline-primary" @click="showModal = true"
          >Создать</BButton
        >
      </div>

      <div v-else class="row g-4">
        <div v-for="cls in classes" :key="cls.id" class="col-md-6 col-lg-4">
          <div
            class="card h-100 border-0 shadow-sm hover-lift overflow-hidden position-relative"
          >
            <div
              class="position-absolute top-0 start-0 w-100"
              style="height: 6px"
              :class="getRandomColor(cls.id)"
            ></div>

            <div class="card-body p-4 d-flex flex-column">
              <div
                class="d-flex justify-content-between align-items-start mb-3"
              >
                <h4
                  class="fw-bold text-dark mb-0 text-truncate"
                  :title="cls.name"
                >
                  {{ cls.name }}
                </h4>
                <div class="dropdown">
                  <button
                    class="btn btn-link text-muted p-0"
                    @click.stop="handleDelete(cls)"
                  >
                    <i-bi-trash />
                  </button>
                </div>
              </div>

              <div class="d-flex gap-2 mb-4">
                <span class="badge bg-light text-dark border fw-normal">
                  <i class="bi bi-person-fill text-muted me-1"></i>
                  {{ cls.students?.length || 0 }} учеников
                </span>
                <span class="badge bg-light text-dark border fw-normal">
                  <i class="bi bi-calendar3 text-muted me-1"></i>
                  {{ new Date(Number(cls.id)).toLocaleDateString() }}
                </span>
              </div>

              <div class="mt-auto d-grid gap-2 position-relative z-3">
                <BButton
                  :to="{ name: 'ClassEditor', params: { id: cls.id } }"
                  variant="outline-primary"
                  class="w-100 fw-bold border-2 rounded-3"
                >
                  Открыть настройки
                </BButton>
                <BButton
                  :to="{ name: 'Generator', params: { id: cls.id } }"
                  variant="success"
                  class="fw-bold shadow-sm"
                >
                  <i class="bi bi-magic me-2"></i>Рассадить
                </BButton>
                <router-link
                  :to="`/class/${cls.id}/history`"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="true"
                >
                  <i-bi-clock-history /> История
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BModal
        v-model="showModal"
        title="Создание класса"
        centered
        ok-title="Создать"
        cancel-title="Отмена"
        @ok="addNewClass(newClassName)"
      >
        <div class="py-2">
          <label class="form-label text-muted small fw-bold text-uppercase"
            >Название</label
          >
          <BFormInput
            v-model="newClassName"
            placeholder="Например: 10 'Б'"
            size="lg"
            autofocus
            class="fw-bold"
            @keyup.enter="
              addNewClass(newClassName);
              showModal = false;
            "
          />
          <div class="form-text mt-2">
            Вы сможете изменить настройки рассадки позже.
          </div>
        </div>
      </BModal>
    </div>
  </BApp>
  <router-view />
</template>

<style scoped>
.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.1) !important;
}

.stretched-link::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  content: "";
}

.btn-link {
  position: relative;
  z-index: 2;
}
.btn-link:hover {
  color: #dc3545 !important;
}
</style>
