<template>
    <div :key="`${machineId}-${machineName}`">
      <h5 
        class="q-pt-1 q-pb-1 q-mt-1 q-mb-1 text-primary"
      >
        {{ `${currentPage==0?'Waste':'Refill'} for ${machineName}` }}
      </h5>
    </div>
    <div v-if="loadingInventory">Loading inventory...</div>
    <div v-if="savingInventory">Saving inventory...</div>
    <div v-show="!loadingInventory && !savingInventory">
      <div v-show="currentPage==0">
        <!-- buttons -->
        <div class="row q-pb-md q-pt-0 q-mt-0">
          <div class="col-6 text-left q-pl-0 q-ml-0">
            <q-btn @click="cancelChanges" color="secondary" label="Cancel " />
          </div>
          <div class="col-6 text-right q-pr-0 q-mr-0">
            <q-btn @click="nextPage" color="primary" label="Next >" />
          </div>
        </div>
        <!-- row header -->
        <div class="row">
          <div class="col-1 col-xs-1 text-bold">
            Ch
          </div>
          <div class="col-5 col-xs-3 text-bold">
            Product
          </div>
          <div class="col-2 col-xs-2 q-pr-md text-bold q-text-danger" style="text-align: right;">
            Waste
          </div>
          <div class="col-2 col-xs-2 text-bold" style="text-align: right;">
            Stock after waste
          </div>
        </div>
        <!-- Inventory rows-->
        <div
          v-for="inventoryLine in inventoryLines"
          id="inventoryLine.channel"
          class="row"
          :class="inventoryLine.odd ? 'bg-success' : ''"
        >
          <div class="col-1 col-xs-1 q-pt-md q-pr-xs">
            {{ inventoryLine.channel }}
          </div>
          <div class="col-5 col-xs-3 q-pt-md">
            {{ inventoryLine.productName }}
          </div>
          <div class="col-2 col-xs-2 q-pr-md">
            <q-input v-model="inventoryLine.spoil" @change="setDirty(inventoryLine);updateBalance(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
          </div>
          <div class="col-2 col-xs-2">
            <q-input v-model="inventoryLine.newBalance" @change="setDirty(inventoryLine);updateSpoil(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
          </div>
        </div>
        <div class="row q-pb-md q-pt-0 q-mt-0">
          <div class="col-6 text-left q-pl-0 q-ml-0">
            <q-btn @click="cancelChanges" color="secondary" label="Cancel " />
          </div>
          <div class="col-6 text-right q-pr-0 q-mr-0">
            <q-btn @click="nextPage" color="primary" label="Next >" />
          </div>
        </div>
      </div>
      <!-- Second page - refill and outgoing balance -->
      <div v-show="currentPage==1">
        <div class="row q-pb-md q-pt-0 q-mt-0">
          <div class="col-6 text-left q-pl-0 q-ml-0">
            <q-btn @click="cancelChanges" color="secondary" label="Cancel " />
          </div>
          <div class="col-6 text-right q-pr-0 q-mr-0">
            <q-btn @click="saveChanges" color="primary" label="Save" />
          </div>
        </div>
        <div class="row">
          <div class="col-1 col-xs-1 text-bold">
            Ch
          </div>
          <div class="col-5 col-xs-3 text-bold">
            Product
          </div>
          <div class="col-2 col-xs-2 q-pr-md text-bold q-text-success" style="text-align: right;">
            Refill
          </div>
        </div>
        <div
          v-for="inventoryLine in inventoryLines"
          id="inventoryLine.channel"
          class="row"
          :class="inventoryLine.odd ? 'bg-success' : ''"
        >
          <div class="col-1 col-xs-1 q-pt-md q-pr-xs">
            {{ inventoryLine.channel }}
          </div>
          <div class="col-5 col-xs-3 q-pt-md">
            {{ inventoryLine.productName }}
          </div>
          <!-- div class="col-1 col-xs-2 q-pt-md q-pr-md " style="text-align: center">
            {{ inventoryLine.balance }}
          </div -->
          <div class="col-2 col-xs-2 q-pr-md">
            <q-input v-model="inventoryLine.resupply" @change="setDirty(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
          </div>
        </div>
        <div class="row q-pb-md q-pt-0 q-mt-0">
          <div class="col-6 text-left q-pl-0 q-ml-0">
            <q-btn @click="cancelChanges" color="secondary" label="Cancel " />
          </div>
          <div class="col-6 text-right q-pr-0 q-mr-0">
            <q-btn @click="saveChanges" color="primary" label="Save" />
          </div>
        </div>
      </div>
    </div>
</template>
<script>
import { ref, watch } from 'vue'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@vue/apollo-composable'

const GET_MACHINE_MENU_ITEMS = gql`
  query MenuItemsByMachineId($input: MenuItemsByMachineIdInput!) {
    menuItemsByMachineId(input: $input) {
      product {
        id
        texts {
          name
        }
      }
    }
  }
`;

const GET_INVENTORY_QUERY = gql`
  query StockTransactionV2machineInventory($machineId: ID!) {
    stockTransactionV2machineInventory(machineId: $machineId) {
      machineId
      channelInfo {
        channel
        balance
        productId
        product {
          texts {
            name
          }
        }
      }
    }
  }
`;

const UPDATE_MACHINE_ALL_INVENTORY = gql`
  mutation UpdateMachineAllInventory($input: megaUpdateMachineAllInventory!) {
    updateMachineAllInventory(input: $input) {
      machineId
    }
  }
`;

const UPDATE_MACHINE_ALL_REFILL = gql`
  mutation UpdateMachineAllRefill($input: megaUpdateMachineAllRefill!) {
    updateMachineAllRefill(input: $input) {
      machineId
    }
  }
`;


export default {
  name: 'Inventory',
  props: {
    driverId: String,
    machineId: String,
    machineName: String,
    // clearMachine: () => void(0)
  },
  setup(props) {
    const currentPage = ref(0);
    const savingInventory = ref(false);
    const machineId = props.machineId;
    const driverId = props.driverId;
    const inventoryLines = ref([]);
    const { result: menuItemsResult, loading: loadingMenuItems, error: erroMenuItems, refetch: refetchMenuItems } = useQuery(
      GET_MACHINE_MENU_ITEMS,
      { input: { machineId: machineId, includeUnavailable: true  },
    })
    const { result: inventoryResult, loading: loadingInventory, error: errorInventory, refetch } = useQuery(GET_INVENTORY_QUERY, {
      machineId
    });

    const { mutate: updateMachineAllInventory } = useMutation(UPDATE_MACHINE_ALL_INVENTORY);
    const { mutate: updateMachineAllRefill } = useMutation(UPDATE_MACHINE_ALL_REFILL);

    // Watch for changes in machineId prop
    watch(() => props.machineId, (newMachineId) => {
      refetch({ machineId: newMachineId });
      refetchMenuItems({ input: { machineId: newMachineId }})
    });

    // Watch for changes in the query result
    let odd = false;
    let menuItemProducts = [];
    watch(() => inventoryResult.value, (newResult) => {
      if (!loadingInventory.value && newResult) {
        console.log(newResult);
        inventoryLines.value = newResult.stockTransactionV2machineInventory.channelInfo.filter(r => r.product)
          .map((r) => {
            odd = !odd;
            return {
              machineId: props.machineId,
              channel: r.channel,
              productId: r.productId,
              productName: r.product.texts[0].name,
              balance: r.balance,
              spoil: 0,
              resupply: 0,
              newBalance: r.balance,
              odd: odd,
              dirty: false,
            };
          })
          .sort((a, b) => parseInt(a.channel) - parseInt(b.channel));
      }
    });
    watch(() => menuItemsResult.value, (newResult) => {
      console.log(newResult)
      menuItemProducts = newResult.menuItemsByMachineId.map( m => m.product.id );
    })
    refetch({ machineId })
    refetchMenuItems({ input: { machineId: machineId }})
    return {
      savingInventory,
      loadingInventory,
      errorInventory,
      inventoryLines,
      updateMachineAllInventory,
      updateMachineAllRefill,
      currentPage,
      inventoryResult,
      driverId,
      menuItemProducts,
    };
  },
  methods: {
    updateBalance(inventoryLine) {
      inventoryLine.newBalance = inventoryLine.newBalance - inventoryLine.spoil;
    },
    updateSpoil(inventoryLine) {
      return true;
      // inventoryLine.spoil = inventoryLine.newBalance - inventoryLine.balance;
    },
    setDirty(inventoryLine) {
      inventoryLine.dirty = true;
    },
    cancelChanges() {
      this.savingInventory = false;
      this.currentPage = 0;
      this.$emit('cancelled');
    },
    async saveChanges() {
      let spoilAndInventoryLines = [];
      let resupplyLines = [];
      this.savingInventory = true;
      for (const line of this.inventoryLines) {
        if (line.dirty) {
          const spoil = parseInt(line.spoil);
          if (spoil) {
            const input = {
              channel: line.channel,
              productId: line.productId,
              spoil: parseInt(line.spoil),
              balance: parseInt(line.newBalance),
            }
            spoilAndInventoryLines.push(input)
          }
          const resupply = parseInt(line.resupply)
          if (resupply) {
            const input = {
              channel: line.channel,
              productId: line.productId,
              refill: parseInt(line.resupply),
            }
            resupplyLines.push(input);
          }
        }
      }
      if (spoilAndInventoryLines.length) {
        const input = {
          machineId: this.machineId,
          who: this.driverId,
          transactionItems: spoilAndInventoryLines,
        }
        await this.updateMachineAllInventory({ input });
      }
      if (resupplyLines.length) {
        const input = {
          machineId: this.machineId,
          who: this.driverId,
          refillItems: resupplyLines,
        }
        await this.updateMachineAllRefill({ input });
      }
      this.savingInventory = false;
      this.$emit('saved');
    },
    async nextPage() {
      this.currentPage = 1;
      this.savingInventory = false;
    },
  }
}
</script>