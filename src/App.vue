<template>
  <div>
    <!-- Overlay -->
    <div v-if="savingInventory" class="overlay">
      <div class="overlay-content">
        <q-spinner size="100px" />
        <p>Saving changes...</p>
      </div>
    </div>

    <q-toolbar class="text-white bg-primary">
      <q-btn flat round dense>
        <q-icon name="menu" />
      </q-btn>
      <q-toolbar-title>
        VEAT Driver (v{{ version }})
      </q-toolbar-title>
      <q-btn flat round dense>
        <q-icon name="more_vert" />
      </q-btn>
    </q-toolbar>
    <!-- driver -->
    <q-card>
      <q-card-section>
        {{ drivers  }}
        <p v-if="error">Something went wrong...</p>
          <p v-if="!loadingDrivers">
            <div class="row items-center q-gutter-md">
              <q-select v-model="driver" :options="driverOptions" label="Driver" class="col" />
              <q-input
                v-model="refillDate"
                type="date"
                label="Date"
                :dense="true"
                style="width: 130px;"
              />
            </div>
          </p>
          <p v-else>
            Loading drivers...
          </p>
      </q-card-section>
      <!-- machine -->
      <q-card-section v-show="driver">
        <p v-if="error">Something went wrong...</p>
          <p v-show="!loadingMachines">
            <q-select v-model="machine" :options="machineOptions" label="Location" />
            <Inventory
              v-if="driver && machine !== null"
              :driver-id="driver?.value || ''"
              :machine-id="machine.value || ''"
              :machine-name="machine.label || ''"
              :machine-info="selectedMachineInfo"
              @saved="clearMachine"
              @cancelled="clearMachine"
              :saving-inventory="savingInventory"
              :refill-date="refillDate"
            />
          </p>
          <p v-show="loadingMachines">
            Loading machines...
          </p>
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
import { ref, watch, computed, inject } from 'vue'
import { version } from '../package.json';
import gql from 'graphql-tag'
import { useQuery } from '@vue/apollo-composable'
import Inventory from './components/Inventory.vue'

const GET_ALL_USERS_QUERY = gql`
  query GetAllUsers($userType: userType) {
    getAllUsers(userType: $userType) {
      id
      realName
    }
  }
`;

const userType = {
    ADMIN: 'ADMIN',
    BACKOFFICE: 'BACKOFFICE',
    DRIVER: 'DRIVER'
}

const MACHINES_QUERY = gql`
  query Machines($activeOnly: Boolean) {
    machines(activeOnly: $activeOnly) {
      id
      location
      active
    }
  }
`

const MACHINE_BY_ID_QUERY = gql`
  query MachineById($id: ID!) {
    machineById(id: $id) {
      isOpen
      machineConfigs {
        key
        value
      }
    }
  }
`;

export default {
  name: 'App',
  components: {
    Inventory
  },
  data: function() {
    return {
      driver: null,
      version: version,
    }
  },
  setup() {
    const machine = ref(null);

   // 1. Add a ref for the selected machine ID
    const selectedMachineId = ref(null);

    // 2. Use useQuery for the machine info
    const { result: machineInfoResult } = useQuery(
      MACHINE_BY_ID_QUERY,
      () => ({ id: selectedMachineId.value }),
      { enabled: computed(() => !!selectedMachineId.value) }
    );
    watch(machineInfoResult, (val) => {
      console.log('App.vue: machineInfoResult changed:', val);
    });

    // 3. Watch machine and update selectedMachineId
    watch(machine, (newMachine) => {
      selectedMachineId.value = newMachine?.value || null;
    });

    // 4. Computed for the machine info
    const selectedMachineInfo = computed(() => machineInfoResult.value?.machineById || null);

    watch(selectedMachineInfo, (val) => {
      console.log('App.vue: selectedMachineInfo computed:', val);
    });

    const multilog = inject('multilog');
    const savingInventory = ref(false);
    const driverOptions = ref([]);
    const { 
      result: drivers,
      loading:loadingDrivers,
      error: errorDrivers,
    } = useQuery(
      GET_ALL_USERS_QUERY, {
        userType: userType.DRIVER
      }
    );
    watch(() => drivers.value, (newValue, oldValue) => {
      if (!loadingDrivers.value && newValue) {
        driverOptions.value = newValue.getAllUsers.map((r) => {
          return { value: r.id, label: r.realName };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      }
      refetchMachines({ activeOnly: true })
    });
    const machineOptions = ref([]);
    const {
      result: machines,
      loading: loadingMachines,
      error: errorMachines,
      refetch: refetchMachines,
    } = useQuery(MACHINES_QUERY, { activeOnly: true });

    // Populate machine options
    watch(() => machines.value, (newValue, oldValue) => {
      if (!loadingMachines.value && newValue) {
        // const bah = newValue.machines.filter( m => m.id === '44cce2b4-a3d5-4f6f-bede-894ecaffdc3e');
        const bah = newValue.machines;
        machineOptions.value = bah.map((r) => { // newValue.machines.map((r) => {
          return { value: r.id, label: r.location };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      }
    });

    // Add refillDate ref for date input
    const refillDate = ref(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD format

    return {
      machine,
      machines,
      loadingMachines,
      errorDrivers,
      loadingDrivers,
      machineOptions,
      driverOptions,
      savingInventory,
      selectedMachineInfo,
      refillDate,
    };
  },
  methods: {
    clearMachine() {
      this.machine = null;
    },
  }
}

</script>
<style scoped>
.bg-primary {
  background-color: #1b5e20 !important
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  text-align: center;
  color: white;
}
</style>