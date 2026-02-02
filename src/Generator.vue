<script setup>
/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { ref, computed, onMounted, watch, nextTick, toRaw } from "vue";
import { useSeating } from "./composables/useSeating";
import useClasses from "./composables/useClasses";
import { useRoute, useRouter } from "vue-router";
import ClassMap from "./ClassMap.vue";
const route = useRoute();
const router = useRouter();
const { classes, loadClasses, saveSeating, saveClasses } = useClasses();
const {
  request,
  error,
  validateErrors,
  response,
  generateSeating,
  priorities,
} = useSeating();

const isLoaded = ref(false);
const isGenerating = ref(false);
onMounted(async () => {
  await loadClasses();
  const classId = route.params.id;
  const targetClass = classes.value.find((c) => c.id == classId);
  if (!targetClass) {
    alert("Класс не найден!");
    router.push("/");
    return;
  }

  isLoaded.value = false;

  if (targetClass.priorities) {
    priorities.value = JSON.parse(JSON.stringify(targetClass.priorities));
  }

  await nextTick();
  isLoaded.value = true;

  if (targetClass.classConfig) {
    request.value.classConfig = JSON.parse(
      JSON.stringify(targetClass.classConfig)
    );
  }

  if (targetClass.students) {
    request.value.students = JSON.parse(JSON.stringify(targetClass.students));
  }

  if (targetClass.preferences)
    request.value.preferences = JSON.parse(
      JSON.stringify(targetClass.preferences)
    );
  if (targetClass.forbidden)
    request.value.forbidden = JSON.parse(JSON.stringify(targetClass.forbidden));

  console.log(`Класс ${targetClass.name} загружен в генератор`);
});

const handleGenerate = async () => {
  if (validateErrors.value.length > 0) {
    error.value = "Исправьте ошибки ввода перед генерацией";
    return;
  }
  isGenerating.value = true;
  try {
    await generateSeating();
  } finally {
    isGenerating.value = false;
  }
};

const isToastVisible = ref(false);
const isWarnToastVisible = ref(false);

const handleSave = () => {
  const result = saveSeating(
    route.params.id,
    response.value,
    request.value.classConfig
  );

  if (result.success) {
    isToastVisible.value = true;
    setTimeout(() => {
      isToastVisible.value = false;
    }, 2000);
  } else if (result.reason === "duplicate") {
    isWarnToastVisible.value = true;
    setTimeout(() => {
      isWarnToastVisible.value = false;
    }, 2000);
  }
};

const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isPanning = ref(false);
const startX = ref(0);
const startY = ref(0);

const canvasStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: "center center",
  transition: isPanning.value
    ? "none"
    : "transform 0.2s cubic-bezier(0.25, 0.8, 0.5, 1)",
}));

const zoomIn = () => (scale.value = Math.min(scale.value + 0.15, 2.5));
const zoomOut = () => (scale.value = Math.max(scale.value - 0.15, 0.4));
const resetView = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

const onWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale.value = Math.min(Math.max(scale.value + delta, 0.4), 2.5);
};

const startPan = (e) => {
  isPanning.value = true;
  startX.value = e.clientX - translateX.value;
  startY.value = e.clientY - translateY.value;
  e.currentTarget.style.cursor = "grabbing";
};
const panning = (e) => {
  if (!isPanning.value) return;
  translateX.value = e.clientX - startX.value;
  translateY.value = e.clientY - startY.value;
};
const endPan = (e) => {
  isPanning.value = false;
  if (e.currentTarget) e.currentTarget.style.cursor = "grab";
};

watch(
  () => priorities.value,
  (newVal) => {
    if (!isLoaded.value) return;

    const classIdx = classes.value.findIndex(
      (c) => String(c.id) === String(route.params.id)
    );

    if (classIdx !== -1) {
      classes.value[classIdx].priorities = { ...toRaw(newVal) };

      saveClasses();
    }
  },
  { deep: true }
);
</script>
<template>
  <BApp>
    <div
      class="toast-container position-fixed top-0 end-0 p-3"
      style="z-index: 2000"
    >
      <BToast v-model="isToastVisible" variant="success" :delay="2000">
        <div class="d-flex align-items-center">
          <i-bi-check-circle-fill />
          Рассадка успешно сохранена!
        </div>
      </BToast>

      <BToast v-model="isWarnToastVisible" variant="warning" :delay="2000">
        <div class="d-flex align-items-center">
          <i-bi-exclamation-triangle-fill />
          Такая рассадка уже есть в сохраненных!
        </div>
      </BToast>
    </div>
    <BContainer fluid class="main-container p-0 h-100">
      <BRow class="h-100">
        <BCol
          md="3"
          lg="3"
          class="settings-panel bg-light border-end p-3 overflow-auto"
        >
          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Медицина</span>
              <span class="badge bg-primary fs-6">{{
                priorities.medical
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.medical"
              min="0"
              max="1"
              step="0.05"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Друзья вместе</span>
              <span class="badge bg-success fs-6">{{
                priorities.friends
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.friends"
              min="0"
              max="1"
              step="0.05"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Запрещенные пары</span>
              <span class="badge bg-danger fs-6">{{ priorities.enemies }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.enemies"
              min="0"
              max="1"
              step="0.05"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Предпочтения по рядам и партам</span>
              <span class="badge bg-warning fs-6">{{
                priorities.preferences
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.preferences"
              min="0"
              max="1"
              step="0.05"
            />
          </div>
          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Плотность заполнения</span>
              <span class="badge bg-info fs-6">{{ priorities.fill }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.fill"
              min="0"
              max="1"
              step="0.05"
            />
          </div>

          <div class="d-grid gap-2">
            <button
              class="btn btn-success btn-lg shadow fw-bold py-3 generate-btn"
              @click="handleGenerate"
              :disabled="isGenerating"
            >
              <span v-if="!isGenerating"><i-bi-magic />Рассадить!</span>
              <span v-else
                ><span class="spinner-border spinner-border-sm me-2"></span
                >Думаю...</span
              >
            </button>
            <BButton
              :disabled="!response || response.length === 0"
              @click="handleSave"
              variant="outline-primary"
              >Сохранить рассадку</BButton
            >
          </div>

          <div
            v-if="validateErrors.length"
            class="alert alert-danger mt-3 small"
          >
            <ul v-if="validateErrors.length" class="mb-0 ps-3 mt-1">
              <li v-for="e in validateErrors" :key="e">{{ e }}</li>
            </ul>
          </div>
        </BCol>

        <BCol class="p-0 position-relative bg-secondary-subtle overflow-hidden">
          <div
            class="canvas-controls position-absolute top-0 end-0 m-3 btn-group shadow bg-white rounded z-3"
          >
            <button
              class="btn btn-light border"
              @click="zoomOut"
              title="Уменьшить"
            >
              -
            </button>
            <button
              class="btn btn-light border px-3"
              @click="resetView"
              title="Сброс"
            >
              100%
            </button>
            <button
              class="btn btn-light border"
              @click="zoomIn"
              title="Увеличить"
            >
              +
            </button>
          </div>
          <div
            class="position-absolute bottom-0 start-0 m-3 z-3 text-muted small user-select-none"
          >
            <i class="bi bi-arrows-move"></i> Тяните мышкой для перемещения
          </div>
          <div
            class="viewport w-100 h-100 d-flex align-items-center justify-content-center"
            ref="viewportRef"
            @mousedown="startPan"
            @mousemove="panning"
            @mouseup="endPan"
            @mouseleave="endPan"
            @wheel.prevent="onWheel"
          >
            <div :style="canvasStyle">
              <ClassMap
                :config="request.classConfig"
                :seating="response"
              ></ClassMap>
            </div>
          </div>
        </BCol>
      </BRow>
    </BContainer>
  </BApp>
</template>

<style scoped>
.generate-btn {
  transition: all 0.2s;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 135, 84, 0.4);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.viewport {
  cursor: grab;
  background-color: rgb(223, 223, 223);
}
.form-select-xs {
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
}
.student-name {
  max-width: 100%;
  display: block;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
