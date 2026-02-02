<script setup>
/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
const props = defineProps({
  config: Object,
  seating: Array,
});

const getSeatData = (row, col) => {
  if (!props.seating || !Array.isArray(props.seating)) return null;
  return props.seating.find((s) => s.Row === row && s.Column === col);
};

const getStudentName = (row, col) => {
  const data = getSeatData(row, col);
  if (!data || data.Student === "-") return "";
  return data.Student;
};

const getSeatStyle = (row, col) => {
  const seat = getSeatData(row, col);

  if (!seat || seat.StudentID === -1 || seat.Student === "-") {
    return { backgroundColor: "white" };
  }

  const level = seat.Satisfaction?.Level ?? 0.5;
  const hue = level * 120;
  return {
    backgroundColor: `hsl(${hue}, 85%, 92%)`,
    color: `hsl(${hue}, 90%, 15%)`,
    transition: "all 0.5s ease",
  };
};

const vFitText = {
  mounted: (el) => adjustFontSize(el),
  updated: (el) => adjustFontSize(el),
};

const adjustFontSize = (el) => {
  const parent = el.parentElement;
  if (!parent) return;

  const maxFontSize = 14;
  const minFontSize = 8;

  el.style.fontSize = maxFontSize + "px";
  el.style.display = "inline-block";
  el.style.whiteSpace = "nowrap";

  let currentSize = maxFontSize;

  const maxWidth = parent.clientWidth - 8;

  while (el.offsetWidth > maxWidth && currentSize > minFontSize) {
    currentSize--;
    el.style.fontSize = currentSize + "px";
  }
};
</script>
<template>
  <div class="desks-container d-flex flex-column gap-4 p-4">
    <div
      class="blackboard bg-dark mt-2 mx-auto rounded d-flex align-items-center justify-content-center text-white mb-5"
    >
      ДОСКА
    </div>
    <div
      v-for="row in config.rows"
      :key="row"
      class="desk-row d-flex gap-4 justify-content-center"
    >
      <div
        class="row-marker d-flex align-items-center justify-content-center text-muted fw-bold small"
      >
        {{ row }}
      </div>

      <div
        v-for="col in config.columns"
        :key="col"
        class="desk-unit shadow-sm bg-white rounded border d-flex overflow-hidden"
        :class="config.deskType"
      >
        <template v-if="config.deskType === 'double'">
          <div
            class="seat flex-fill d-flex align-items-center justify-content-center p-1 border-end"
            :style="getSeatStyle(row - 1, (col - 1) * 2)"
          >
            <span class="student-name" v-fit-text>{{
              getStudentName(row - 1, (col - 1) * 2)
            }}</span>
          </div>
          <div
            class="seat flex-fill d-flex align-items-center justify-content-center p-1"
            :style="getSeatStyle(row - 1, (col - 1) * 2 + 1)"
          >
            <span class="student-name" v-fit-text>{{
              getStudentName(row - 1, (col - 1) * 2 + 1)
            }}</span>
          </div>
        </template>

        <template v-else>
          <div
            class="seat flex-fill d-flex align-items-center justify-content-center p-1"
            :style="getSeatStyle(row - 1, col - 1)"
          >
            <span class="student-name small fw-medium" v-fit-text>{{
              getStudentName(row - 1, col - 1)
            }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classroom-canvas {
  background: white;
  padding: 60px 100px;
  border-radius: 8px;
  min-width: 800px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seat {
  width: 110px;
  min-width: 0;
  overflow: hidden;
}

.blackboard {
  width: 300px;
  height: 40px;
  background: #334155;
}

.desk-unit {
  transition: all 0.3s;
}

.desk-unit.single {
  width: 110px;
  height: 65px;
}

.desk-unit.double {
  width: 220px;
  height: 65px;
}
</style>
