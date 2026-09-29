<script setup>

import { ref, onMounted } from 'vue';
import { movimientoService } from '@/services/erpApi';

const movimientos = ref([]);
const cargando = ref(false);
const error = ref(null);

async function cargarMovimientos() {
    cargando.value = true;
    error.value = null;
    try {
        const respuesta = await movimientoService.getAll();
        movimientos.value = respuesta.data.datos;
    } catch (err) {
        error.value = 'No se pudo conectar con el servidor. Verifica que esté encendido.';
    } finally {
        cargando.value = false;
    }
}
onMounted(cargarMovimientos);

const nuevoMovimiento = ref({ concepto: '', tipo: 'Ingreso', monto: '' });

async function guardarMovimiento() {
    cargando.value = true;
    error.value = null;
    try {
        const respuesta = await movimientoService.create(nuevoMovimiento.value);
        movimientos.value.push(respuesta.data.datos); // Actualización reactiva
        nuevoMovimiento.value = { concepto: '', tipo: 'Ingreso', monto: '' }; // Limpiar
    } catch (err) {
        // Captura el mensaje específico del backend (ej: "El monto debe ser positivo")
        error.value = err.response?.data?.mensaje || 'Error al guardar el movimiento';
    } finally {
        cargando.value = false;
    }
}

import { computed } from 'vue';
const totalIngresos = computed(() => {
    return movimientos.value.filter(m => m.tipo === 'Ingreso').reduce((sum, m) => sum
        + m.monto, 0);
});
const totalEgresos = computed(() => {
    return movimientos.value.filter(m => m.tipo === 'Egreso').reduce((sum, m) => sum +
        m.monto, 0);
});

const saldo = computed(() => totalIngresos.value - totalEgresos.value);
</script>

<template>
  <v-container fluid>
    <!-- Encabezado de la Vista -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">
            <v-icon size="large" color="primary" class="mr-2">mdi-cash-register</v-icon>
            Motor Contable ERP
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1 mb-0">
            Gestión y registro de ingresos y egresos en tiempo real
          </p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="cargando"
          @click="cargarMovimientos"
        >
          Actualizar
        </v-btn>
      </v-col>
    </v-row>

    <!-- Alerta de Error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Tarjetas KPIs Computadas -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 border-start border-success border-opacity-100 border-4">
          <div class="text-overline text-grey">Total Ingresos</div>
          <div class="text-h4 font-weight-bold text-success">
            ${{ totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 border-start border-error border-opacity-100 border-4">
          <div class="text-overline text-grey">Total Egresos</div>
          <div class="text-h4 font-weight-bold text-error">
            ${{ totalEgresos.toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="pa-4 border-start border-info border-opacity-100 border-4">
          <div class="text-overline text-grey">Saldo Neto</div>
          <div :class="['text-h4 font-weight-bold', saldo >= 0 ? 'text-primary' : 'text-error']">
            ${{ saldo.toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Formulario para Registrar Movimiento -->
    <v-card class="mb-6 pa-4" elevation="2">
      <v-card-title class="text-h6 font-weight-bold px-0 pt-0 mb-2">
        <v-icon class="mr-2">mdi-plus-circle-outline</v-icon>
        Registrar Nuevo Movimiento
      </v-card-title>
      <v-form @submit.prevent="guardarMovimiento">
        <v-row density="compact">
          <v-col cols="12" sm="5">
            <v-text-field
              v-model="nuevoMovimiento.concepto"
              label="Concepto / Descripción"
              placeholder="Ej. Venta de servicio, Pago de servicio"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="nuevoMovimiento.tipo"
              :items="['Ingreso', 'Egreso']"
              label="Tipo de Movimiento"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="2">
            <v-text-field
              v-model.number="nuevoMovimiento.monto"
              label="Monto ($)"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>
          <v-col cols="12" sm="2" class="d-flex align-center">
            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="cargando"
            >
              Guardar
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <!-- Tabla de Movimientos -->
    <v-card elevation="2">
      <v-card-title class="text-h6 font-weight-bold pa-4 pb-2">
        Historial de Movimientos
      </v-card-title>
      
      <v-progress-linear v-if="cargando" indeterminate color="primary" />

      <v-table v-if="movimientos.length > 0">
        <thead>
          <tr>
            <th class="text-left font-weight-bold">ID</th>
            <th class="text-left font-weight-bold">Concepto</th>
            <th class="text-left font-weight-bold">Tipo</th>
            <th class="text-right font-weight-bold">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, index) in movimientos" :key="m.id || index">
            <td>{{ m.id || (index + 1) }}</td>
            <td>{{ m.concepto }}</td>
            <td>
              <v-chip
                :color="m.tipo === 'Ingreso' ? 'success' : 'error'"
                size="small"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ m.tipo }}
              </v-chip>
            </td>
            <td class="text-right font-weight-bold">
              ${{ Number(m.monto || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </v-table>

      <div v-else-if="!cargando" class="text-center py-8 text-grey">
        <v-icon size="64" class="mb-2">mdi-text-box-remove-outline</v-icon>
        <p class="text-subtitle-1">No hay movimientos registrados en el sistema.</p>
      </div>
    </v-card>
  </v-container>
</template>