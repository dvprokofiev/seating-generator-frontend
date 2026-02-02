<script setup>
/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { computed, onMounted, watch, ref } from "vue";
import { useRoute } from "vue-router";
import useClasses from "./composables/useClasses.js";
import Papa from "papaparse";
const csvInput = ref(null);

const route = useRoute();
const {
  classes,
  hasErrors,
  loadClasses,
  checkName,
  getValidationErrors,
  saveClasses,
} = useClasses();
const showVisualizer = ref(false);
const currentStudent = ref(null);
const editMode = ref("");
const selection = ref({ rows: [], cols: [] });

const handleSave = () => {
  if (hasErrors.value) return false;
  saveClasses();
  showSuccessToast.value = true;
  return true;
};

const cls = computed(() => {
  const c = classes.value.find((x) => x.id == route.params.id);
  if (c) {
    if (!c.students) c.students = [];
    if (!c.classConfig)
      c.classConfig = { rows: 3, columns: 2, deskType: "double" };
  }
  return c;
});

const addStudent = () => {
  cls.value.students.push({
    id: Date.now(),
    name: "",
    preferredRows: "",
    preferredColumns: "",
    medicalPreferredRow: "",
    medicalPreferredColumn: "",
  });
};

const openVisualizer = (student, mode) => {
  currentStudent.value = student;
  editMode.value = mode;
  selection.value.rows = [];
  selection.value.cols = [];

  const rVal =
    mode === "prefs" ? student.preferredRows : student.medicalPreferredRow;
  const cVal =
    mode === "prefs"
      ? student.preferredColumns
      : student.medicalPreferredColumn;

  if (rVal) {
    rVal.split(",").forEach((r) => {
      const num = parseInt(r.trim());
      if (!isNaN(num)) selection.value.rows.push(num);
    });
  }
  if (cVal) {
    cVal.split(",").forEach((c) => {
      const num = parseInt(c.trim());
      if (!isNaN(num)) selection.value.cols.push(num);
    });
  }
  showVisualizer.value = true;
};

const getSeatIndices = (colNum) => {
  if (cls.value.classConfig.deskType === "double") {
    return [colNum * 2 - 1, colNum * 2];
  }
  return [colNum];
};

const isColSelected = (colNum) => {
  const indices = getSeatIndices(colNum);
  return indices.every((idx) => selection.value.cols.includes(idx));
};

const toggleCol = (colNum) => {
  const indices = getSeatIndices(colNum);
  const alreadySelected = isColSelected(colNum);

  if (alreadySelected) {
    selection.value.cols = selection.value.cols.filter(
      (id) => !indices.includes(id)
    );
  } else {
    indices.forEach((idx) => {
      if (!selection.value.cols.includes(idx)) {
        selection.value.cols.push(idx);
      }
    });
  }
};

const toggleRow = (rowNum) => {
  const idx = selection.value.rows.indexOf(rowNum);
  if (idx > -1) {
    selection.value.rows.splice(idx, 1);
  } else {
    selection.value.rows.push(rowNum);
  }
};

const saveVisualSelection = () => {
  if (!currentStudent.value) return;
  const rRes = selection.value.rows.sort((a, b) => a - b).join(", ");
  const cRes = selection.value.cols.sort((a, b) => a - b).join(", ");

  if (editMode.value === "prefs") {
    currentStudent.value.preferredRows = rRes;
    currentStudent.value.preferredColumns = cRes;
  } else {
    currentStudent.value.medicalPreferredRow = rRes;
    currentStudent.value.medicalPreferredColumn = cRes;
  }
};
const exportToCSV = () => {
  const configHeader = `CONFIG;${cls.value.name};${cls.value.classConfig.rows};${cls.value.classConfig.columns};${cls.value.classConfig.deskType}`;
  const data = cls.value.students.map((s) => {
    const friendPair = cls.value.preferences.find((p) => p.includes(s.name));
    const friendName = friendPair
      ? friendPair.find((name) => name !== s.name)
      : "";

    const enemyPair = cls.value.forbidden?.find((p) => p.includes(s.name));
    const enemyName = enemyPair
      ? enemyPair.find((name) => name !== s.name)
      : "";

    return {
      Имя: s.name,
      Парты: s.preferredRows,
      Ряды: s.preferredColumns,
      Мед_Парты: s.medicalPreferredRow,
      Мед_Ряды: s.medicalPreferredColumn,
      Дружит_с: friendName,
      Враждует_с: enemyName,
    };
  });

  const csvData = Papa.unparse(data);

  const finalContent = configHeader + "\n" + csvData;

  const blob = new Blob(["\ufeff" + finalContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${cls.value.name}.csv`);
  link.click();
};
const showSuccessToast = ref(false);
const showErrorsModal = ref(false);
onMounted(() => loadClasses());
</script>
<template>
  <div
    class="toast-container position-fixed top-0 end-0 p-3"
    style="z-index: 2000"
  >
    <BToast v-model="showSuccessToast" variant="success" :delay="2000">
      <div class="d-flex align-items-center">
        <i-bi-check-circle-fill />
        Класс успешно сохранена!
      </div>
    </BToast>
  </div>
  <div class="p-3" v-if="cls">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center gap-3">
        <BButton variant="outline-secondary" @click="$router.back()"
          >&larr;</BButton
        >
        <h2 class="m-0">{{ cls.name }}</h2>
        <BButton
          variant="outline-primary"
          :disabled="hasErrors"
          @click="handleSave"
          >Сохранить класс</BButton
        >
        <i-bi-exclamation-triangle-fill
          v-if="hasErrors"
          variant="link"
          class="p-0 text-danger border-0 shadow-none"
          @click="showErrorsModal = true"
          v-b-tooltip.hover="'Нажмите, чтобы увидеть ошибки'"
          type="button"
        ></i-bi-exclamation-triangle-fill>
      </div>
    </div>

    <BTabs content-class="mt-3">
      <BTab title="Ученики" class="p-4 bg-light">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 class="fw-bold mb-1">Список класса</h5>
            <div class="text-muted small">
              Всего учеников: {{ cls.students.length }}
            </div>
          </div>
          <div class="d-flex gap-2">
            <BButton variant="outline-success" size="sm" @click="exportToCSV">
              <i-bi-download class="me-1" /> Экспорт CSV
            </BButton>
          </div>
        </div>
        <div v-if="!cls.students?.length" class="text-center py-5 text-muted">
          <div class="display-1 text-muted opacity-25 mb-3">
            <i-bi-people />
          </div>
          <p>В классе пока никого нет.</p>
          <BButton variant="outline-primary" size="sm" @click="addStudent"
            >Добавить первого</BButton
          >
        </div>

        <div
          v-else
          class="d-flex flex-column gap-3"
          style="
            max-height: 60vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
          "
        >
          <div
            v-for="(student, index) in cls.students"
            :key="index"
            class="bg-white rounded-3 shadow-sm border p-3 d-flex align-items-center gap-4 position-relative group-hover-action"
            style="transition: transform 0.2s"
          >
            <div
              class="text-muted fw-bold opacity-25 small"
              style="min-width: 20px"
            >
              {{ index + 1 }}
            </div>

            <div style="flex: 2; min-width: 200px">
              <label class="small text-muted mb-1 d-block">Имя</label>
              <BFormInput
                v-model="student.name"
                class="border-0 bg-light fw-bold text-dark px-3 py-2"
                placeholder="Введите имя..."
              />
            </div>

            <div
              class="bg-primary-subtle rounded p-2 d-flex gap-3 align-items-center"
              style="flex: 3"
            >
              <div class="d-flex flex-column" style="flex: 1">
                <label class="tiny-label text-primary fw-bold mb-1"
                  >Парты</label
                >
                <BFormInput
                  v-model="student.preferredRows"
                  size="sm"
                  class="border-primary-subtle bg-white text-center"
                  placeholder="Любой"
                />
              </div>
              <div class="d-flex flex-column" style="flex: 1">
                <label class="tiny-label text-primary fw-bold mb-1">Ряды</label>
                <BFormInput
                  v-model="student.preferredColumns"
                  size="sm"
                  class="border-primary-subtle bg-white text-center"
                  placeholder="Любая"
                />
              </div>
              <BButton
                variant="white"
                size="sm"
                class="text-primary border-0 rounded-circle shadow-sm"
                style="width: 32px; height: 32px"
                @click="openVisualizer(student, 'prefs')"
                title="Выбрать на схеме"
              >
                <i-bi-map-fill />
              </BButton>
            </div>

            <div
              class="bg-danger-subtle rounded p-2 d-flex gap-3 align-items-center"
              style="flex: 3"
            >
              <div class="d-flex flex-column" style="flex: 1">
                <label class="tiny-label text-danger fw-bold mb-1"
                  >Медицинские парты</label
                >
                <BFormInput
                  v-model="student.medicalPreferredRow"
                  size="sm"
                  class="border-danger-subtle bg-white text-center"
                  placeholder="-"
                />
              </div>
              <div class="d-flex flex-column" style="flex: 1">
                <label class="tiny-label text-danger fw-bold mb-1"
                  >Медицинские ряды</label
                >
                <BFormInput
                  v-model="student.medicalPreferredColumn"
                  size="sm"
                  class="border-danger-subtle bg-white text-center"
                  placeholder="-"
                />
              </div>
              <BButton
                variant="white"
                size="sm"
                class="text-danger border-0 rounded-circle shadow-sm"
                style="width: 32px; height: 32px"
                @click="openVisualizer(student, 'medical')"
                title="Выбрать на схеме"
              >
                <i-bi-heart-pulse-fill />
              </BButton>
            </div>

            <div>
              <BButton
                variant="outline-secondary"
                size="sm"
                class="border-0 text-muted hover-danger"
                @click="cls.students.splice(index, 1)"
              >
                <i-bi-trash />
              </BButton>
            </div>
          </div>
        </div>

        <div class="text-center mt-4" v-if="cls.students.length > 0">
          <BButton
            variant="outline-primary"
            @click="addStudent"
            class="rounded-pill px-4"
          >
            <i-bi-person-plus-fill /> Добавить
          </BButton>
        </div>
      </BTab>

      <BTab title="Предпочтения" class="p-4">
        <datalist id="students-list">
          <option v-for="s in cls.students" :key="s.id" :value="s.name" />
        </datalist>

        <div class="row g-5">
          <div class="col-md-6">
            <div
              class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2"
            >
              <h6 class="text-success fw-bold m-0">
                <i class="bi bi-heart-fill me-2"></i>Вместе
              </h6>
              <BBadge variant="success" pill>{{
                cls.preferences.length
              }}</BBadge>
            </div>

            <div class="d-flex flex-column gap-2">
              <div
                v-for="(p, i) in cls.preferences"
                :key="'p' + i"
                class="d-flex align-items-center gap-2 bg-light rounded p-2 border-start border-4 border-success position-relative group"
              >
                <BFormInput
                  v-model="p[0]"
                  :state="checkName(p[0], cls)"
                  list="students-list"
                  autocomplete="off"
                  placeholder="Кто"
                  class="border-0 bg-transparent shadow-none"
                />

                <i class="bi bi-plus-lg text-success small"></i>

                <BFormInput
                  v-model="p[1]"
                  :state="checkName(p[1], cls)"
                  list="students-list"
                  autocomplete="off"
                  placeholder="С кем"
                  class="border-0 bg-transparent shadow-none"
                />

                <BButton
                  variant="link"
                  class="text-secondary p-0 px-2"
                  @click="cls.preferences.splice(i, 1)"
                  title="Удалить"
                >
                  <i-bi-trash />
                </BButton>
              </div>

              <BButton
                variant="outline-success"
                size="sm"
                @click="cls.preferences.push(['', ''])"
                class="mt-2 border-dashed opacity-75"
              >
                + Добавить пару
              </BButton>
            </div>
          </div>

          <div class="col-md-6">
            <div
              class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2"
            >
              <h6 class="text-danger fw-bold m-0">
                <i class="bi bi-slash-circle-fill me-2"></i>Раздельно
              </h6>
              <BBadge variant="danger" pill>{{
                cls.forbidden?.length || 0
              }}</BBadge>
            </div>

            <div class="d-flex flex-column gap-2">
              <div
                v-for="(f, i) in cls.forbidden"
                :key="'f' + i"
                class="d-flex align-items-center gap-2 bg-light rounded p-2 border-start border-4 border-danger position-relative group"
              >
                <BFormInput
                  v-model="f[0]"
                  :state="checkName(f[0], cls)"
                  list="students-list"
                  autocomplete="off"
                  placeholder="Кто"
                  class="border-0 bg-transparent shadow-none"
                />

                <span class="text-danger fw-bold small">/</span>

                <BFormInput
                  v-model="f[1]"
                  :state="checkName(f[1], cls)"
                  list="students-list"
                  autocomplete="off"
                  placeholder="С кем"
                  class="border-0 bg-transparent shadow-none"
                />

                <BButton
                  variant="link"
                  class="text-secondary p-0 px-2"
                  @click="cls.forbidden.splice(i, 1)"
                  title="Удалить"
                >
                  <i-bi-trash />
                </BButton>
              </div>

              <BButton
                variant="outline-danger"
                size="sm"
                @click="(cls.forbidden || (cls.forbidden = [])).push(['', ''])"
                class="mt-2 border-dashed opacity-75"
              >
                + Добавить запрет
              </BButton>
            </div>
          </div>
        </div>
      </BTab>

      <BTab title="Настройки" class="p-4">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <div class="mb-5">
              <h6 class="text-muted text-uppercase small fw-bold mb-3 ls-1">
                Основная информация
              </h6>
              <div
                class="bg-light p-4 rounded-3 border-start border-4 border-primary shadow-sm"
              >
                <BFormGroup
                  label="Название класса"
                  label-class="fw-bold text-dark small mb-1"
                >
                  <BFormInput
                    v-model="cls.name"
                    size="lg"
                    placeholder="Например: 10 'В'"
                    class="border-0 bg-white shadow-none fw-bold text-primary"
                  />
                </BFormGroup>
              </div>
            </div>
            <div>
              <h6 class="text-muted text-uppercase small fw-bold mb-3 ls-1">
                Геометрия кабинета
              </h6>
              <div class="bg-white p-4 rounded-3 border shadow-sm">
                <div class="row g-4">
                  <div class="col-6">
                    <label class="d-block small text-muted mb-2">Ряды</label>
                    <div class="d-flex align-items-center gap-3">
                      <div
                        class="bg-light rounded-circle p-2 text-primary d-flex align-items-center justify-content-center"
                        style="width: 40px; height: 40px"
                      >
                        <i-bi-grid />
                      </div>
                      <BFormInput
                        type="number"
                        v-model.number="cls.classConfig.columns"
                        min="1"
                        class="form-control-lg border-0 bg-light fw-bold"
                        style="max-width: 80px; text-align: center"
                      />
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="d-block small text-muted mb-2"
                      >Парт в ряду</label
                    >
                    <div class="d-flex align-items-center gap-3">
                      <div
                        class="bg-light rounded-circle p-2 text-primary d-flex align-items-center justify-content-center"
                        style="width: 40px; height: 40px"
                      >
                        <i-bi-distribute-vertical />
                      </div>
                      <BFormInput
                        type="number"
                        v-model.number="cls.classConfig.rows"
                        min="1"
                        class="form-control-lg border-0 bg-light fw-bold"
                        style="max-width: 80px; text-align: center"
                      />
                    </div>
                  </div>

                  <div class="col-12">
                    <hr class="text-muted opacity-25 my-2" />
                  </div>
                  <div class="col-12">
                    <label class="d-block small text-muted mb-2"
                      >Тип рассадки</label
                    >
                    <div class="d-flex gap-3">
                      <div
                        class="flex-fill border rounded p-3 cursor-pointer position-relative overflow-hidden"
                        :class="
                          cls.classConfig.deskType === 'double'
                            ? 'border-primary bg-primary-subtle'
                            : 'bg-light border-light'
                        "
                        @click="cls.classConfig.deskType = 'double'"
                        style="cursor: pointer; transition: all 0.2s"
                      >
                        <div class="d-flex align-items-center gap-2 mb-1">
                          <i
                            class="bi bi-people-fill"
                            :class="
                              cls.classConfig.deskType === 'double'
                                ? 'text-primary'
                                : 'text-muted'
                            "
                          ></i>
                          <span
                            class="fw-bold small"
                            :class="
                              cls.classConfig.deskType === 'double'
                                ? 'text-dark'
                                : 'text-muted'
                            "
                            >Двойные</span
                          >
                        </div>
                        <div
                          class="small text-muted"
                          style="font-size: 0.75rem"
                        >
                          По 2 ученика за партой
                        </div>
                      </div>
                      <div
                        class="flex-fill border rounded p-3 cursor-pointer position-relative overflow-hidden"
                        :class="
                          cls.classConfig.deskType === 'single'
                            ? 'border-primary bg-primary-subtle'
                            : 'bg-light border-light'
                        "
                        @click="cls.classConfig.deskType = 'single'"
                        style="cursor: pointer; transition: all 0.2s"
                      >
                        <div class="d-flex align-items-center gap-2 mb-1">
                          <i
                            class="bi bi-person-fill"
                            :class="
                              cls.classConfig.deskType === 'single'
                                ? 'text-primary'
                                : 'text-muted'
                            "
                          ></i>
                          <span
                            class="fw-bold small"
                            :class="
                              cls.classConfig.deskType === 'single'
                                ? 'text-dark'
                                : 'text-muted'
                            "
                            >Одинарные</span
                          >
                        </div>
                        <div
                          class="small text-muted"
                          style="font-size: 0.75rem"
                        >
                          По 1 ученику за партой
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BTab>
    </BTabs>

    <BModal
      v-model="showVisualizer"
      title="Выбор мест"
      size="lg"
      centered
      @ok="saveVisualSelection"
      ok-title="Сохранить"
      cancel-title="Отмена"
    >
      <div class="d-flex flex-column align-items-center">
        <div class="w-100 d-flex justify-content-center mb-5">
          <div
            class="bg-dark text-white rounded px-5 py-2 small fw-bold shadow-sm"
            style="width: 30%"
          >
            <center>ДОСКА</center>
          </div>
        </div>

        <div class="d-flex gap-3 mb-4 small text-muted">
          <div class="d-flex align-items-center gap-1">
            <div
              class="border rounded bg-success"
              style="width: 16px; height: 16px"
            ></div>
            Ряд
          </div>
          <div class="d-flex align-items-center gap-1">
            <div
              class="border rounded bg-primary"
              style="width: 16px; height: 16px"
            ></div>
            Парта
          </div>
        </div>

        <div
          class="d-flex justify-content-center gap-4 p-4 bg-light rounded border"
        >
          <div
            v-for="colNum in cls.classConfig.columns"
            :key="colNum"
            class="d-flex flex-column align-items-center gap-3"
          >
            <button
              class="btn btn-sm fw-bold border-0 mb-2"
              :class="isColSelected(colNum) ? 'text-success' : 'text-muted'"
              @click="toggleCol(colNum)"
            >
              Ряд {{ colNum }}
            </button>

            <div
              v-for="rowNum in cls.classConfig.rows"
              :key="rowNum"
              class="d-flex gap-2 align-items-center position-relative"
            >
              <div
                v-if="colNum === 1"
                class="text-muted small position-absolute"
                style="
                  right: 100%;
                  margin-right: 15px;
                  font-size: 10px;
                  white-space: nowrap;
                "
              >
                {{ rowNum }}
              </div>

              <div
                class="d-flex gap-1 p-1 border rounded bg-white shadow-sm"
                :class="{
                  'border-success bg-success-subtle': isColSelected(colNum),
                  'border-primary': selection.rows.includes(rowNum),
                }"
                style="cursor: pointer"
                @click="toggleRow(rowNum)"
              >
                <div
                  v-for="seatIndex in getSeatIndices(colNum)"
                  :key="seatIndex"
                  class="d-flex align-items-center justify-content-center border rounded-1"
                  :class="
                    selection.rows.includes(rowNum) ||
                    selection.cols.includes(seatIndex)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-light border-light-subtle text-muted'
                  "
                  style="width: 24px; height: 24px; font-size: 10px"
                >
                  <i-bi-check-lg
                    v-if="
                      selection.rows.includes(rowNum) ||
                      selection.cols.includes(seatIndex)
                    "
                  ></i-bi-check-lg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BModal>
    <BModal
      v-model="showErrorsModal"
      title="Ошибки валидации"
      ok-only
      ok-title="Понятно"
    >
      <div class="alert alert-danger" v-if="getValidationErrors(cls).length">
        <ul class="mb-0">
          <li v-for="(err, index) in getValidationErrors(cls)" :key="index">
            {{ err }}
          </li>
        </ul>
      </div>
      <p v-else class="text-success">Ошибок не обнаружено.</p>
    </BModal>
  </div>
</template>
