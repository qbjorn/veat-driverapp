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
            <q-select v-model="driver" :options="driverOptions" label="Driver" />
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
              @saved="clearMachine"
              @cancelled="clearMachine"
              :saving-inventory="savingInventory"
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
import { ref, watch, inject } from 'vue'
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
export default {
  name: 'App',
  components: {
    Inventory
  },
  data: function() {
    return {
      machine: null,
      driver: null,
      version: version,
    }
  },
  setup() {
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

    return {
      machines,
      loadingMachines,
      errorDrivers,
      loadingDrivers,
      machineOptions,
      driverOptions,
      savingInventory,
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
